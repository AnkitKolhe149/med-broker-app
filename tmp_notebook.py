!pip install -q torchmetrics==1.3.2 huggingface_hub pillow tqdm
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
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import torchvision.transforms as T
from torchvision.datasets import STL10
from torchmetrics import StructuralSimilarityIndexMeasure as SSIM_M
from torchmetrics import PeakSignalNoiseRatio as PSNR_M
from tqdm.notebook import tqdm

random.seed(42); np.random.seed(42)
torch.manual_seed(42); torch.cuda.manual_seed_all(42)
torch.backends.cudnn.deterministic = True

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'Device: {DEVICE}')
if torch.cuda.is_available():
    print(f'  GPU : {torch.cuda.get_device_name(0)}')
    print(f'  VRAM: {torch.cuda.get_device_properties(0).total_memory/1e9:.1f} GB')
else:
    print('  ⚠️  No GPU — training will be slow on CPU')

CONFIG = {
    'image_size'   : 256,   # upgraded from 128 — sharper, cleaner output
    'batch_size'   : 8,     # reduced for 256×256 to fit memory
    'num_workers'  : 2,
    'epochs'       : 20,
    'lr'           : 1e-3,
    'beta'         : 0.75,  # reveal loss weight
    'alpha'        : 0.1,   # SSIM loss weight (NEW)
    'noise_std'    : 0.01,  # Gaussian noise std for robustness (NEW)
    'lr_patience'  : 4,
    'lr_factor'    : 0.5,
    'base_filters' : 64,
    'data_dir'     : '/content/data',
    'ckpt_dir'     : '/content/checkpoints',
}
for d in [CONFIG['data_dir'], CONFIG['ckpt_dir']]:
    Path(d).mkdir(parents=True, exist_ok=True)

print(f'Config: size={CONFIG["image_size"]}  epochs={CONFIG["epochs"]}')
print(f'        beta={CONFIG["beta"]}  alpha={CONFIG["alpha"]}  noise_std={CONFIG["noise_std"]}')


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
tr_tf = T.Compose([T.Resize((S,S)), T.RandomHorizontalFlip(), T.ToTensor()])
va_tf = T.Compose([T.Resize((S,S)), T.ToTensor()])

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


# ── Cell 4: U-Net Architecture (with CBAM & GAN Discriminator) ─────────────

