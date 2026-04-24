# ── Cell 1: Install ──────────────────────────────────────────────
pip install -q torchmetrics==1.3.2 huggingface_hub pillow tqdm
print('✅ Done')

# ── Cell 2: Imports & Config ─────────────────────────────────────
import os, random, warnings
from pathlib import Path
from datetime import datetime
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
warnings.filterwarnings('ignore')

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import torchvision.transforms as T
import torchvision.models as models
from torchvision.datasets import STL10
from torchmetrics import StructuralSimilarityIndexMeasure as SSIM_M
from torchmetrics import PeakSignalNoiseRatio as PSNR_M
from tqdm.notebook import tqdm

random.seed(42); np.random.seed(42)
torch.manual_seed(42); torch.cuda.manual_seed_all(42)
# NOTE: deterministic=True slows training ~10%.  Keep False for speed.
torch.backends.cudnn.benchmark = True

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'Device: {DEVICE}')
if torch.cuda.is_available():
    print(f'  GPU : {torch.cuda.get_device_name(0)}')
    print(f'  VRAM: {torch.cuda.get_device_properties(0).total_memory/1e9:.1f} GB')
else:
    print('  ⚠️  No GPU — training will be slow on CPU')

# ── RTX 3060 (6 GB) tuned config ─────────────────────────────────
# Key changes vs original:
#   base_filters 64 → 96   : more capacity without OOM
#   batch_size   8 → 6     : headroom for larger net + perceptual loss
#   epochs      20 → 30    : torch.compile recovers the time cost
#   alpha (SSIM) 0.5 → 0.75: SSIM was severely under-weighted (bug fix)
#   perceptual_w  NEW 0.10  : VGG feature loss — biggest quality boost
#   noise_std   0.01 → 0.02 : slightly more robustness training
#   adv_w        NEW 0.05   : cleaner GAN weight separate from loss_fn
CONFIG = {
    'image_size'   : 256,
    'batch_size'   : 6,      # ← reduced: 3060 6GB + bigger net
    'num_workers'  : 2,
    'epochs'       : 30,     # ← more epochs; compile makes it fast
    'lr'           : 1e-3,
    'beta'         : 0.75,   # reveal loss weight
    'alpha'        : 0.75,   # SSIM weight  (was effectively 0.1 — BUG FIX)
    'perceptual_w' : 0.10,   # VGG perceptual loss weight (NEW)
    'adv_w'        : 0.05,   # adversarial loss weight (NEW — was hardcoded 0.1)
    'noise_std'    : 0.02,
    'lr_patience'  : 5,
    'lr_factor'    : 0.5,
    'base_filters' : 96,     # ← was 64; more detail at 256×256
    'data_dir'     : '/content/data',
    'ckpt_dir'     : '/content/checkpoints',
    'use_compile'  : True,   # torch.compile — free ~20% speed on 3060
}
for d in [CONFIG['data_dir'], CONFIG['ckpt_dir']]:
    Path(d).mkdir(parents=True, exist_ok=True)

print(f'Config: size={CONFIG["image_size"]}  epochs={CONFIG["epochs"]}  bf={CONFIG["base_filters"]}')
print(f'        beta={CONFIG["beta"]}  alpha={CONFIG["alpha"]}  perceptual_w={CONFIG["perceptual_w"]}')


# ── Cell 3: Dataset (STL10) ──────────────────────────────────────
class StegoDataset(Dataset):
    def __init__(self, ds):
        self.ds = ds
        self.n  = len(ds)
    def __len__(self): return self.n
    def __getitem__(self, i):
        cover,  _ = self.ds[i]
        secret, _ = self.ds[random.randint(0, self.n-1)]
        return cover, secret

S = CONFIG['image_size']
tr_tf = T.Compose([
    T.Resize((S, S)),
    T.RandomHorizontalFlip(),
    T.ColorJitter(brightness=0.05, contrast=0.05),  # mild augment
    T.ToTensor(),
])
va_tf = T.Compose([T.Resize((S, S)), T.ToTensor()])

print('Downloading STL10 (~320 MB, once only)...')
stl_tr = STL10(CONFIG['data_dir'], split='train', download=True, transform=tr_tf)
stl_va = STL10(CONFIG['data_dir'], split='test',  download=True, transform=va_tf)

tr_ds = StegoDataset(stl_tr)
va_ds = StegoDataset(stl_va)
tr_ld = DataLoader(tr_ds, batch_size=CONFIG['batch_size'], shuffle=True,
                   num_workers=CONFIG['num_workers'], pin_memory=True,
                   persistent_workers=True)
