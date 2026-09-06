import { Trade, Eval, BAD_EMOTIONS, dayKey, Profile } from './types';

export type Stats = {
  n: number; wins: number; losses: number; winRate: number; net: number; gross: number; fees: number;
  avgWin: number; avgLoss: number; expectancy: number; profitFactor: number; best: number; worst: number;
  tiltTax: number; disciplinedNet: number; ruleBreaks: number; cleanDays: number; tradingDays: number; greenDays: number; redDays: number; maxDrawdown: number;
};

export function computeStats(trades: Trade[]): Stats {
  const n = trades.length;
  const pnls = trades.map((t) => t.pnl - (t.fees || 0));
  const wins = pnls.filter((p) => p > 0); const losses = pnls.filter((p) => p < 0);
  const net = pnls.reduce((a, b) => a + b, 0);
  const gross = trades.reduce((a, t) => a + t.pnl, 0);
  const fees = trades.reduce((a, t) => a + (t.fees || 0), 0);
  const sumW = wins.reduce((a, b) => a + b, 0); const sumL = Math.abs(losses.reduce((a, b) => a + b, 0));
  const tilted = trades.filter((t) => BAD_EMOTIONS.includes(t.emotion) || t.followed_plan === false || t.rules_broken.length > 0);
  const tiltTax = tilted.reduce((a, t) => a + (t.pnl - (t.fees || 0)), 0);
  const byDay = new Map<string, number>();
  trades.forEach((t) => { const k = dayKey(t.opened_at); byDay.set(k, (byDay.get(k) ?? 0) + t.pnl - (t.fees || 0)); });
  const dayVals = [...byDay.values()];
  const cleanDayKeys = new Set([...byDay.keys()].filter((k) => !trades.some((t) => dayKey(t.opened_at) === k && (t.rules_broken.length > 0 || t.followed_plan === false))));
  // equity curve drawdown
  let peak = 0, eq = 0, maxDD = 0;
  [...trades].sort((a, b) => a.opened_at.localeCompare(b.opened_at)).forEach((t) => { eq += t.pnl - (t.fees || 0); peak = Math.max(peak, eq); maxDD = Math.max(maxDD, peak - eq); });
  return {
    n, wins: wins.length, losses: losses.length, winRate: n ? wins.length / n : 0, net, gross, fees,
    avgWin: wins.length ? sumW / wins.length : 0, avgLoss: losses.length ? sumL / losses.length : 0,
    expectancy: n ? net / n : 0, profitFactor: sumL ? sumW / sumL : sumW > 0 ? Infinity : 0,
    best: pnls.length ? Math.max(...pnls) : 0, worst: pnls.length ? Math.min(...pnls) : 0,
    tiltTax, disciplinedNet: net - tiltTax, ruleBreaks: trades.reduce((a, t) => a + t.rules_broken.length, 0),
    cleanDays: cleanDayKeys.size, tradingDays: byDay.size, greenDays: dayVals.filter((v) => v > 0).length, redDays: dayVals.filter((v) => v < 0).length, maxDrawdown: maxDD,
  };
}

export function groupBy<K extends string>(trades: Trade[], key: (t: Trade) => K): { key: K; n: number; net: number; winRate: number }[] {
  const m = new Map<K, Trade[]>();
  trades.forEach((t) => { const k = key(t); m.set(k, [...(m.get(k) ?? []), t]); });
  return [...m.entries()].map(([k, ts]) => { const s = computeStats(ts); return { key: k, n: s.n, net: s.net, winRate: s.winRate }; }).sort((a, b) => b.net - a.net);
}

/** What the day would have been if the trader had stopped at the daily loss limit / max trades. */
export function disciplinedDay(dayTrades: Trade[], p: Profile): { actual: number; ifStopped: number; stoppedAt: number | null } {
  const sorted = [...dayTrades].sort((a, b) => a.opened_at.localeCompare(b.opened_at));
  let run = 0; let ifStopped: number | null = null; let losses = 0; let idx: number | null = null;
  sorted.forEach((t, i) => {
    if (ifStopped !== null) return;
    const hitTrades = p.max_trades_per_day ? i >= p.max_trades_per_day : false;
    const hitLoss = p.daily_loss_limit ? run <= -Math.abs(p.daily_loss_limit) : false;
    const hitStreak = p.stop_after_losses ? losses >= p.stop_after_losses : false;
    if (hitTrades || hitLoss || hitStreak) { ifStopped = run; idx = i; return; }
    run += t.pnl - (t.fees || 0);
    if (t.pnl < 0) losses += 1; else losses = 0;
  });
  const actual = sorted.reduce((a, t) => a + t.pnl - (t.fees || 0), 0);
  return { actual, ifStopped: ifStopped ?? actual, stoppedAt: idx };
}

