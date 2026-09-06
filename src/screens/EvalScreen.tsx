import React, { useMemo } from 'react';
import { View, Text, ScrollView, Alert, Pressable, StyleSheet } from 'react-native';
import { Screen, Header, PrimaryButton, GhostButton, Card } from '../components/UI';
import { Pnl, Bar, Facts, Stat } from '../components/Bits';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { evalState, computeStats } from '../logic/stats';
import { updateEval } from '../logic/api';
import { money, FIRM_PRESETS } from '../logic/types';
import { ScreenProps } from '../navigation';

export default function EvalScreen({ navigation, route }: ScreenProps<'Eval'>) {
  const { evals, trades, refresh } = useApp();
  const e = evals.find((x) => x.id === route.params.id);
  const mine = useMemo(() => trades.filter((t) => t.eval_id === route.params.id), [trades, route.params.id]);
  if (!e) return <Screen edges={['top', 'bottom']}><Header title="Eval" onBack={() => navigation.goBack()} /></Screen>;
  const st = evalState(e, mine); const s = computeStats(mine);
  const setStatus = (status: typeof e.status) => Alert.alert(`Mark as ${status}?`, '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Yes', onPress: async () => { await updateEval(e.id, { status }); await refresh(); navigation.goBack(); } }]);
  return (
    <Screen edges={['top', 'bottom']}>
      <Header title={e.name || 'Eval'} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={type.caption}>{FIRM_PRESETS.find((f) => f.firm === e.firm)?.label ?? e.firm} · {money(e.account_size)} · started {e.started_at}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 6 }}><Text style={type.num}>{money(st.balance)}</Text><Pnl value={st.profit} size={18} /></View>
        <Card style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={type.label}>Target {money(e.profit_target)}</Text><Text style={type.caption}>{money(st.targetLeft)} to go</Text></View>
          <View style={{ marginTop: 6 }}><Bar value={st.targetPct} color={colors.green} /></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}><Text style={type.label}>Floor {money(st.ddFloor)}</Text><Text style={[type.caption, st.ddBufferPct < 0.3 && { color: colors.red }]}>{money(st.ddBuffer)} buffer</Text></View>
          <View style={{ marginTop: 6 }}><Bar value={st.ddBufferPct} color={st.ddBufferPct < 0.3 ? colors.red : st.ddBufferPct < 0.6 ? colors.accent : colors.green} /></View>
          <Text style={[type.caption, { marginTop: 10 }]}>{e.drawdown_type === 'static' ? 'Static drawdown: the floor never moves.' : e.drawdown_type === 'eod_trailing' ? 'End-of-day trailing: the floor rises with each day’s closing high-water mark.' : 'Intraday trailing: the floor rises with every new high, live. Give back nothing you cannot afford.'} High-water mark {money(st.highWater)}.</Text>
        </Card>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Stat label="Today" value={money(st.todayPnl)} color={st.todayPnl >= 0 ? colors.green : colors.red} sub={st.dailyLeft != null ? `${money(st.dailyLeft)} daily left` : 'no daily limit'} />
          <Stat label="Days traded" value={`${st.tradingDays}`} sub={st.daysLeft ? `${st.daysLeft} more required` : 'minimum met'} />
          <Stat label="Consistency" value={st.bestDayShare == null ? '—' : `${(st.bestDayShare * 100).toFixed(0)}%`} color={st.consistencyOk === false ? colors.red : colors.ink} sub={e.consistency_pct ? `best day ≤ ${e.consistency_pct}%` : 'no rule'} />
        </View>
        <View style={{ marginTop: 12 }}><Facts tone={st.blown ? 'red' : st.passed ? 'green' : 'muted'} items={[st.blown ? 'A rule has been breached' : st.passed ? 'All conditions met' : 'In progress', `${s.n} trades`, `${(s.winRate * 100).toFixed(0)}% win rate`, s.tiltTax < 0 ? `${money(s.tiltTax)} tilt tax` : '']} /></View>
        <PrimaryButton title="Log a trade to this eval" onPress={() => navigation.navigate('LogTrade', { evalId: e.id })} style={{ marginTop: 16, height: 50 }} />
        <Text style={[type.label, { marginTop: 22 }]}>Trades</Text>
        {mine.map((t) => <Pressable key={t.id} onPress={() => navigation.navigate('Trade', { id: t.id })} style={styles.row}><Text style={[type.body, { flex: 1, fontWeight: '700' }]}>{t.symbol} <Text style={type.caption}>{new Date(t.opened_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text></Text><Pnl value={t.pnl - (t.fees || 0)} /></Pressable>)}
        {e.status === 'active' ? <View style={{ marginTop: 20 }}><GhostButton title="Mark passed" onPress={() => setStatus('passed')} color={colors.green} /><GhostButton title="Mark failed" onPress={() => setStatus('failed')} color={colors.red} /><GhostButton title="Funded" onPress={() => setStatus('funded')} color={colors.accent} /></View> : null}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.line, marginTop: 8 } });
