import { supabase } from '../services/supabase';
import { Profile, Trade, Eval, Day, Entitlement, dayKey } from './types';
import { demo, DEMO_PROFILE, DEMO_TRADES, DEMO_EVALS, DEMO_DAYS } from '../dev/demo';

function db() { if (!supabase) throw new Error('offline'); return supabase; }
const PCOLS = 'id,display_name,markets,account_size,daily_loss_limit,max_trades_per_day,max_risk_per_trade,stop_after_losses,cooloff_minutes,currency,onboarded';

export async function ensureSession(): Promise<string> {
  if (demo) return 'me';
  const s = db();
  const { data } = await s.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const { data: signed, error } = await s.auth.signInAnonymously();
  if (error || !signed.user) throw error ?? new Error('no session');
  return signed.user.id;
}
export async function getProfile(uid: string): Promise<Profile | null> {
  if (demo) return demo.name === 'onboard' ? null : DEMO_PROFILE;
  const { data } = await db().from('sd_profiles').select(PCOLS).eq('id', uid).maybeSingle();
  return (data as Profile | null) ?? null;
}
export async function saveProfile(uid: string, patch: Partial<Profile>): Promise<Profile> {
  if (demo) return { ...DEMO_PROFILE, ...patch };
  const { data, error } = await db().from('sd_profiles').upsert({ id: uid, ...patch }).select(PCOLS).single();
  if (error) throw error; return data as Profile;
}
export async function getEntitlement(uid: string): Promise<Entitlement> {
  if (demo) return demo.name === 'paywall' ? null : { plan: 'lifetime', status: 'active', current_period_end: null };
  const { data } = await db().from('sd_entitlements').select('plan,status,current_period_end').eq('user_id', uid).maybeSingle();
  return (data as Entitlement) ?? null;
}

export async function listTrades(uid: string, opts: { since?: string; evalId?: string | null; limit?: number } = {}): Promise<Trade[]> {
  if (demo) return DEMO_TRADES.filter((t) => (!opts.since || t.opened_at >= opts.since) && (!opts.evalId || t.eval_id === opts.evalId));
  let q = db().from('sd_trades').select('*').eq('user_id', uid).order('opened_at', { ascending: false }).limit(opts.limit ?? 2000);
  if (opts.since) q = q.gte('opened_at', opts.since);
  if (opts.evalId) q = q.eq('eval_id', opts.evalId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as Trade[];
}
export async function addTrade(uid: string, t: Omit<Trade, 'id' | 'user_id'>): Promise<Trade> {
  if (demo) return { ...t, id: `tmp-${Date.now()}`, user_id: uid };
  const { data, error } = await db().from('sd_trades').insert({ ...t, user_id: uid }).select('*').single();
  if (error) throw error;
  if (t.rules_broken.length) await db().from('sd_violations').insert(t.rules_broken.map((r) => ({ user_id: uid, trade_id: (data as Trade).id, rule: r, occurred_at: t.opened_at })));
  return data as Trade;
}
export async function updateTrade(id: string, patch: Partial<Trade>): Promise<void> {
  if (demo) return; const { error } = await db().from('sd_trades').update(patch).eq('id', id); if (error) throw error;
}
export async function deleteTrade(id: string): Promise<void> {
  if (demo) return; const { error } = await db().from('sd_trades').delete().eq('id', id); if (error) throw error;
}
export async function countTradesThisMonth(uid: string): Promise<number> {
  if (demo) return 12;
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const { count } = await db().from('sd_trades').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('opened_at', start.toISOString());
  return count ?? 0;
}

export async function listEvals(uid: string): Promise<Eval[]> {
  if (demo) return DEMO_EVALS;
  const { data, error } = await db().from('sd_evals').select('*').eq('user_id', uid).order('created_at', { ascending: false }); if (error) throw error; return (data ?? []) as Eval[];
}
export async function addEval(uid: string, e: Omit<Eval, 'id' | 'user_id'>): Promise<Eval> {
  if (demo) return { ...e, id: `tmp-${Date.now()}`, user_id: uid };
  const { data, error } = await db().from('sd_evals').insert({ ...e, user_id: uid }).select('*').single(); if (error) throw error; return data as Eval;
}
export async function updateEval(id: string, patch: Partial<Eval>): Promise<void> {
  if (demo) return; const { error } = await db().from('sd_evals').update(patch).eq('id', id); if (error) throw error;
}

export async function getDay(uid: string, day: string): Promise<Day | null> {
  if (demo) return DEMO_DAYS.find((d) => d.day === day) ?? null;
  const { data } = await db().from('sd_days').select('*').eq('user_id', uid).eq('day', day).maybeSingle(); return (data as Day | null) ?? null;
}
export async function saveDay(uid: string, day: string, patch: Partial<Day>): Promise<void> {
  if (demo) return; const { error } = await db().from('sd_days').upsert({ user_id: uid, day, ...patch }); if (error) throw error;
}
export async function listDays(uid: string, since: string): Promise<Day[]> {
  if (demo) return DEMO_DAYS;
  const { data } = await db().from('sd_days').select('*').eq('user_id', uid).gte('day', since); return (data ?? []) as Day[];
}

export async function restoreWithSession(sessionId: string, uid: string): Promise<boolean> {
  const r = await fetch('https://tryforma.app/api/sizedown-restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionId, new_user: uid }) });
  return r.ok;
}
export async function deleteAccount(): Promise<void> {
  if (demo) return; const { error } = await db().rpc('sd_delete_me'); if (error) throw error; await db().auth.signOut();
}
export function tradesToCsv(trades: Trade[]): string {
  const head = ['opened_at', 'symbol', 'market', 'side', 'size', 'entry', 'exit', 'pnl', 'fees', 'setup', 'emotion', 'followed_plan', 'rules_broken', 'notes'];
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [head.join(','), ...trades.map((t) => [t.opened_at, t.symbol, t.market, t.side, t.size, t.entry, t.exit, t.pnl, t.fees, t.setup, t.emotion, t.followed_plan, t.rules_broken.join('; '), t.notes].map(esc).join(','))].join('\n');
}
export const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
export const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d.toISOString(); };
export { dayKey };
