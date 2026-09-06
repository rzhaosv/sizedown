export type Market = 'stocks' | 'options' | 'futures' | 'forex' | 'crypto';
export type Side = 'long' | 'short';
export type Emotion = '' | 'calm' | 'focused' | 'fomo' | 'revenge' | 'bored' | 'anxious' | 'euphoric' | 'tilted';
export type DrawdownType = 'static' | 'eod_trailing' | 'intraday_trailing';

export type Profile = {
  id: string;
  display_name: string;
  markets: Market[];
  account_size: number | null;
  daily_loss_limit: number | null;
  max_trades_per_day: number | null;
  max_risk_per_trade: number | null;
  stop_after_losses: number | null;
  cooloff_minutes: number;
  currency: string;
  onboarded: boolean;
};

export type Trade = {
  id: string;
  user_id: string;
  eval_id: string | null;
  symbol: string;
  market: Market;
  side: Side;
  size: number | null;
  entry: number | null;
  exit: number | null;
  pnl: number;
  fees: number;
  opened_at: string;
  closed_at: string | null;
  setup: string;
  emotion: Emotion;
  followed_plan: boolean | null;
  rules_broken: string[];
  notes: string;
};

export type Eval = {
  id: string;
  user_id: string;
  firm: string;
  name: string;
  account_size: number;
  profit_target: number;
  max_daily_loss: number | null;
  max_drawdown: number;
  drawdown_type: DrawdownType;
  consistency_pct: number | null;
  min_days: number;
  cost: number | null;
  started_at: string;
  status: 'active' | 'passed' | 'failed' | 'funded' | 'ended';
};

export type Day = { user_id: string; day: string; mood_pre: string; plan: string; review: string; grade: '' | 'A' | 'B' | 'C' | 'D' | 'F' };

export type Entitlement = { plan: 'monthly' | 'lifetime'; status: 'active' | 'canceled' | 'past_due'; current_period_end: string | null } | null;

export const EMOTIONS: { value: Emotion; label: string; bad?: boolean }[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'focused', label: 'Focused' },
  { value: 'bored', label: 'Bored', bad: true },
  { value: 'fomo', label: 'FOMO', bad: true },
  { value: 'anxious', label: 'Anxious', bad: true },
  { value: 'revenge', label: 'Revenge', bad: true },
  { value: 'euphoric', label: 'Euphoric', bad: true },
  { value: 'tilted', label: 'Tilted', bad: true },
];
export const BAD_EMOTIONS: Emotion[] = ['fomo', 'revenge', 'tilted', 'euphoric', 'bored', 'anxious'];
export const SETUPS = ['ORB', 'VWAP reclaim', 'Breakout', 'Pullback', 'Reversal', 'Gap fill', 'Trend continuation', 'Scalp', 'Swing', 'News', 'No setup'];
export const RULES = [
  'Traded past daily loss limit',
  'Over max trades for the day',
  'Oversized after a loss',
  'No stop',
  'Moved stop',
  'Chased entry',
  'Traded outside my hours',
  'Added to a loser',
  'Took a trade with no setup',
];
export const MARKETS: { value: Market; label: string }[] = [
  { value: 'stocks', label: 'Stocks' }, { value: 'options', label: 'Options' }, { value: 'futures', label: 'Futures' }, { value: 'forex', label: 'Forex' }, { value: 'crypto', label: 'Crypto' },
];

/** Prop-firm presets. Percentages of account size. Rules change often; users can edit every field. */
export type FirmPreset = { firm: string; label: string; sizes: number[]; target: number; dailyLoss: number | null; drawdown: number; ddType: DrawdownType; consistency: number | null; minDays: number; note: string };
export const FIRM_PRESETS: FirmPreset[] = [
  { firm: 'apex', label: 'Apex Trader Funding', sizes: [25000, 50000, 100000, 150000, 250000, 300000], target: 6, dailyLoss: null, drawdown: 5, ddType: 'intraday_trailing', consistency: null, minDays: 1, note: 'Trailing drawdown follows your high-water mark intraday until it locks.' },
  { firm: 'topstep', label: 'Topstep', sizes: [50000, 100000, 150000], target: 6, dailyLoss: 2, drawdown: 4, ddType: 'eod_trailing', consistency: 50, minDays: 2, note: 'Consistency: no single day may be more than 50% of your total profit.' },
  { firm: 'ftmo', label: 'FTMO', sizes: [10000, 25000, 50000, 100000, 200000], target: 10, dailyLoss: 5, drawdown: 10, ddType: 'static', consistency: null, minDays: 4, note: 'Phase 1 target 10%, Phase 2 target 5%.' },
  { firm: 'mffu', label: 'MyFundedFutures', sizes: [50000, 100000, 150000], target: 6, dailyLoss: 2.5, drawdown: 4, ddType: 'eod_trailing', consistency: 40, minDays: 1, note: 'Rules vary by plan (Starter / Expert / Milestone).' },
  { firm: 'fundednext', label: 'FundedNext', sizes: [25000, 50000, 100000, 200000], target: 5, dailyLoss: 5, drawdown: 10, ddType: 'static', consistency: null, minDays: 5, note: 'Stellar 2-step shown; other plans differ.' },
  { firm: 'custom', label: 'Custom', sizes: [10000, 25000, 50000, 100000], target: 8, dailyLoss: 4, drawdown: 8, ddType: 'static', consistency: null, minDays: 0, note: 'Type the rules exactly as your firm states them.' },
];

export const money = (n: number, currency = 'USD') => {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const s = abs >= 10000 ? abs.toLocaleString(undefined, { maximumFractionDigits: 0 }) : abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${currency === 'USD' ? '$' : ''}${s}`;
};
export const pct = (n: number) => `${(n * 100).toFixed(0)}%`;
export const dayKey = (d: Date | string) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const todayKey = () => dayKey(new Date());
