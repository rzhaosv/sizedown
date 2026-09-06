import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Screen, Eyebrow, PrimaryButton, Card, Chip } from '../components/UI';
import { Field } from '../components/Form';
import { Pnl, Stat, Notice } from '../components/Bits';
import { colors, type } from '../theme';
import { useApp } from '../store/AppContext';
import { computeStats, disciplinedDay } from '../logic/stats';
import { money, dayKey, RULES } from '../logic/types';
import { TabProps } from '../navigation';

export default function RulesScreen({ navigation }: TabProps<'Rules'>) {
  const { profile, trades, updateProfile } = useApp();
  const p = profile!;
  const [dailyLoss, setDailyLoss] = useState(p.daily_loss_limit ? String(p.daily_loss_limit) : '');
  const [maxTrades, setMaxTrades] = useState(p.max_trades_per_day ? String(p.max_trades_per_day) : '');
  const [stopAfter, setStopAfter] = useState(p.stop_after_losses ? String(p.stop_after_losses) : '');
  const [risk, setRisk] = useState(p.max_risk_per_trade ? String(p.max_risk_per_trade) : '');
  const [cooloff, setCooloff] = useState(String(p.cooloff_minutes));
  const [busy, setBusy] = useState(false);
  const s30 = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 30); return computeStats(trades.filter((t) => t.opened_at >= d.toISOString())); }, [trades]);
  const breaks = useMemo(() => { const m = new Map<string, { n: number; pnl: number }>(); trades.forEach((t) => t.rules_broken.forEach((r) => { const cur = m.get(r) ?? { n: 0, pnl: 0 }; m.set(r, { n: cur.n + 1, pnl: cur.pnl + t.pnl - (t.fees || 0) }); })); return [...m.entries()].sort((a, b) => a[1].pnl - b[1].pnl); }, [trades]);
  const lostToStopping = useMemo(() => { const days = new Map<string, typeof trades>(); trades.forEach((t) => { const k = dayKey(t.opened_at); days.set(k, [...(days.get(k) ?? []), t]); }); let gap = 0; days.forEach((ts) => { const d = disciplinedDay(ts, p); gap += d.actual - d.ifStopped; }); return gap; }, [trades, p]);
  const save = async () => {
    setBusy(true);
    try { await updateProfile({ daily_loss_limit: Number(dailyLoss) || null, max_trades_per_day: Number(maxTrades) || null, stop_after_losses: Number(stopAfter) || null, max_risk_per_trade: Number(risk) || null, cooloff_minutes: Number(cooloff) || 15 }); Alert.alert('Saved', 'Rules updated. They apply from the next trade.'); }
    catch (e: any) { Alert.alert('Could not save', e?.message ?? 'Try again.'); } finally { setBusy(false); }
  };
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Eyebrow style={{ marginTop: 8 }}>Rules</Eyebrow>
        <Text style={type.h1}>What you said you would do</Text>
        <Text style={[type.bodySoft, { marginTop: 6 }]}>The app never locks you out. Every rule here is one you wrote. When you are about to break it, the app shows you the sentence, in your words, and lets you decide.</Text>
        <Card style={{ marginTop: 16, borderColor: lostToStopping < 0 ? colors.red : colors.line }}>
          <Text style={type.label}>All time, if you had stopped when your rules said</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 6 }}><Pnl value={lostToStopping} size={28} /><Text style={type.caption}>{lostToStopping < 0 ? 'given back after the stop point' : 'nothing lost to overtrading'}</Text></View>
        </Card>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Stat label="Rule breaks, 30d" value={String(s30.ruleBreaks)} color={s30.ruleBreaks ? colors.red : colors.green} />
          <Stat label="Clean days, 30d" value={`${s30.cleanDays}/${s30.tradingDays}`} />
          <Stat label="Tilt tax, 30d" value={money(s30.tiltTax)} color={s30.tiltTax < 0 ? colors.red : colors.soft} />
        </View>
        {breaks.length ? (<>
          <Text style={[type.label, { marginTop: 22 }]}>Which rules cost you most</Text>
          {breaks.map(([r, v]) => <View key={r} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}><Text style={[type.body, { flex: 1 }]}>{r}</Text><Text style={[type.caption, { width: 40 }]}>{v.n}×</Text><Pnl value={v.pnl} size={14} /></View>)}
        </>) : <Notice title="No rule breaks logged" body="When you log a trade and answer “No” to following your plan, the rule you broke lands here with its cost." />}
        <Text style={[type.label, { marginTop: 24 }]}>Edit your rules</Text>
        <Field label="Daily loss limit ($)" value={dailyLoss} onChange={setDailyLoss} placeholder="500" keyboardType="default" />
        <Field label="Max trades per day" value={maxTrades} onChange={setMaxTrades} placeholder="4" keyboardType="default" />
        <Field label="Stop after N losses in a row" value={stopAfter} onChange={setStopAfter} placeholder="2" keyboardType="default" />
        <Field label="Max risk per trade ($)" value={risk} onChange={setRisk} placeholder="150" keyboardType="default" />
        <Field label="Cool-off after a red trade (minutes)" value={cooloff} onChange={setCooloff} placeholder="15" keyboardType="default" />
        <PrimaryButton title="Save rules" onPress={save} loading={busy} style={{ marginTop: 18 }} />
        <Text style={[type.label, { marginTop: 24 }]}>The usual suspects</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{RULES.map((r) => <Chip key={r} small text={r} />)}</View>
      </ScrollView>
    </Screen>
  );
}
