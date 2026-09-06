import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MODES,
  Mode,
  TARGET_CLICKS,
  loadBest,
  modeLabel,
  rankFor,
  saveBest,
  shareText,
} from './cps';

type Phase = 'idle' | 'running' | 'done';

export default function App() {
  const [mode, setMode] = useState<Mode>(10);
  const [phase, setPhase] = useState<Phase>('idle');
  const [clicks, setClicks] = useState(0);
  const [remaining, setRemaining] = useState<number>(10);
  const [best, setBest] = useState<Record<string, number>>({});
  const [justBeat, setJustBeat] = useState(false);
  const [copied, setCopied] = useState(false);

  const startRef = useRef(0);
  const endTimer = useRef<number | undefined>(undefined);
  const rafRef = useRef<number | undefined>(undefined);
  const clicksRef = useRef(0);
  const finalElapsed = useRef(0);

  useEffect(() => setBest(loadBest()), []);

  useEffect(() => {
    return () => {
      window.clearTimeout(endTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const reset = useCallback(
    (m: Mode = mode) => {
      window.clearTimeout(endTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setPhase('idle');
      setClicks(0);
      clicksRef.current = 0;
      finalElapsed.current = 0;
      setRemaining(m === 'target' ? 0 : m);
      setCopied(false);
      setJustBeat(false);
    },
    [mode],
  );

  const finish = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const elapsed = mode === 'target' ? (performance.now() - startRef.current) / 1000 : (mode as number);
    finalElapsed.current = elapsed;
    const cps = clicksRef.current / elapsed;
    setPhase('done');
    setBest((prev) => {
      const key = String(mode);
      const beat = cps > (prev[key] ?? 0);
      setJustBeat(beat && (prev[key] ?? 0) > 0);
      if (beat) {
        const next = { ...prev, [key]: cps };
        saveBest(next);
        return next;
      }
      return prev;
    });
  }, [mode]);

  const tick = useCallback(() => {
    if (mode !== 'target') {
      const left = (mode as number) - (performance.now() - startRef.current) / 1000;
      setRemaining(Math.max(0, left));
    } else {
      setRemaining((performance.now() - startRef.current) / 1000);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [mode]);

  const registerClick = useCallback(() => {
    if (phase === 'done') return;

    if (phase === 'idle') {
      setPhase('running');
      startRef.current = performance.now();
      clicksRef.current = 1;
      setClicks(1);
      rafRef.current = requestAnimationFrame(tick);
      if (mode !== 'target') {
        endTimer.current = window.setTimeout(finish, (mode as number) * 1000);
      }
      return;
    }

    // running
    clicksRef.current += 1;
    setClicks(clicksRef.current);
    if (mode === 'target' && clicksRef.current >= TARGET_CLICKS) finish();
  }, [phase, mode, tick, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phase !== 'done') {
        e.preventDefault();
        registerClick();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [registerClick, phase]);

  const elapsedForCps =
    phase === 'done'
      ? finalElapsed.current
      : phase === 'running'
        ? Math.max(0.001, (performance.now() - startRef.current) / 1000)
        : 0;
  const liveCps = elapsedForCps > 0 ? clicks / elapsedForCps : 0;
  const finalCps = phase === 'done' && finalElapsed.current > 0 ? clicks / finalElapsed.current : 0;
  const rank = rankFor(finalCps);
  const bestCps = best[String(mode)] ?? 0;

  const share = async () => {
    const text = shareText(finalCps, mode, clicks);
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>Click Speed Test</h1>
        <p className="tagline">How many times can you click in {mode === 'target' ? 'reaching 100 clicks' : modeLabel(mode)}? Find your CPS.</p>
      </header>

      <div className="modes" role="tablist" aria-label="Test length">
        {MODES.map((m) => (
          <button
            key={String(m.id)}
            role="tab"
            aria-selected={mode === m.id}
            className={mode === m.id ? 'active' : ''}
            onClick={() => {
              setMode(m.id);
              reset(m.id);
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <button
        className={`pad ${phase}`}
        onPointerDown={(e) => {
          e.preventDefault();
          registerClick();
        }}
        aria-label="Click pad"
      >
        {phase === 'idle' && (
          <span className="pad-idle">
            <strong>Click here to start</strong>
            <span>{mode === 'target' ? 'Race to 100 clicks' : `${modeLabel(mode)} timer starts on your first click`} · spacebar works too</span>
          </span>
        )}
        {phase === 'running' && (
          <span className="pad-run">
            <span className="big">{clicks}</span>
            <span className="sub">clicks</span>
            <span className="timer">
              {mode === 'target' ? `${remaining.toFixed(1)}s` : `${remaining.toFixed(1)}s left`}
            </span>
            <span className="live">{liveCps.toFixed(1)} CPS</span>
          </span>
        )}
        {phase === 'done' && (
          <span className="pad-done">
            <span className="rank-emoji">{rank.emoji}</span>
            <span className="big">{finalCps.toFixed(2)}</span>
            <span className="sub">CPS · {rank.label}</span>
          </span>
        )}
      </button>

      {phase === 'done' && (
        <section className="result" aria-live="polite">
          <p className="rank-blurb">{rank.blurb}</p>
          <div className="stats">
            <div><strong>{clicks}</strong><span>clicks</span></div>
            <div><strong>{finalElapsed.current.toFixed(2)}s</strong><span>time</span></div>
            <div><strong>{bestCps ? bestCps.toFixed(2) : '—'}</strong><span>your best ({modeLabel(mode)})</span></div>
          </div>
          {justBeat && <p className="new-best">🎉 New personal best!</p>}
          <div className="actions">
            <button className="primary" onClick={() => reset()}>Try again</button>
            <button className="ghost" onClick={share}>{copied ? 'Copied ✓' : 'Share result'}</button>
          </div>
        </section>
      )}

      {phase === 'idle' && bestCps > 0 && (
        <p className="best-line">Your best over {modeLabel(mode)}: <strong>{bestCps.toFixed(2)} CPS</strong></p>
      )}

      <section className="explainer" id="about">
        <h2>What is a click speed test?</h2>
        <p>
          A click speed test (or <strong>CPS test</strong> — clicks per second) measures how fast
          you can click a mouse button in a set time. Pick a duration, click the pad as fast as
          you can, and it works out your average CPS. The clock only starts on your first click,
          so there’s no wasted time.
        </p>

        <h2>What’s a good CPS?</h2>
        <table>
          <thead><tr><th>CPS</th><th>Level</th></tr></thead>
          <tbody>
            <tr><td>1–3</td><td>Below average</td></tr>
            <tr><td>4–6</td><td>Casual clicker</td></tr>
            <tr><td>6–8</td><td>Around average (~6.5)</td></tr>
            <tr><td>8–12</td><td>Fast — often jitter clicking</td></tr>
            <tr><td>12–14</td><td>Elite</td></tr>
            <tr><td>14+</td><td>Near the human world record</td></tr>
          </tbody>
        </table>

        <h2>Clicking techniques</h2>
        <ul>
          <li><strong>Regular clicking</strong> — one finger, tapping normally. ~5–8 CPS.</li>
          <li><strong>Jitter clicking</strong> — tensing your arm so it vibrates onto the button. ~10–14 CPS, tiring and hard on the wrist.</li>
          <li><strong>Butterfly clicking</strong> — alternating two fingers on one button. ~15–25 CPS, banned in many Minecraft servers.</li>
          <li><strong>Drag clicking</strong> — dragging a finger across the button so friction registers many clicks. Huge burst numbers, needs a specific mouse.</li>
        </ul>

        <h3>FAQ</h3>
        <h4>Does this work on mobile?</h4>
        <p>Yes — tapping the pad counts as a click. Test your tap speed the same way.</p>
        <h4>Why does my CPS look different each time?</h4>
        <p>Short tests (1 second) swing a lot because a single click is worth ±1 CPS. The 5 or 10 second test gives a steadier number.</p>
        <h4>Is jitter or butterfly clicking bad for you?</h4>
        <p>Done a lot, both put strain on your hand and wrist. Take breaks, and stop if anything hurts.</p>

        <footer>Just a bit of fun. Your scores are saved only in your browser.</footer>
      </section>
    </div>
  );
}
