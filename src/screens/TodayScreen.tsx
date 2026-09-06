import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Screen, Eyebrow, PrimaryButton, Card, Chip } from '../components/UI';
import { Pnl, Notice, Bar, Stat } from '../components/Bits';
import { Field } from '../components/Form';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { todayStart, saveDay, getDay } from '../logic/api';
import { ruleWarnings, disciplinedDay, computeStats } from '../logic/stats';
import { money, todayKey, Day } from '../logic/types';
import { TabProps } from '../navigation';
import { useFocusEffect } from '@react-navigation/native';

export default function TodayScreen({ navigation }: TabProps<'Today'>) {
  const { uid, profile, trades, refresh } = useApp();
  const p = profile!;
  const [refreshing, setRefreshing] = useState(false);
  const [day, setDay] = useState<Day | null>(null);
  const [plan, setPlan] = useState('');
  const [review, setReview] = useState('');
  const today = useMemo(() => trades.filter((t) => t.opened_at >= todayStart()), [trades]);
  const net = today.reduce((a, t) => a + t.pnl - (t.fees || 0), 0);
  const warnings = ruleWarnings(today, p);
  const disc = disciplinedDay(today, p);
  const week = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return computeStats(trades.filter((t) => t.opened_at >= d.toISOString())); }, [trades]);
  useFocusEffect(React.useCallback(() => { if (uid) getDay(uid, todayKey()).then((d) => { setDay(d); setPlan(d?.plan ?? ''); setReview(d?.review ?? ''); }); }, [uid]));
  const savePlan = async () => { if (!uid) return; await saveDay(uid, todayKey(), { plan: plan.trim(), review: review.trim() }); Alert.alert('Saved', 'Today’s plan is on record. The app will hold you to it.'); };
  const lossLimitUsed = p.daily_loss_limit ? Math.min(1, Math.max(0, -net / p.daily_loss_limit)) : 0;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); setRefreshing(false); }} tintColor={colors.soft} />} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
          <View><Eyebrow>Today</Eyebrow><Text style={type.h1}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Text></View>
          <Pnl value={net} size={26} />
        </View>
        {warnings.map((w) => <Notice key={w} tone="red" title="Stop. Your rule." body={w} />)}
        <Card style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={type.label}>Daily loss limit</Text><Text style={type.caption}>{p.daily_loss_limit ? `${money(Math.min(0, net))} of -${money(p.daily_loss_limit)}` : 'not set'}</Text></View>
          <View style={{ marginTop: 8 }}><Bar value={lossLimitUsed} color={lossLimitUsed >= 1 ? colors.red : lossLimitUsed > 0.6 ? colors.accent : colors.green} /></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}><Text style={type.label}>Trades</Text><Text style={type.caption}>{today.length}{p.max_trades_per_day ? ` of ${p.max_trades_per_day}` : ''}</Text></View>
          <View style={{ marginTop: 8 }}><Bar value={p.max_trades_per_day ? today.length / p.max_trades_per_day : 0} color={p.max_trades_per_day && today.length >= p.max_trades_per_day ? colors.red : colors.soft} /></View>
          {today.length > 0 && disc.stoppedAt !== null ? <Text style={[type.bodySoft, { marginTop: 12 }]}>If you had stopped when your rules said to, today would be <Pnl value={disc.ifStopped} size={14} /> instead of <Pnl value={disc.actual} size={14} />.</Text> : null}
        </Card>
        <PrimaryButton title="Log a trade" onPress={() => navigation.navigate('LogTrade')} style={{ marginTop: 14, height: 54 }} />

        <Text style={[type.label, { marginTop: 24 }]}>Last 7 days</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Stat label="Net" value={money(week.net)} color={week.net >= 0 ? colors.green : colors.red} />
          <Stat label="Tilt tax" value={money(week.tiltTax)} color={week.tiltTax < 0 ? colors.red : colors.soft} sub="rule-break + tilted trades" />
          <Stat label="Clean days" value={`${week.cleanDays}/${week.tradingDays}`} />
        </View>
        {week.tiltTax < 0 ? <Text style={[type.bodySoft, { marginTop: 10 }]}>Disciplined you made <Pnl value={week.disciplinedNet} size={14} /> this week. Actual you made <Pnl value={week.net} size={14} />. The gap is the tilt tax.</Text> : null}

        <Text style={[type.label, { marginTop: 24 }]}>Today’s plan</Text>
        <Field label="Before the open" value={plan} onChange={setPlan} placeholder="Two setups max. Stop at the limit. Close the app after." multiline maxLength={1000} />
        <Field label="After the close" value={review} onChange={setReview} placeholder="What actually happened. One honest paragraph." multiline maxLength={2000} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <Text style={type.caption}>Grade the day</Text>
          {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => <Chip key={g} small text={g} selected={day?.grade === g} onPress={async () => { if (!uid) return; await saveDay(uid, todayKey(), { grade: g }); setDay({ ...(day ?? { user_id: uid, day: todayKey(), mood_pre: '', plan, review, grade: g }), grade: g }); }} />)}
        </View>
        <PrimaryButton title="Save plan and review" onPress={savePlan} style={{ marginTop: 12, height: 48 }} color={colors.surface2} textColor={colors.ink} />

        {today.length ? (<>
          <Text style={[type.label, { marginTop: 24 }]}>Today’s trades</Text>
          {today.map((t) => (
            <Pressable key={t.id} onPress={() => navigation.navigate('Trade', { id: t.id })} style={styles.row}>
              <View style={{ flex: 1 }}><Text style={[type.body, { fontWeight: '700' }]}>{t.symbol} <Text style={type.caption}>{t.side} · {t.setup || 'no setup'}</Text></Text>{t.emotion || t.rules_broken.length ? <Text style={[type.caption, { color: t.rules_broken.length ? colors.red : colors.muted }]}>{[t.emotion, ...t.rules_broken].filter(Boolean).join(' · ')}</Text> : null}</View>
              <Pnl value={t.pnl - (t.fees || 0)} />
            </Pressable>
          ))}
        </>) : null}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.line, marginTop: 8 } });
