export type Mode = 1 | 5 | 10 | 30 | 60 | 'target';

export const MODES: { id: Mode; label: string }[] = [
  { id: 1, label: '1 sec' },
  { id: 5, label: '5 sec' },
  { id: 10, label: '10 sec' },
  { id: 30, label: '30 sec' },
  { id: 60, label: '60 sec' },
  { id: 'target', label: '100 clicks' },
];

export const TARGET_CLICKS = 100;

export interface Rank {
  label: string;
  emoji: string;
  blurb: string;
}

const TIERS: { min: number; rank: Rank }[] = [
  { min: 0, rank: { label: 'Sloth', emoji: '🦥', blurb: 'Taking it easy. Warm up those fingers.' } },
  { min: 2, rank: { label: 'Turtle', emoji: '🐢', blurb: 'Slow and steady. Room to grow.' } },
  { min: 4, rank: { label: 'Rabbit', emoji: '🐇', blurb: 'Getting quick. Just below the average clicker.' } },
  { min: 6, rank: { label: 'Cheetah', emoji: '🐆', blurb: 'Around the average of ~6.5 CPS. Solid.' } },
  { min: 8, rank: { label: 'Octopus', emoji: '🐙', blurb: 'Eight arms energy. Faster than most people.' } },
  { min: 10, rank: { label: 'Hummingbird', emoji: '🐦', blurb: 'Blazing. You might be jitter clicking.' } },
  { min: 12, rank: { label: 'Lightning', emoji: '⚡', blurb: 'Elite territory — serious technique.' } },
  { min: 14, rank: { label: 'Cyborg', emoji: '🤖', blurb: 'Near the world record. Are you human?' } },
  { min: 16, rank: { label: 'Autoclicker?', emoji: '🚨', blurb: 'That is above the human record. Nice script.' } },
];

export function rankFor(cps: number): Rank {
  let r = TIERS[0].rank;
  for (const t of TIERS) if (cps >= t.min) r = t.rank;
  return r;
}

export function modeLabel(m: Mode): string {
  return MODES.find((x) => x.id === m)?.label ?? String(m);
}

const KEY = 'cps.best';

export function loadBest(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveBest(best: Record<string, number>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(best));
  } catch {
    /* ignore */
  }
}

export function shareText(cps: number, mode: Mode, clicks: number): string {
  const how = mode === 'target' ? `${clicks} clicks` : `${modeLabel(mode)}`;
  return `I clicked ${cps.toFixed(1)} CPS over ${how} on Click Speed Test 🖱️\n\nThink you're faster? click-speed-test.correia95.workers.dev`;
}