va_ld = DataLoader(va_ds, batch_size=CONFIG['batch_size'], shuffle=False,
                   num_workers=CONFIG['num_workers'], pin_memory=True,
                   persistent_workers=True)
print(f'Train: {len(tr_ds):,} pairs  |  Val: {len(va_ds):,} pairs  |  Size: {S}×{S}')

# Quick preview
cov, sec = next(iter(va_ld))
fig, ax = plt.subplots(2, 6, figsize=(14, 5))
fig.patch.set_facecolor('#0d1117')
for i in range(6):
    for r, imgs, title, col in [
        (0, cov, 'Covers',  '#58a6ff'),
        (1, sec, 'Secrets', '#3fb950')
    ]:
        a = ax[r][i]; a.axis('off')
        a.imshow(imgs[i].permute(1,2,0).numpy())
        if i==0: a.set_ylabel(title, color=col, fontsize=10, fontweight='bold')
plt.suptitle(f'Sample pairs at {S}×{S}', color='#e6edf3')
plt.tight_layout(); plt.show()


# ── Cell 4: Architecture ─────────────────────────────────────────
#
# Key improvements over original:
#
# 1. ConvBlock now has TWO conv layers (was 1) before CBAM — richer
#    feature extraction per encoder level.
#
# 2. MaxPool2d  → strided Conv2d for downsampling.
#    MaxPool throws away 75% of activations; strided conv LEARNS
#    what to keep, preserving finer texture detail.
#
# 3. Upsample(bilinear) → ConvTranspose2d for upsampling.
#    Bilinear blurs; ConvTranspose2d sharpens by learning the
#    interpolation kernel — critical for output sharpness.
#
# 4. 4-level encoder (was 3). Extra depth doubles the receptive
#    field so the network sees global structure while keeping
#    local pixel detail via skip connections.
#
# 5. Output layer: Conv1×1 → Conv3×3 + Sigmoid.
#    A 3×3 final conv smooths checkerboard artifacts common in
#    transposed-conv decoders.
# ─────────────────────────────────────────────────────────────────

