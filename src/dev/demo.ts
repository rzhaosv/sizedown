/** Web-only demo data for screenshots: `?demo=<today|journal|rules|eval|me|paywall|onboard|trade>`. Null on native. */
import { Platform } from 'react-native';
import { Profile, Trade, Eval, Day } from '../logic/types';
export type DemoName = 'today' | 'journal' | 'rules' | 'eval' | 'me' | 'paywall' | 'onboard' | 'trade';
const VALID: DemoName[] = ['today', 'journal', 'rules', 'eval', 'me', 'paywall', 'onboard', 'trade'];
function read(): { name: DemoName } | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const n = new URLSearchParams(window.location.search).get('demo') as DemoName | null;
  return n && VALID.includes(n) ? { name: n } : null;
}
export const demo = read();
const ago = (d: number, h: number, m = 0) => { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h, m, 0, 0); return x.toISOString(); };
export const DEMO_PROFILE: Profile = { id: 'me', display_name: 'Marcus', markets: ['futures', 'options'], account_size: 25000, daily_loss_limit: 500, max_trades_per_day: 4, max_risk_per_trade: 150, stop_after_losses: 2, cooloff_minutes: 15, currency: 'USD', onboarded: true };
const T = (id: string, d: number, h: number, sym: string, market: Trade['market'], side: Trade['side'], pnl: number, setup: string, emotion: Trade['emotion'], followed: boolean, rules: string[] = [], notes = '', evalId: string | null = 'ev1'): Trade => ({ id, user_id: 'me', eval_id: evalId, symbol: sym, market, side, size: market === 'futures' ? 2 : 1, entry: null, exit: null, pnl, fees: market === 'futures' ? 4.5 : 1.3, opened_at: ago(d, h), closed_at: null, setup, emotion, followed_plan: followed, rules_broken: rules, notes });
export const DEMO_TRADES: Trade[] = [
  T('t1', 0, 9, 'MNQ', 'futures', 'long', 210, 'ORB', 'focused', true),
  T('t2', 0, 10, 'MNQ', 'futures', 'short', -140, 'Reversal', 'calm', true),
  T('t3', 1, 9, 'ES', 'futures', 'long', 325, 'VWAP reclaim', 'focused', true),
  T('t4', 1, 11, 'ES', 'futures', 'long', -260, 'Breakout', 'fomo', false, ['Chased entry']),
  T('t5', 1, 11, 'ES', 'futures', 'long', -410, 'No setup', 'revenge', false, ['Oversized after a loss', 'Traded past daily loss limit'], 'Wanted it back. Doubled size. Classic.'),
  T('t6', 2, 9, 'NQ', 'futures', 'short', 480, 'ORB', 'focused', true),
  T('t7', 2, 10, 'SPY 0DTE', 'options', 'long', 95, 'Trend continuation', 'calm', true),
  T('t8', 3, 9, 'MNQ', 'futures', 'long', -120, 'Pullback', 'anxious', true),
  T('t9', 3, 14, 'TSLA 0DTE', 'options', 'long', -380, 'News', 'tilted', false, ['Traded outside my hours', 'No stop'], 'Lunch chop. Knew it was chop.'),
  T('t10', 4, 9, 'ES', 'futures', 'long', 290, 'VWAP reclaim', 'focused', true),
  T('t11', 4, 10, 'ES', 'futures', 'long', 160, 'Pullback', 'focused', true),
  T('t12', 7, 9, 'MNQ', 'futures', 'short', 240, 'ORB', 'calm', true),
  T('t13', 7, 10, 'MNQ', 'futures', 'short', -90, 'Scalp', 'bored', false, ['Took a trade with no setup']),
  T('t14', 8, 9, 'NQ', 'futures', 'long', 610, 'Breakout', 'focused', true),
  T('t15', 9, 9, 'MNQ', 'futures', 'long', -150, 'ORB', 'calm', true),
  T('t16', 9, 10, 'MNQ', 'futures', 'long', 130, 'Pullback', 'focused', true),
  T('t17', 10, 9, 'ES', 'futures', 'short', -220, 'Reversal', 'euphoric', false, ['Moved stop']),
  T('t18', 11, 9, 'ES', 'futures', 'long', 350, 'VWAP reclaim', 'focused', true),
];
export const DEMO_EVALS: Eval[] = [
  { id: 'ev1', user_id: 'me', firm: 'apex', name: 'Apex 50K eval', account_size: 50000, profit_target: 3000, max_daily_loss: null, max_drawdown: 2500, drawdown_type: 'intraday_trailing', consistency_pct: null, min_days: 1, cost: 167, started_at: ago(12, 0).slice(0, 10), status: 'active' },
];
export const DEMO_DAYS: Day[] = [
  { user_id: 'me', day: ago(1, 0).slice(0, 10), mood_pre: 'anxious', plan: 'Two ORB trades max. Stop at -500.', review: 'Took the first two fine. Then chased ES, lost, doubled. Broke my own rule with eyes open.', grade: 'D' },
  { user_id: 'me', day: ago(0, 0).slice(0, 10), mood_pre: 'calm', plan: 'Same plan. Stop at -500. Close the app after trade 2 if red.', review: '', grade: '' },
];