/** Live rule check for the "log a trade" screen. */
export function ruleWarnings(todayTrades: Trade[], p: Profile): string[] {
  const w: string[] = [];
  const net = todayTrades.reduce((a, t) => a + t.pnl - (t.fees || 0), 0);
  if (p.daily_loss_limit && net <= -Math.abs(p.daily_loss_limit)) w.push(`You are past your daily loss limit (${net.toFixed(0)}). Your rule says stop.`);
  if (p.max_trades_per_day && todayTrades.length >= p.max_trades_per_day) w.push(`That is ${todayTrades.length} trades today. Your max is ${p.max_trades_per_day}.`);
  if (p.stop_after_losses) {
    const sorted = [...todayTrades].sort((a, b) => b.opened_at.localeCompare(a.opened_at));
    let streak = 0; for (const t of sorted) { if (t.pnl < 0) streak += 1; else break; }
    if (streak >= p.stop_after_losses) w.push(`${streak} losses in a row. Your rule: stop after ${p.stop_after_losses}.`);
  }
  const last = [...todayTrades].sort((a, b) => b.opened_at.localeCompare(a.opened_at))[0];
  if (last && last.pnl < 0 && Date.now() - new Date(last.opened_at).getTime() < p.cooloff_minutes * 60_000) {
    const left = Math.ceil((p.cooloff_minutes * 60_000 - (Date.now() - new Date(last.opened_at).getTime())) / 60_000);
    w.push(`Cool-off: ${left} min left since that red trade.`);
  }
  return w;
}

/** Prop-firm eval math. Trades attached to the eval, in time order. */
export type EvalState = {
  balance: number; profit: number; targetPct: number; targetLeft: number;
  ddFloor: number; ddBuffer: number; ddBufferPct: number; highWater: number;
  todayPnl: number; dailyLeft: number | null; tradingDays: number; daysLeft: number; consistencyOk: boolean | null; bestDayShare: number | null; blown: boolean; passed: boolean;
};
export function evalState(e: Eval, trades: Trade[]): EvalState {
  const sorted = [...trades].sort((a, b) => a.opened_at.localeCompare(b.opened_at));
  let bal = e.account_size; let hw = e.account_size; let floor = e.account_size - e.max_drawdown;
  let eodHigh = e.account_size; let lastDay = '';
  for (const t of sorted) {
    const k = dayKey(t.opened_at);
    if (e.drawdown_type === 'eod_trailing' && lastDay && k !== lastDay) { eodHigh = Math.max(eodHigh, bal); floor = Math.max(floor, Math.min(eodHigh - e.max_drawdown, e.account_size)); }
    bal += t.pnl - (t.fees || 0);
    if (e.drawdown_type === 'intraday_trailing') { hw = Math.max(hw, bal); floor = Math.max(floor, Math.min(hw - e.max_drawdown, e.account_size)); }
    lastDay = k;
  }
  if (e.drawdown_type === 'eod_trailing') { eodHigh = Math.max(eodHigh, bal); }
  const profit = bal - e.account_size;
  const byDay = new Map<string, number>(); sorted.forEach((t) => { const k = dayKey(t.opened_at); byDay.set(k, (byDay.get(k) ?? 0) + t.pnl - (t.fees || 0)); });
  const today = byDay.get(dayKey(new Date())) ?? 0;
  const bestDay = Math.max(0, ...byDay.values());
  const bestDayShare = profit > 0 ? bestDay / profit : null;
  const consistencyOk = e.consistency_pct == null ? null : bestDayShare == null ? true : bestDayShare <= e.consistency_pct / 100;
  return {
    balance: bal, profit, targetPct: Math.min(1, Math.max(0, profit / e.profit_target)), targetLeft: Math.max(0, e.profit_target - profit),
    ddFloor: floor, ddBuffer: bal - floor, ddBufferPct: Math.max(0, Math.min(1, (bal - floor) / e.max_drawdown)), highWater: Math.max(hw, eodHigh),
    todayPnl: today, dailyLeft: e.max_daily_loss != null ? e.max_daily_loss + Math.min(0, today) : null,
    tradingDays: byDay.size, daysLeft: Math.max(0, e.min_days - byDay.size), consistencyOk, bestDayShare,
    blown: bal <= floor || (e.max_daily_loss != null && today <= -e.max_daily_loss), passed: profit >= e.profit_target && byDay.size >= e.min_days && consistencyOk !== false,
  };
}
