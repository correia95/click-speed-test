# click-speed-test

Measure your clicks per second (CPS). Pick 1/5/10/30/60 seconds or race to 100 clicks, click
the pad, get your CPS and an animal rank. Best scores saved locally, shareable result, works
on mobile and with the spacebar. 100% client-side.

**Live:** https://click-speed-test.correia95.workers.dev/

## Stack

- React 18 + TypeScript + Vite, no runtime deps beyond React
- Static-assets Cloudflare Worker

## Develop / deploy

```bash
npm install
npm run dev
npm run deploy   # build + wrangler deploy
```

## How it works

- Timing uses `performance.now()` deltas; display updates via `requestAnimationFrame`.
- The clock starts on the first click. Timed modes stop via `setTimeout`; the 100-click mode
  stops when the count is reached.
- `src/cps.ts` holds the rank tiers, share text and `localStorage` best-score helpers.
