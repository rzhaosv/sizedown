import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Screen, Eyebrow, PrimaryButton, Card } from '../components/UI';
import { Pnl, Bar, Notice, Facts } from '../components/Bits';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { evalState } from '../logic/stats';
import { money, FIRM_PRESETS } from '../logic/types';
import { FREE_EVALS } from '../config';
import { TabProps } from '../navigation';

export default function EvalsScreen({ navigation }: TabProps<'Evals'>) {
  const { evals, trades, isPro } = useApp();
  const active = evals.filter((e) => e.status === 'active');
  const past = evals.filter((e) => e.status !== 'active');
  const spent = evals.reduce((a, e) => a + (e.cost || 0), 0);
  const add = () => (!isPro && evals.length >= FREE_EVALS ? navigation.navigate('Paywall', { reason: `Free tracks ${FREE_EVALS} eval. If you are running more than one, you are spending real money on challenges; Pro is cheaper than any of them.` }) : navigation.navigate('NewEval'));
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Eyebrow style={{ marginTop: 8 }}>Evals</Eyebrow>
        <Text style={type.h1}>Prop-firm accounts</Text>
        <Text style={[type.bodySoft, { marginTop: 6 }]}>Every trade you attach to an eval is checked against that firm’s actual rules: trailing drawdown, daily loss, consistency, minimum days. The number that matters is the buffer, not the balance.</Text>
        {spent > 0 ? <Text style={[type.caption, { marginTop: 8 }]}>Spent on challenges so far: {money(spent)}</Text> : null}
        <PrimaryButton title="Add an eval" onPress={add} style={{ marginTop: 14, height: 50 }} />
        {active.length === 0 ? <Notice title="No active eval" body={`Presets for ${FIRM_PRESETS.filter((f) => f.firm !== 'custom').map((f) => f.label).join(', ')} and custom rules for anyone else.`} /> : null}
        {active.map((e) => { const st = evalState(e, trades.filter((t) => t.eval_id === e.id)); return (
          <Pressable key={e.id} onPress={() => navigation.navigate('Eval', { id: e.id })} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}><Text style={type.h2}>{e.name || FIRM_PRESETS.find((f) => f.firm === e.firm)?.label || 'Eval'}</Text><Text style={type.caption}>{money(e.account_size)} · {e.drawdown_type.replace('_', ' ')} drawdown</Text></View>
              <Pnl value={st.profit} size={20} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}><Text style={type.label}>Profit target</Text><Text style={type.caption}>{money(st.targetLeft)} to go</Text></View>
            <View style={{ marginTop: 6 }}><Bar value={st.targetPct} color={colors.green} /></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}><Text style={type.label}>Drawdown buffer</Text><Text style={[type.caption, st.ddBufferPct < 0.3 && { color: colors.red }]}>{money(st.ddBuffer)} above the floor</Text></View>
            <View style={{ marginTop: 6 }}><Bar value={st.ddBufferPct} color={st.ddBufferPct < 0.3 ? colors.red : st.ddBufferPct < 0.6 ? colors.accent : colors.green} /></View>
            <View style={{ marginTop: 12 }}><Facts tone={st.blown ? 'red' : st.passed ? 'green' : 'muted'} items={[st.blown ? 'Rule breached' : st.passed ? 'Target met' : `${st.tradingDays} day${st.tradingDays === 1 ? '' : 's'} traded`, st.daysLeft ? `${st.daysLeft} min-day${st.daysLeft === 1 ? '' : 's'} left` : '', st.consistencyOk === false ? 'Consistency rule failing' : '', st.dailyLeft != null ? `${money(st.dailyLeft)} daily loss left` : '']} /></View>
          </Pressable>
        ); })}
        {past.length ? (<><Text style={[type.label, { marginTop: 22 }]}>Past</Text>{past.map((e) => <Pressable key={e.id} onPress={() => navigation.navigate('Eval', { id: e.id })} style={styles.past}><Text style={[type.body, { flex: 1 }]}>{e.name || e.firm}</Text><Facts tone={e.status === 'passed' || e.status === 'funded' ? 'green' : 'red'} items={[e.status]} /></Pressable>)}</>) : null}
        <Card style={{ marginTop: 22 }}>
          <Text style={type.label}>Plain truth about evals</Text>
          <Text style={[type.bodySoft, { marginTop: 6 }]}>Most challenges are failed on drawdown, not on target. The trailing floor moves up with your best day and never comes back down. Size for the floor, not the target, and the target takes care of itself.</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.line, marginTop: 12 },
  past: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
});
