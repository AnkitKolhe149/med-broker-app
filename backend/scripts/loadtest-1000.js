const target = process.argv[2] || 'http://localhost:4000/api/medicines?page=1&limit=20';
const levels = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const durationMs = Number(process.argv[3] || 4000);
const cooldownMs = Number(process.argv[4] || 800);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runLevel(concurrency) {
  let stop = false;
  let success = 0;
  let fail = 0;
  const durations = [];

  const worker = async () => {
    while (!stop) {
      const startedAt = Date.now();
      try {
        const response = await fetch(target);
        const elapsed = Date.now() - startedAt;
        durations.push(elapsed);

        if (response.ok) {
          success += 1;
          await response.arrayBuffer();
        } else {
          fail += 1;
        }
      } catch (_error) {
        fail += 1;
      }
    }
  };

  const workers = Array.from({ length: concurrency }, () => worker());
  await sleep(durationMs);
  stop = true;
  await Promise.all(workers);

  durations.sort((a, b) => a - b);
  const total = success + fail;
  const p50 = durations.length ? durations[Math.floor(durations.length * 0.5)] : null;
  const p95 = durations.length ? durations[Math.floor(durations.length * 0.95)] : null;
  const p99 = durations.length ? durations[Math.floor(durations.length * 0.99)] : null;
  const rps = total / (durationMs / 1000);
  const errorRate = total ? (fail / total) * 100 : 100;

  return {
    concurrency,
    total,
    success,
    fail,
    errorRate,
    p50,
    p95,
    p99,
    rps
  };
}

(async () => {
  for (let i = 0; i < 5; i += 1) {
    try {
      await fetch(target);
    } catch (_error) {}
  }

  const results = [];

  for (const level of levels) {
    const result = await runLevel(level);
    results.push(result);

    console.log(
      `L=${result.concurrency} total=${result.total} ok=${result.success} fail=${result.fail} err=${result.errorRate.toFixed(2)}% p50=${result.p50}ms p95=${result.p95}ms p99=${result.p99}ms rps=${result.rps.toFixed(1)}`
    );

    await sleep(cooldownMs);
  }

  const stable = results.filter((item) => item.errorRate <= 1 && item.p95 !== null && item.p95 <= 2500);
  const recommended = stable.length ? stable[stable.length - 1].concurrency : 0;

  console.log(`RECOMMENDED_CONCURRENCY=${recommended}`);
})();