# 1. CBAM Attention Modules
class ChannelAttention(nn.Module):
    def __init__(self, in_planes, ratio=16):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.fc1 = nn.Conv2d(in_planes, in_planes // ratio, 1, bias=False)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Conv2d(in_planes // ratio, in_planes, 1, bias=False)
        self.sigmoid = nn.Sigmoid()
    def forward(self, x):
        avg_out = self.fc2(self.relu1(self.fc1(self.avg_pool(x))))
        max_out = self.fc2(self.relu1(self.fc1(self.max_pool(x))))
        return self.sigmoid(avg_out + max_out)

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super().__init__()
        self.conv1 = nn.Conv2d(2, 1, kernel_size, padding=kernel_size//2, bias=False)
        self.sigmoid = nn.Sigmoid()
    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        x_cat = torch.cat([avg_out, max_out], dim=1)
        return self.sigmoid(self.conv1(x_cat))

class CBAM(nn.Module):
    def __init__(self, in_planes, ratio=16, kernel_size=7):
        super().__init__()
        self.ca = ChannelAttention(in_planes, ratio)
        self.sa = SpatialAttention(kernel_size)
    def forward(self, x):
        x = self.ca(x) * x
        x = self.sa(x) * x
        return x

# 2. U-Net Core blocks
class ConvBlock(nn.Module):
    def __init__(self, i, o):
        super().__init__()
        self.b = nn.Sequential(
            nn.Conv2d(i, o, 3, 1, 1, bias=False),
            nn.BatchNorm2d(o),
            nn.ReLU(inplace=True)
        )
    def forward(self, x): return self.b(x)

class UNet(nn.Module):
    def __init__(self, in_ch=6, out_ch=3, bf=64):
        super().__init__()
        self.e1 = nn.Sequential(ConvBlock(in_ch,bf),  ConvBlock(bf,bf), CBAM(bf))
        self.e2 = nn.Sequential(ConvBlock(bf,bf*2),   ConvBlock(bf*2,bf*2), CBAM(bf*2))
        self.e3 = nn.Sequential(ConvBlock(bf*2,bf*4), ConvBlock(bf*4,bf*4), CBAM(bf*4))
        
        self.bn = nn.Sequential(ConvBlock(bf*4,bf*4), ConvBlock(bf*4,bf*4))
        
        self.d3 = nn.Sequential(ConvBlock(bf*8,bf*4), ConvBlock(bf*4,bf*2), CBAM(bf*2))
        self.d2 = nn.Sequential(ConvBlock(bf*4,bf*2), ConvBlock(bf*2,bf), CBAM(bf))
        self.d1 = nn.Sequential(ConvBlock(bf*2,bf),   ConvBlock(bf,bf//2))
        self.out= nn.Sequential(nn.Conv2d(bf//2,out_ch,1), nn.Sigmoid())
        
        self.pool = nn.MaxPool2d(2)
        self.up   = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
        
    def forward(self, x):
        e1=self.e1(x); e2=self.e2(self.pool(e1)); e3=self.e3(self.pool(e2))
        b=self.bn(self.pool(e3))
        d3=self.d3(torch.cat([self.up(b), e3],1))
        d2=self.d2(torch.cat([self.up(d3),e2],1))
        d1=self.d1(torch.cat([self.up(d2),e1],1))
        return self.out(d1)

class HidingNet(nn.Module):
    def __init__(self, bf=64): super().__init__(); self.u=UNet(6,3,bf)
    def forward(self, cover, secret): return self.u(torch.cat([cover,secret],1))

class RevealNet(nn.Module):
    def __init__(self, bf=64): super().__init__(); self.u=UNet(3,3,bf)
    def forward(self, stego): return self.u(stego)

# 3. GAN Discriminator (The AI Detective)
class Discriminator(nn.Module):
    def __init__(self, in_channels=3, features=[64, 128, 256, 512]):
        super().__init__()
        layers = []
        for feature in features:
            layers.append(nn.Conv2d(in_channels, feature, kernel_size=4, stride=2, padding=1))
            layers.append(nn.BatchNorm2d(feature))
            layers.append(nn.LeakyReLU(0.2))
            in_channels = feature
        layers.append(nn.Conv2d(in_channels, 1, kernel_size=4, stride=1, padding=1))
        self.model = nn.Sequential(*layers)
    def forward(self, x): return self.model(x)

bf = CONFIG['base_filters']
hiding_net = HidingNet(bf=bf).to(DEVICE)
reveal_net = RevealNet(bf=bf).to(DEVICE)
discriminator = Discriminator().to(DEVICE)

P = lambda m: sum(p.numel() for p in m.parameters() if p.requires_grad)
print(f'HidingNet params: {P(hiding_net):,}')
print(f'RevealNet params: {P(reveal_net):,}')
print(f'Discriminator params: {P(discriminator):,}')
print(f'Total params: {P(hiding_net)+P(reveal_net)+P(discriminator):,}')

# Sanity check forward pass
with torch.no_grad():
    _c = torch.randn(1,3,256,256).to(DEVICE)
    _s = torch.randn(1,3,256,256).to(DEVICE)
    _st = hiding_net(_c,_s)
    _rv = reveal_net(_st)
    _d_out = discriminator(_st)
print(f'Forward pass OK — Stego: {list(_st.shape)}  Revealed: {list(_rv.shape)} Discriminator: {list(_d_out.shape)}')

# ── Cell 5: Loss Function & Metrics ──────────────────────────────
#
# UPDATED LOSS — two components combined:
#
# 1. MSE Loss — minimizes pixel-level numerical difference
#    MSE(cover, stego) + beta * MSE(secret, revealed)
#
# 2. SSIM Loss — minimizes perceptual difference (luminance,
#    contrast, structure) — what the human eye actually notices
#    (1 - SSIM(cover, stego)) + beta * (1 - SSIM(secret, revealed))
#
# Total = MSE_term + alpha * SSIM_term
#
# Why SSIM on top of MSE?
# MSE can produce high PSNR but still look blurry/distorted.
# SSIM directly optimizes for perceptual quality — the output
# looks sharper and more natural to the human eye.

_ssim_loss = SSIM_M(data_range=1.0).to(DEVICE)
_ssim_eval = SSIM_M(data_range=1.0).to(DEVICE)
_psnr_eval = PSNR_M(data_range=1.0).to(DEVICE)

class StegoLoss(nn.Module):
    def __init__(self, beta=0.75, alpha=0.1):
        super().__init__()
        self.beta  = beta   # weight of reveal loss vs hiding loss
        self.alpha = alpha  # weight of SSIM vs MSE
        self.mse   = nn.MSELoss()

    def forward(self, cover, stego, secret, revealed):
        # ── Hiding quality ──────────────────────────────────────
        h_mse  = self.mse(stego, cover)               # pixel diff
        h_ssim = 1.0 - _ssim_loss(stego, cover)       # perceptual diff
        h      = h_mse + self.alpha * h_ssim           # combined

        # ── Reveal quality ──────────────────────────────────────
        r_mse  = self.mse(revealed, secret)            # pixel diff
        r_ssim = 1.0 - _ssim_loss(revealed, secret)   # perceptual diff
        r      = r_mse + self.alpha * r_ssim           # combined

        # ── Total ───────────────────────────────────────────────
        t = h + self.beta * r
        return t, h, r

@torch.no_grad()
def compute_metrics(pred, tgt):
    return _ssim_eval(pred,tgt).item(), _psnr_eval(pred,tgt).item()

loss_fn = StegoLoss(beta=CONFIG['beta'], alpha=CONFIG['alpha'])
print(f'Loss: MSE + {CONFIG["alpha"]} × SSIM  |  beta={CONFIG["beta"]}')
print('Both HidingNet and RevealNet optimized for perceptual quality.')


# ── Cell 6: Stego-GAN Trainer with Noise Robustness ────────────────────────

class StegoTrainer:
    def __init__(self, H, R, D, L, cfg):
        self.H = H; self.R = R; self.D = D; self.L = L; self.cfg = cfg
        
        # Generator Optimizer (HidingNet + RevealNet)
        self.opt_g = optim.Adam(list(H.parameters()) + list(R.parameters()), lr=cfg['lr'])
        self.sch_g = optim.lr_scheduler.ReduceLROnPlateau(self.opt_g, 'min', patience=cfg['lr_patience'], factor=cfg['lr_factor'])
        
        # Discriminator Optimizer
        self.opt_d = optim.Adam(D.parameters(), lr=cfg['lr'] * 0.5) # Slightly lower LR for stability
        self.bce = nn.BCEWithLogitsLoss() # GAN Loss math
        
        keys = ['tr_g', 'tr_d', 'vl_t', 'ssim_cover', 'psnr_cover', 'ssim_secret', 'psnr_secret']
        self.hist = {k: [] for k in keys}
        self.best_loss = float('inf')
        self.epoch = 0
        self.noise_std = cfg['noise_std']
        
    def _add_noise(self, stego):
        if self.noise_std > 0:
            noise = torch.randn_like(stego) * self.noise_std
            return (stego + noise).clamp(0, 1)
        return stego

    def _train(self, ld):
        self.H.train(); self.R.train(); self.D.train()
        tg = td = 0.0
        bar = tqdm(ld, desc='Train', leave=False, bar_format='{l_bar}{bar:20}{r_bar}')
        
        for cov, sec in bar:
            cov, sec = cov.to(DEVICE), sec.to(DEVICE)
            
            # --- 1. Train Discriminator ---
            stg = self.H(cov, sec)
            d_real = self.D(cov)
            d_fake = self.D(stg.detach()) # Detach so we don't backprop to HidingNet yet
            
            loss_d_real = self.bce(d_real, torch.ones_like(d_real))
            loss_d_fake = self.bce(d_fake, torch.zeros_like(d_fake))
            loss_d = (loss_d_real + loss_d_fake) / 2
            
            self.opt_d.zero_grad(); loss_d.backward(); self.opt_d.step()
            
            # --- 2. Train Generators (Hiding/Reveal) ---
            stg_noisy = self._add_noise(stg)
            rev = self.R(stg_noisy)
            
            # Standard Loss (MSE + SSIM)
            loss_g_standard, _, _ = self.L(cov, stg, sec, rev)
            
            # Adversarial GAN Loss (Did we fool the discriminator?)
            d_fake_for_g = self.D(stg)
            loss_g_adv = self.bce(d_fake_for_g, torch.ones_like(d_fake_for_g)) * 0.05 # Adv weight
            
            loss_g_total = loss_g_standard + loss_g_adv
            
            self.opt_g.zero_grad(); loss_g_total.backward()
            nn.utils.clip_grad_norm_(list(self.H.parameters()) + list(self.R.parameters()), 1.0)
            self.opt_g.step()
            
            tg += loss_g_total.item(); td += loss_d.item()
            bar.set_postfix(g_loss=f'{loss_g_total.item():.4f}', d_loss=f'{loss_d.item():.4f}')
            
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
            s1, p1 = compute_metrics(stg, cov); sc+=s1; pc+=p1
            s2, p2 = compute_metrics(rev, sec); ss+=s2; ps+=p2
        n = len(ld)
        return tt/n, sc/n, pc/n, ss/n, ps/n

    def fit(self, tr_ld, va_ld):
        print('='*72)
        print(f'TRAINING STEGO-GAN | Epochs: {self.cfg["epochs"]} | Size: {self.cfg["image_size"]}')
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
            print(f'Ep {ep:3d}/{self.cfg["epochs"]} ({sec}s) | G-Loss: {tr_g:.4f} | D-Loss: {tr_d:.4f} | Val: {vl[0]:.4f}')
            print(f'   SSIM - cover: {vl[1]:.3f}  secret: {vl[3]:.3f} {star}')
            
            self._save('last.pt')
        print('='*72)
        print(f'DONE | Best Val Loss: {self.best_loss:.5f}')

    def _save(self, name):
        torch.save({
            'epoch': self.epoch,
            'hiding': self.H.state_dict(),
            'reveal': self.R.state_dict(),
            # Note: We don't save the Discriminator weights because we don't need them for the app!
        }, Path(self.cfg['ckpt_dir'])/name)

trainer = StegoTrainer(hiding_net, reveal_net, discriminator, loss_fn, CONFIG)
print('GAN Trainer ready — let the battle begin.')

# ── Cell 7: Train ─────────────────────────────────────────────────
# Expected time:
#   NVIDIA GPU (T4/RTX):  ~3-5 min/epoch  →  ~1-1.5 hrs total
#   CPU only (Ryzen 9):   ~25-40 min/epoch → ~8-12 hrs total
#
# ⭐ marks every new best checkpoint saved to checkpoints/best.pt

trainer.fit(tr_ld, va_ld)


# ── Cell 8: Verify Model Output ───────────────────────────────────
ck = torch.load('/content/checkpoints/best.pt', map_location=DEVICE)
hiding_net.load_state_dict(ck['hiding']); reveal_net.load_state_dict(ck['reveal'])
hiding_net.eval(); reveal_net.eval()

cov, sec = next(iter(va_ld))
cov = cov[:4].to(DEVICE)
sec = sec[:4].to(DEVICE)

with torch.no_grad():
    stg = hiding_net(cov, sec)
    rev = reveal_net(stg)

diff = (stg - cov).abs().clamp(0,1) * 10  # amplify difference

def t2img(t):
    return (t.detach().cpu().clamp(0,1).permute(1,2,0).numpy()*255).astype('uint8')

labels = ['Cover','Secret','Stego','Diff ×10','Revealed']
colors = ['#58a6ff','#3fb950','#f85149','#e3b341','#bc8cff']

fig, axes = plt.subplots(4, 5, figsize=(20, 16))
fig.patch.set_facecolor('#0d1117')
for ci,(lbl,col) in enumerate(zip(labels,colors)):
    axes[0][ci].set_title(lbl, color=col, fontsize=11, fontweight='bold')
for ri in range(4):
    imgs = [cov[ri],sec[ri],stg[ri],diff[ri],rev[ri]]
    sc,pc = compute_metrics(stg[ri:ri+1], cov[ri:ri+1])
    ss,ps = compute_metrics(rev[ri:ri+1], sec[ri:ri+1])
    for ci,img in enumerate(imgs):
        a = axes[ri][ci]
        a.imshow(t2img(img)); a.axis('off')
        for sp in a.spines.values():
            sp.set_edgecolor(colors[ci]); sp.set_linewidth(2)
        if ci==2:
            a.set_xlabel(f'SSIM {sc:.3f}  PSNR {pc:.1f}dB',
                         color='#e3b341', fontsize=8)
        elif ci==4:
            a.set_xlabel(f'SSIM {ss:.3f}  PSNR {ps:.1f}dB',
                         color='#3fb950', fontsize=8)
plt.suptitle('Results — Cover | Secret | Stego | Diff×10 | Revealed',
             color='#e6edf3', fontsize=13, y=1.01)
plt.tight_layout()
plt.savefig('/content/results_check.png', dpi=120,
            bbox_inches='tight', facecolor='#0d1117')
plt.show()
print()
print('✅ If Revealed (column 5) looks like Secret (column 2) — model is working.')
print('✅ If Stego (column 3) looks like Cover (column 1) — hiding is invisible.')


# ── Cell 9: Deploy to Hugging Face Spaces ─────────────────────────
# BEFORE RUNNING:
#   1. huggingface.co → sign up free
#   2. huggingface.co/new-space → Name: deep-stego-secure
#      SDK: Streamlit → Public → Create
#   3. huggingface.co/settings/tokens → New Token → Write → copy
#   4. Drag app.py, requirements.txt, README.md into Colab Files panel
#   5. Fill in token + username below and run

# HF_TOKEN    = 'hf_YOUR_TOKEN_HERE'   # ← paste your HF token
# HF_USERNAME = 'your_hf_username'     # ← your HF username
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
#     print(f'Uploading {local} ...')
#     api.upload_file(path_or_fileobj=local, path_in_repo=remote,
#                     repo_id=repo_id, repo_type='space')
#     print(f'  ✅ {remote}')

# print()
# print('='*60)
# print(f'🌐  LIVE: https://huggingface.co/spaces/{repo_id}')
# print('='*60)
# print('Space builds in ~2 min. Open URL, register, and demo.')
