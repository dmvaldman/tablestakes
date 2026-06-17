import { useState } from "react";
import { type Me } from "../lib/identity";
import { friendStats, luckStats, type FriendStat, type LuckPoint } from "../lib/stats";
import { money } from "../lib/format";
import { useMyMeals } from "../lib/useMyMeals";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";

// Your experience of the game: the fairness funnel, your luck, and the people
// you've played with.
export default function Stats({ me }: { me: Me }) {
  const meals = useMyMeals(me);
  const [open, setOpen] = useState<string | null>(null);

  if (meals === undefined) return <Spinner />;
  if (meals.length === 0)
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-on-surface-variant">
        <p className="text-xl font-medium text-on-surface">No stats yet</p>
        <p className="mt-1 text-lg">Play a meal to start your track record</p>
      </div>
    );

  const luck = luckStats(meals, me.id);
  const friends = friendStats(meals, me.id);
  const up = luck.luck >= 0;
  const lastDev = luck.series.length
    ? luck.series[luck.series.length - 1].dev
    : 0;
  const luckPct = Math.round(Math.abs(lastDev) * 100);

  return (
    <div className="space-y-5 pt-1">
      {/* Luck over time */}
      <section>
        <SectionHeader>Luck Over Time</SectionHeader>
        <div className="mt-2 rounded-2xl bg-surface-container p-4">
          {luck.informative >= 2 ? (
            <Funnel series={luck.series} />
          ) : (
            <p className="text-on-surface-variant">
              Play a couple of meals with friends and your fairness curve will
              show up here.
            </p>
          )}
        </div>
      </section>

      {/* Your luck — only once there's a meal that can carry luck (σ > 0) */}
      {luck.sigma > 0 && (
        <section>
          <SectionHeader>Current Luck</SectionHeader>
          <div className="mt-2 rounded-2xl bg-surface-container p-4">
            <p className="text-lg font-semibold">
              {up ? "Up " : "Down "}
              <span className={up ? "text-green-400" : "text-red-400"}>
                {luckPct}%
              </span>
            </p>
            <p className="mt-1 text-on-surface-variant">
              {up
                ? `Luckier than ${Math.round(luck.percentile * 100)}% of outcomes`
                : `Unluckier than ${Math.round((1 - luck.percentile) * 100)}% of outcomes`}
            </p>
          </div>
        </section>
      )}

      {/* Fellow Diners */}
      {friends.length > 0 && (
        <section>
          <SectionHeader>Fellow Diners</SectionHeader>
          <ul className="mt-2 space-y-2">
            {friends.map((f) => (
              <FriendRow
                key={f.userId}
                f={f}
                expanded={open === f.userId}
                onToggle={() =>
                  setOpen((cur) => (cur === f.userId ? null : f.userId))
                }
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-1 text-xl font-semibold text-on-surface">{children}</h3>
  );
}

function FriendRow({
  f,
  expanded,
  onToggle,
}: {
  f: FriendStat;
  expanded: boolean;
  onToggle: () => void;
}) {
  const theirLuck = f.sharedShare - f.amountTheyPaid;
  const luckUp = theirLuck >= 0;
  const luckPct =
    f.sharedShare > 0 ? Math.round((theirLuck / f.sharedShare) * 100) : 0;

  return (
    <li className="overflow-hidden rounded-2xl bg-surface-container">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left transition active:bg-surface-container-high"
      >
        <Avatar name={f.name} colorKey={f.userId} size={36} />
        <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
        <span className="shrink-0 text-sm text-on-surface-variant">
          {f.timesTogether} meal{f.timesTogether === 1 ? "" : "s"}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-on-surface-variant transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <dl className="space-y-1.5 border-t border-outline-variant px-3 py-3 text-sm">
          <Row label="Their luck">
            <span className={luckUp ? "text-green-400" : "text-red-400"}>
              {luckUp ? "+" : "−"}
              {Math.abs(luckPct)}%
            </span>
          </Row>
          <Row label="You paid">
            {f.timesYouPaid}× · {money(f.amountYouPaid)}
          </Row>
          <Row label="They paid">
            {f.timesTheyPaid}× · {money(f.amountTheyPaid)}
          </Row>
        </dl>
      )}
    </li>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The funnel: cumulative relative luck (share − paid)/share over time, inside
// the ±2σ "normal luck" envelope. Time x-axis, percentage y-axis.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86_400_000;

// Smallest "nice" percentage step (as a fraction) that is ≥ the target.
function niceStep(target: number): number {
  const steps = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5];
  for (const s of steps) if (target <= s) return s;
  return Math.ceil(target);
}

function pctLabel(v: number): string {
  const p = Math.round(v * 100);
  return p === 0 ? "0%" : `${p > 0 ? "+" : "−"}${Math.abs(p)}%`;
}

// Up to 6 time ticks across [t0, t1], labelled by month or (for long spans) year.
function timeTicks(t0: number, t1: number): { t: number; label: string }[] {
  if (t1 <= t0) return [{ t: t0, label: MONTHS[new Date(t0).getMonth()] }];
  const useYears = (t1 - t0) / DAY > 365 * 1.5;

  if (useYears) {
    const y0 = new Date(t0).getFullYear();
    const y1 = new Date(t1).getFullYear();
    const step = Math.max(1, Math.ceil((y1 - y0 + 1) / 6));
    const out: { t: number; label: string }[] = [];
    for (let y = y0; y <= y1; y += step)
      out.push({ t: new Date(y, 0, 1).getTime(), label: String(y) });
    return out.filter((tk) => tk.t >= t0 - DAY && tk.t <= t1 + DAY);
  }

  // Month starts within range.
  const start = new Date(t0);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const months: number[] = [];
  const cur = new Date(start);
  while (cur.getTime() <= t1) {
    months.push(cur.getTime());
    cur.setMonth(cur.getMonth() + 1);
  }
  const step = Math.max(1, Math.ceil(months.length / 6));
  const out: { t: number; label: string }[] = [];
  for (let i = 0; i < months.length; i += step)
    out.push({ t: months[i], label: MONTHS[new Date(months[i]).getMonth()] });
  return out;
}

function Funnel({ series: allPoints }: { series: LuckPoint[] }) {
  // Show the last 10 points or the last 3 months, whichever spans more — then
  // the axes (below) auto-scale to just this window. Cumulative dev/band values
  // already encode the full history, so slicing only affects what's drawn.
  const cutoff = Date.now() - 90 * DAY;
  const minStart = Math.max(0, allPoints.length - 10);
  const series = allPoints.filter((p, i) => i >= minStart || p.t >= cutoff);

  const W = 340;
  const H = 196;
  const ML = 46; // left margin for y labels + ticks
  const MR = 10;
  const MT = 12;
  const MB = 24; // bottom margin for x labels
  const px0 = ML;
  const px1 = W - MR;
  const py0 = MT;
  const py1 = H - MB;
  const pmid = (py0 + py1) / 2;
  const n = series.length;

  const t0 = series[0].t;
  const t1 = series[n - 1].t;
  const xOf = (t: number) =>
    t1 > t0 ? px0 + (px1 - px0) * ((t - t0) / (t1 - t0)) : (px0 + px1) / 2;

  // y range: cover the data and the band (2σ), symmetric, with buffer.
  const maxMag = Math.max(
    0.1,
    ...series.map((s) => Math.abs(s.dev)),
    ...series.map((s) => s.band),
  );
  const yStep = niceStep((maxMag * 1.25) / 2); // 2 steps per side → 5 y ticks
  const yLim = yStep * 2;
  const yOf = (v: number) => pmid - (v / yLim) * (pmid - py0);

  const yTicks: number[] = [];
  for (let v = -yLim; v <= yLim + 1e-9; v += yStep) yTicks.push(v);

  const xTicks = timeTicks(t0, t1);

  const bandPath =
    series.map((s, i) => `${i === 0 ? "M" : "L"}${xOf(s.t)},${yOf(s.band)}`).join(" ") +
    " " +
    [...series]
      .reverse()
      .map((s) => `L${xOf(s.t)},${yOf(-s.band)}`)
      .join(" ") +
    " Z";

  const linePath = series
    .map((s, i) => `${i === 0 ? "M" : "L"}${xOf(s.t)},${yOf(s.dev)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full">
      {/* y-axis line */}
      <line
        x1={px0}
        y1={py0}
        x2={px0}
        y2={py1}
        stroke="var(--color-outline-variant)"
      />
      {/* y gridlines, tick marks + labels (skip 0 — that's the fair line) */}
      {yTicks.map((v, i) => (
        <g key={i}>
          {Math.abs(v) > 1e-9 && (
            <line
              x1={px0}
              y1={yOf(v)}
              x2={px1}
              y2={yOf(v)}
              stroke="var(--color-outline-variant)"
              opacity="0.3"
            />
          )}
          <line
            x1={px0 - 4}
            y1={yOf(v)}
            x2={px0}
            y2={yOf(v)}
            stroke="var(--color-outline-variant)"
          />
          <text
            x={px0 - 8}
            y={yOf(v) + 4}
            fontSize="11"
            textAnchor="end"
            fill="var(--color-on-surface-variant)"
          >
            {pctLabel(v)}
          </text>
        </g>
      ))}

      {/* normal-luck envelope */}
      <path d={bandPath} fill="var(--color-primary)" opacity="0.13" />

      {/* fair (even-split) line — pronounced */}
      <line
        x1={px0}
        y1={pmid}
        x2={px1}
        y2={pmid}
        stroke="var(--color-on-surface-variant)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />

      {/* your track */}
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {n <= 30 &&
        series.map((s, i) => (
          <circle
            key={i}
            cx={xOf(s.t)}
            cy={yOf(s.dev)}
            r="2.5"
            fill="var(--color-primary)"
          />
        ))}

      {/* x ticks (time) */}
      {xTicks.map((tk, i) => (
        <text
          key={i}
          x={Math.max(px0, Math.min(px1, xOf(tk.t)))}
          y={H - 7}
          fontSize="11"
          textAnchor="middle"
          fill="var(--color-on-surface-variant)"
        >
          {tk.label}
        </text>
      ))}
    </svg>
  );
}
