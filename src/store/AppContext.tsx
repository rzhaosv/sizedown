import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Profile, Entitlement, Trade, Eval } from '../logic/types';
import { ensureSession, getProfile, saveProfile, getEntitlement, listTrades, listEvals, restoreWithSession } from '../logic/api';
import { supabase } from '../services/supabase';
import { demo } from '../dev/demo';
import { configureBilling, getCustomerInfo, isPlus as rcIsPro, addPlusListener } from '../services/billing';

const DEV_UNLOCK = process.env.EXPO_PUBLIC_DEV_UNLOCK === '1';
const PREFS_KEY = 'sizedown.prefs.v1';
export type Prefs = { seenPaywall: boolean };
const DEFAULT_PREFS: Prefs = { seenPaywall: false };

type Ctx = {
  ready: boolean; offline: boolean; error: string | null; uid: string | null;
  profile: Profile | null; entitlement: Entitlement; isPro: boolean;
  trades: Trade[]; evals: Eval[];
  prefs: Prefs; setPrefs: (p: Partial<Prefs>) => void;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  refresh: () => Promise<void>;
  refreshEntitlement: () => Promise<boolean>;
  retry: () => void;
};
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [evals, setEvals] = useState<Eval[]>([]);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [attempt, setAttempt] = useState(0);
  const [rcPro, setRcPro] = useState(false);
  const offline = !supabase && !demo;

  const load = useCallback(async (id: string) => {
    const [p, e, t, ev] = await Promise.all([getProfile(id), getEntitlement(id), listTrades(id), listEvals(id)]);
    setProfile(p); setEntitlement(e); setTrades(t); setEvals(ev);
  }, []);

  useEffect(() => {
    (async () => {
      try { const raw = await AsyncStorage.getItem(PREFS_KEY); if (raw) setPrefsState({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); } catch { /* fresh */ }
      if (offline) { setReady(true); return; }
      try {
        const id = await ensureSession();
        setUid(id);
        // Back from Stripe: ?upgraded=1&session_id=cs_... — give the webhook a moment, then re-link if it has not landed.
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const qs = new URLSearchParams(window.location.search);
          const sid = qs.get('session_id');
          if (qs.get('upgraded') === '1' && sid) {
            try { await AsyncStorage.setItem('sizedown.session', sid); } catch { /* ignore */ }
            let ent = await getEntitlement(id);
            if (!ent) { await new Promise((r) => setTimeout(r, 2500)); ent = await getEntitlement(id); }
            if (!ent) { await restoreWithSession(sid, id).catch(() => false); }
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
        await load(id);
        if (Platform.OS !== 'web') { configureBilling(id); const info = await getCustomerInfo(); if (rcIsPro(info)) setRcPro(true); addPlusListener((v) => setRcPro(v)); }
        setError(null);
      } catch (e: any) { setError(e?.message ?? 'Could not reach the server.'); }
      setReady(true);
    })();
  }, [attempt, offline, load]);

  const setPrefs = useCallback((p: Partial<Prefs>) => {
    setPrefsState((prev) => { const next = { ...prev, ...p }; AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {}); return next; });
  }, []);
  const updateProfile = useCallback(async (patch: Partial<Profile>) => { if (!uid) return; setProfile(await saveProfile(uid, patch)); }, [uid]);
  const refresh = useCallback(async () => { if (uid) await load(uid); }, [uid, load]);
  const refreshEntitlement = useCallback(async () => { if (!uid) return false; const e = await getEntitlement(uid); setEntitlement(e); return !!e && e.status !== 'canceled'; }, [uid]);
  const isPro = DEV_UNLOCK || rcPro || (!!entitlement && entitlement.status !== 'canceled' && (entitlement.plan === 'lifetime' || !entitlement.current_period_end || new Date(entitlement.current_period_end).getTime() + 3 * 86400_000 > Date.now()));

  return (
    <AppCtx.Provider value={{ ready, offline, error, uid, profile, entitlement, isPro, trades, evals, prefs, setPrefs, updateProfile, refresh, refreshEntitlement, retry: () => { setReady(false); setAttempt((a) => a + 1); } }}>
      {children}
    </AppCtx.Provider>
  );
}
export function useApp(): Ctx { const c = useContext(AppCtx); if (!c) throw new Error('useApp outside provider'); return c; }