class ChannelAttention(nn.Module):
    def __init__(self, in_planes, ratio=16):
        super().__init__()
        mid = max(in_planes // ratio, 8)   # guard against tiny mid
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.fc1 = nn.Conv2d(in_planes, mid, 1, bias=False)
        self.relu = nn.ReLU()
        self.fc2 = nn.Conv2d(mid, in_planes, 1, bias=False)
        self.sigmoid = nn.Sigmoid()
    def forward(self, x):
        avg = self.fc2(self.relu(self.fc1(self.avg_pool(x))))
        mx  = self.fc2(self.relu(self.fc1(self.max_pool(x))))
        return self.sigmoid(avg + mx)

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super().__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=kernel_size//2, bias=False)
        self.sigmoid = nn.Sigmoid()
    def forward(self, x):
        avg = torch.mean(x, dim=1, keepdim=True)
        mx, _ = torch.max(x, dim=1, keepdim=True)
        return self.sigmoid(self.conv(torch.cat([avg, mx], dim=1)))

class CBAM(nn.Module):
    def __init__(self, in_planes, ratio=16, kernel_size=7):
        super().__init__()
        self.ca = ChannelAttention(in_planes, ratio)
        self.sa = SpatialAttention(kernel_size)
    def forward(self, x):
        x = self.ca(x) * x
        x = self.sa(x) * x
        return x

class ConvBlock(nn.Module):
    """Double conv with BN+ReLU (like original U-Net paper)."""
    def __init__(self, i, o):
        super().__init__()
        self.b = nn.Sequential(
            nn.Conv2d(i, o, 3, 1, 1, bias=False), nn.BatchNorm2d(o), nn.ReLU(inplace=True),
            nn.Conv2d(o, o, 3, 1, 1, bias=False), nn.BatchNorm2d(o), nn.ReLU(inplace=True),
        )
    def forward(self, x): return self.b(x)

class DownBlock(nn.Module):
    """Strided conv downsampling — learns what to keep (beats MaxPool)."""
    def __init__(self, in_ch):
        super().__init__()
        self.d = nn.Sequential(
            nn.Conv2d(in_ch, in_ch, 3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(in_ch), nn.ReLU(inplace=True),
        )
    def forward(self, x): return self.d(x)

class UpBlock(nn.Module):
    """Transposed conv upsampling — sharper than bilinear."""
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.u = nn.ConvTranspose2d(in_ch, out_ch, kernel_size=2, stride=2)
    def forward(self, x): return self.u(x)

class UNet(nn.Module):
    """
    4-level U-Net with:
      • Double ConvBlocks per level
      • CBAM at every encoder level
      • Strided-conv downsampling
      • ConvTranspose2d upsampling
      • Sharper 3×3 output conv
    """
    def __init__(self, in_ch=6, out_ch=3, bf=64):
        super().__init__()
        # Encoder
        self.e1 = nn.Sequential(ConvBlock(in_ch, bf),    CBAM(bf))
        self.e2 = nn.Sequential(ConvBlock(bf,    bf*2),  CBAM(bf*2))
        self.e3 = nn.Sequential(ConvBlock(bf*2,  bf*4),  CBAM(bf*4))
        self.e4 = nn.Sequential(ConvBlock(bf*4,  bf*8),  CBAM(bf*8))

        # Downsampling
        self.d1 = DownBlock(bf)
        self.d2 = DownBlock(bf*2)
        self.d3 = DownBlock(bf*4)
        self.d4 = DownBlock(bf*8)

        # Bottleneck
        self.bn = ConvBlock(bf*8, bf*8)

        # Decoder (up + skip)
        self.up4 = UpBlock(bf*8, bf*8)
        self.dec4 = ConvBlock(bf*16, bf*4)

        self.up3 = UpBlock(bf*4, bf*4)
        self.dec3 = ConvBlock(bf*8, bf*2)

        self.up2 = UpBlock(bf*2, bf*2)
        self.dec2 = ConvBlock(bf*4, bf)

        self.up1 = UpBlock(bf, bf)
        self.dec1 = ConvBlock(bf*2, bf//2)

        # Output — 3×3 final conv reduces checkerboard artifacts
        self.out = nn.Sequential(
            nn.Conv2d(bf//2, out_ch, 3, 1, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        e1 = self.e1(x)
        e2 = self.e2(self.d1(e1))
        e3 = self.e3(self.d2(e2))
        e4 = self.e4(self.d3(e3))
        b  = self.bn(self.d4(e4))

        x = self.dec4(torch.cat([self.up4(b),  e4], 1))
        x = self.dec3(torch.cat([self.up3(x),  e3], 1))
        x = self.dec2(torch.cat([self.up2(x),  e2], 1))
        x = self.dec1(torch.cat([self.up1(x),  e1], 1))
        return self.out(x)

class HidingNet(nn.Module):
    def __init__(self, bf=64): super().__init__(); self.u = UNet(6, 3, bf)
    def forward(self, cover, secret): return self.u(torch.cat([cover, secret], 1))

class RevealNet(nn.Module):
    def __init__(self, bf=64): super().__init__(); self.u = UNet(3, 3, bf)
    def forward(self, stego): return self.u(stego)

class Discriminator(nn.Module):
    def __init__(self, in_channels=3, features=[64, 128, 256, 512]):
        super().__init__()
        layers = []
        for feat in features:
            layers += [
                nn.Conv2d(in_channels, feat, 4, stride=2, padding=1, bias=False),
                nn.BatchNorm2d(feat),
                nn.LeakyReLU(0.2, inplace=True),
            ]
            in_channels = feat
        layers.append(nn.Conv2d(in_channels, 1, 4, stride=1, padding=1))
        self.model = nn.Sequential(*layers)
    def forward(self, x): return self.model(x)

bf = CONFIG['base_filters']
hiding_net    = HidingNet(bf=bf).to(DEVICE)
reveal_net    = RevealNet(bf=bf).to(DEVICE)
discriminator = Discriminator().to(DEVICE)

# torch.compile — free ~20% throughput on Ampere (RTX 3060)
if CONFIG['use_compile'] and hasattr(torch, 'compile'):
    print('Compiling models with torch.compile ...')
    hiding_net    = torch.compile(hiding_net)
    reveal_net    = torch.compile(reveal_net)
    discriminator = torch.compile(discriminator)
    print('  ✅ Compiled')

P = lambda m: sum(p.numel() for p in m.parameters() if p.requires_grad)
print(f'HidingNet   params: {P(hiding_net):,}')
print(f'RevealNet   params: {P(reveal_net):,}')
print(f'Discriminator params: {P(discriminator):,}')
print(f'Total params: {P(hiding_net)+P(reveal_net)+P(discriminator):,}')

# Sanity check
with torch.no_grad():
    _c  = torch.randn(1, 3, S, S).to(DEVICE)
    _s  = torch.randn(1, 3, S, S).to(DEVICE)
    _st = hiding_net(_c, _s)
    _rv = reveal_net(_st)
print(f'Forward pass OK — Stego: {list(_st.shape)}  Revealed: {list(_rv.shape)}')


# ── Cell 5: Loss Function & Metrics ──────────────────────────────
#
# Three-component loss:
#
# 1. L1       — pixel-level accuracy (robust to outliers vs MSE)
# 2. SSIM     — perceptual quality (luminance, contrast, structure)
# 3. Perceptual (VGG-16) — high-level feature similarity
#              THIS is the biggest upgrade for output image quality.
#              VGG features capture textures and semantic structure
#              that L1+SSIM alone cannot enforce.
#
# Total = L1 + alpha*SSIM_loss + perceptual_w*VGGLoss
# ─────────────────────────────────────────────────────────────────

class VGGPerceptualLoss(nn.Module):
    """Extract relu2_2 and relu3_3 features from frozen VGG-16."""
    def __init__(self):
        super().__init__()
        vgg = models.vgg16(weights=models.VGG16_Weights.IMAGENET1K_V1).features
        # relu2_2 = up to index 9; relu3_3 = up to index 16
        self.slice1 = nn.Sequential(*list(vgg.children())[:10]).eval()
        self.slice2 = nn.Sequential(*list(vgg.children())[:17]).eval()
        for p in self.parameters():
            p.requires_grad = False
        # ImageNet normalisation (applied inside forward)
        self.register_buffer('mean', torch.tensor([0.485, 0.456, 0.406]).view(1,3,1,1))
        self.register_buffer('std',  torch.tensor([0.229, 0.224, 0.225]).view(1,3,1,1))

    def forward(self, x, y):
        x = (x - self.mean) / self.std
        y = (y - self.mean) / self.std
        loss  = F.l1_loss(self.slice1(x), self.slice1(y))
        loss += F.l1_loss(self.slice2(x), self.slice2(y))
        return loss

_ssim_loss   = SSIM_M(data_range=1.0).to(DEVICE)
_ssim_eval   = SSIM_M(data_range=1.0).to(DEVICE)
_psnr_eval   = PSNR_M(data_range=1.0).to(DEVICE)
_vgg_loss    = VGGPerceptualLoss().to(DEVICE)

class StegoLoss(nn.Module):
    def __init__(self, beta=0.75, alpha=0.75, perceptual_w=0.10):
        super().__init__()
        self.beta         = beta          # secret reveal weight
        self.alpha        = alpha         # SSIM weight
        self.perceptual_w = perceptual_w  # VGG perceptual weight
        self.l1           = nn.L1Loss()

    def forward(self, cover, stego, secret, revealed):
        # Hiding quality (cover ↔ stego should look identical)
        h_l1      = self.l1(stego, cover)
        h_ssim    = 1.0 - _ssim_loss(stego, cover)
        h_percep  = _vgg_loss(stego, cover)
        h = h_l1 + self.alpha * h_ssim + self.perceptual_w * h_percep

        # Reveal quality (revealed ↔ secret should match)
        r_l1      = self.l1(revealed, secret)
        r_ssim    = 1.0 - _ssim_loss(revealed, secret)
        r_percep  = _vgg_loss(revealed, secret)
        r = r_l1 + self.alpha * r_ssim + self.perceptual_w * r_percep

        t = h + self.beta * r
        return t, h, r

@torch.no_grad()
def compute_metrics(pred, tgt):
    return _ssim_eval(pred, tgt).item(), _psnr_eval(pred, tgt).item()

loss_fn = StegoLoss(
    beta=CONFIG['beta'],
    alpha=CONFIG['alpha'],
    perceptual_w=CONFIG['perceptual_w'],
)
print(f'Loss: L1 + {CONFIG["alpha"]}×SSIM + {CONFIG["perceptual_w"]}×VGG  |  beta={CONFIG["beta"]}')


# ── Cell 6: Trainer ───────────────────────────────────────────────

class StegoTrainer:
    def __init__(self, H, R, D, L, cfg):
        self.H = H; self.R = R; self.D = D; self.L = L; self.cfg = cfg

        # Single Adam for both generators
        self.opt_g = optim.Adam(
            list(H.parameters()) + list(R.parameters()),
            lr=cfg['lr'], betas=(0.9, 0.999), weight_decay=1e-5,
        )
        self.sch_g = optim.lr_scheduler.ReduceLROnPlateau(
            self.opt_g, 'min', patience=cfg['lr_patience'], factor=cfg['lr_factor'],
        )
        self.opt_d = optim.Adam(D.parameters(), lr=cfg['lr'] * 0.5)
        self.bce   = nn.BCEWithLogitsLoss()

        self.hist      = {k: [] for k in ['tr_g','tr_d','vl_t','ssim_cover','psnr_cover','ssim_secret','psnr_secret']}
        self.best_loss = float('inf')
        self.epoch     = 0
        self.adv_w     = cfg['adv_w']       # cleaner: weight lives in config
        self.noise_std = cfg['noise_std']

    def _add_noise(self, stego):
        if self.noise_std > 0:
            return (stego + torch.randn_like(stego) * self.noise_std).clamp(0, 1)
        return stego

    def _train(self, ld):
        self.H.train(); self.R.train(); self.D.train()
        tg = td = 0.0
        bar = tqdm(ld, desc='Train', leave=False, bar_format='{l_bar}{bar:20}{r_bar}')

        for cov, sec in bar:
            cov, sec = cov.to(DEVICE), sec.to(DEVICE)

            # ── 1. Discriminator step ────────────────────────────
            with torch.no_grad():
                stg = self.H(cov, sec)
            d_real_cov = self.D(cov)
            d_real_sec = self.D(sec)
            d_fake_stg = self.D(stg.detach())

            loss_d = (
                self.bce(d_real_cov, torch.ones_like(d_real_cov)) +
                self.bce(d_real_sec, torch.ones_like(d_real_sec)) +
                self.bce(d_fake_stg, torch.zeros_like(d_fake_stg))
            ) / 3
            self.opt_d.zero_grad(); loss_d.backward(); self.opt_d.step()

            # ── 2. Generator step ────────────────────────────────
            stg      = self.H(cov, sec)
            stg_noisy = self._add_noise(stg)
            rev      = self.R(stg_noisy)

            loss_g_std, _, _ = self.L(cov, stg, sec, rev)

            d_fool = self.D(stg)
            loss_g_adv = self.bce(d_fool, torch.ones_like(d_fool)) * self.adv_w

            loss_g = loss_g_std + loss_g_adv
            self.opt_g.zero_grad(); loss_g.backward()
            nn.utils.clip_grad_norm_(list(self.H.parameters()) + list(self.R.parameters()), 1.0)
            self.opt_g.step()

            tg += loss_g.item(); td += loss_d.item()
            bar.set_postfix(g=f'{loss_g.item():.4f}', d=f'{loss_d.item():.4f}')

        n = len(ld)
        return tg/n, td/n

    @torch.no_grad()
    def _val(self, ld):
        self.H.eval(); self.R.eval()
        tt = sc = pc = ss = ps = 0.0
        for cov, sec in ld:
            cov, sec = cov.to(DEVICE), sec.to(DEVICE)
            stg = self.H(cov, sec)
            rev = self.R(stg)
            t, _, _ = self.L(cov, stg, sec, rev)
            tt += t.item()
            s1, p1 = compute_metrics(stg, cov); sc += s1; pc += p1
            s2, p2 = compute_metrics(rev, sec); ss += s2; ps += p2
        n = len(ld)
        return tt/n, sc/n, pc/n, ss/n, ps/n

    def fit(self, tr_ld, va_ld):
        print('='*72)
        print(f'TRAINING STEGO-GAN | Epochs: {self.cfg["epochs"]} | Size: {self.cfg["image_size"]} | BF: {self.cfg["base_filters"]}')
        print('='*72)
        for ep in range(1, self.cfg['epochs']+1):
            self.epoch = ep
            t0 = datetime.now()

            tr_g, tr_d = self._train(tr_ld)
            vl = self._val(va_ld)
            self.sch_g.step(vl[0])

            star = ''
            if vl[0] < self.best_loss:
                self.best_loss = vl[0]
                self._save('best.pt'); star = ' ★ BEST'

            sec = (datetime.now()-t0).seconds
            print(f'Ep {ep:3d}/{self.cfg["epochs"]} ({sec}s) | G: {tr_g:.4f} | D: {tr_d:.4f} | Val: {vl[0]:.4f}')
            print(f'   SSIM — cover: {vl[1]:.3f}  PSNR: {vl[2]:.1f}dB  |  secret: {vl[3]:.3f}  PSNR: {vl[4]:.1f}dB{star}')

            self._save('last.pt')
        print('='*72)
        print(f'DONE | Best Val Loss: {self.best_loss:.5f}')

    def _save(self, name):
        torch.save({
            'epoch'  : self.epoch,
            'hiding' : self.H.state_dict(),
            'reveal' : self.R.state_dict(),
        }, Path(self.cfg['ckpt_dir']) / name)

trainer = StegoTrainer(hiding_net, reveal_net, discriminator, loss_fn, CONFIG)
print('GAN Trainer ready.')


# ── Cell 7: Train ────────────────────────────────────────────────
# Expected on RTX 3060 (6 GB) with torch.compile:
#   ~4-6 min/epoch  →  ~2-3 hrs total for 30 epochs
# Compile warms up on epoch 1 (slower), then fast from epoch 2 onward.

trainer.fit(tr_ld, va_ld)


# ── Cell 8: Evaluate ─────────────────────────────────────────────
ck = torch.load('/content/checkpoints/best.pt', map_location=DEVICE)
hiding_net.load_state_dict(ck['hiding'])
reveal_net.load_state_dict(ck['reveal'])
hiding_net.eval(); reveal_net.eval()

cov, sec = next(iter(va_ld))
cov = cov[:4].to(DEVICE)
sec = sec[:4].to(DEVICE)

with torch.no_grad():
    stg = hiding_net(cov, sec)
    rev = reveal_net(stg)

diff = (stg - cov).abs().clamp(0, 1) * 10

def t2img(t):
    return (t.detach().cpu().clamp(0, 1).permute(1, 2, 0).numpy() * 255).astype('uint8')

labels = ['Cover', 'Secret', 'Stego', 'Diff ×10', 'Revealed']
colors = ['#58a6ff', '#3fb950', '#f85149', '#e3b341', '#bc8cff']

fig, axes = plt.subplots(4, 5, figsize=(20, 16))
fig.patch.set_facecolor('#0d1117')
for ci, (lbl, col) in enumerate(zip(labels, colors)):
    axes[0][ci].set_title(lbl, color=col, fontsize=11, fontweight='bold')
for ri in range(4):
    imgs = [cov[ri], sec[ri], stg[ri], diff[ri], rev[ri]]
    sc, pc = compute_metrics(stg[ri:ri+1], cov[ri:ri+1])
    ss, ps = compute_metrics(rev[ri:ri+1], sec[ri:ri+1])
    for ci, img in enumerate(imgs):
        a = axes[ri][ci]; a.imshow(t2img(img)); a.axis('off')
        for sp in a.spines.values():
            sp.set_edgecolor(colors[ci]); sp.set_linewidth(2)
        if ci == 2:
            a.set_xlabel(f'SSIM {sc:.3f}  PSNR {pc:.1f}dB', color='#e3b341', fontsize=8)
        elif ci == 4:
            a.set_xlabel(f'SSIM {ss:.3f}  PSNR {ps:.1f}dB', color='#3fb950', fontsize=8)
plt.suptitle('Results — Cover | Secret | Stego | Diff×10 | Revealed',
             color='#e6edf3', fontsize=13, y=1.01)
plt.tight_layout()
plt.savefig('/content/results_check.png', dpi=120, bbox_inches='tight', facecolor='#0d1117')
plt.show()
print()
print('✅ If Revealed (col 5) looks like Secret (col 2) — model is working.')
print('✅ If Stego (col 3) looks like Cover (col 1) — hiding is invisible.')


# ── Cell 9: Deploy to Hugging Face Spaces ────────────────────────
# (same as original — see instructions in comments below)

# HF_TOKEN    = 'hf_YOUR_TOKEN_HERE'
# HF_USERNAME = 'your_hf_username'
# SPACE_NAME  = 'deep-stego-secure'

# from huggingface_hub import HfApi, login
# login(token=HF_TOKEN, add_to_git_credential=False)
# api = HfApi()
# repo_id = f'{HF_USERNAME}/{SPACE_NAME}'

# files = {
#     '/content/checkpoints/best.pt': 'best.pt',
#     '/content/app.py'             : 'app.py',
#     '/content/requirements.txt'   : 'requirements.txt',
#     '/content/README.md'          : 'README.md',
# }
# for local, remote in files.items():
#     if not Path(local).exists():
#         print(f'⚠️  Not found: {local}'); continue
#     api.upload_file(path_or_fileobj=local, path_in_repo=remote,
#                     repo_id=repo_id, repo_type='space')
#     print(f'  ✅ {remote}')
# print(f'🌐  LIVE: https://huggingface.co/spaces/{repo_id}')