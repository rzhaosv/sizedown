import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Screen, Eyebrow, Segmented, Chip } from '../components/UI';
import { Pnl, Stat, Facts, Notice } from '../components/Bits';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { computeStats, groupBy } from '../logic/stats';
import { money, dayKey, Trade } from '../logic/types';
import { TabProps } from '../navigation';

type Range = '7' | '30' | '90' | 'all';
export default function JournalScreen({ navigation }: TabProps<'Journal'>) {
  const { trades, isPro } = useApp();
  const [range, setRange] = useState<Range>('30');
  const [view, setView] = useState<'stats' | 'trades'>('stats');
  const filtered = useMemo(() => { if (range === 'all') return trades; const d = new Date(); d.setDate(d.getDate() - Number(range)); return trades.filter((t) => t.opened_at >= d.toISOString()); }, [trades, range]);
  const s = computeStats(filtered);
  const byDay = useMemo(() => { const m = new Map<string, number>(); filtered.forEach((t) => { const k = dayKey(t.opened_at); m.set(k, (m.get(k) ?? 0) + t.pnl - (t.fees || 0)); }); return m; }, [filtered]);
  const weeks = useMemo(() => { const out: string[][] = []; const end = new Date(); end.setHours(0, 0, 0, 0); const start = new Date(end); start.setDate(end.getDate() - 7 * 12 + 1 - ((end.getDay() + 6) % 7)); for (let w = 0; w < 12; w++) { const col: string[] = []; for (let d = 0; d < 7; d++) { const x = new Date(start); x.setDate(start.getDate() + w * 7 + d); col.push(dayKey(x)); } out.push(col); } return out; }, []);
  const gated = !isPro && range !== '7';

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Eyebrow style={{ marginTop: 8 }}>Journal</Eyebrow>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}><Text style={type.h1}>Your numbers</Text><Pnl value={s.net} size={24} /></View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>{(['7', '30', '90', 'all'] as Range[]).map((r) => <Chip key={r} small text={r === 'all' ? 'All' : `${r}d`} selected={range === r} onPress={() => setRange(r)} />)}</View>

        <Text style={[type.label, { marginTop: 18 }]}>Last 12 weeks</Text>
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 8 }}>
          {weeks.map((col, i) => <View key={i} style={{ gap: 3 }}>{col.map((k) => { const v = byDay.get(k); const c = v == null ? colors.surface2 : v > 0 ? colors.green : v < 0 ? colors.red : colors.soft; return <View key={k} style={{ width: 22, height: 14, borderRadius: 3, backgroundColor: c, opacity: v == null ? 1 : Math.min(1, 0.45 + Math.abs(v) / 600) }} />; })}</View>)}
        </View>
        <Text style={[type.caption, { marginTop: 6 }]}>{s.greenDays} green · {s.redDays} red · {s.cleanDays} clean of {s.tradingDays} trading days</Text>

        <View style={{ marginTop: 16 }}><Segmented<'stats' | 'trades'> value={view} onChange={setView} options={[{ value: 'stats', label: 'Stats' }, { value: 'trades', label: 'Trades' }]} /></View>

        {gated ? <Notice tone="accent" title="Pro sees further back" body="Free shows the last 7 days of analytics. Pro opens 30, 90 and all-time, plus breakdowns by setup, emotion and hour." action="See Pro" onAction={() => navigation.navigate('Paywall', { reason: 'Analytics beyond 7 days are Pro.' })} /> : view === 'stats' ? (<>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <Stat label="Win rate" value={`${(s.winRate * 100).toFixed(0)}%`} sub={`${s.wins}W ${s.losses}L`} />
            <Stat label="Expectancy" value={money(s.expectancy)} color={s.expectancy >= 0 ? colors.green : colors.red} sub="per trade" />
            <Stat label="Profit factor" value={s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Stat label="Avg win" value={money(s.avgWin)} color={colors.green} />
            <Stat label="Avg loss" value={money(-s.avgLoss)} color={colors.red} />
            <Stat label="Max drawdown" value={money(-s.maxDrawdown)} color={colors.red} />
          </View>
          <View style={styles.tilt}>
            <Text style={type.label}>The tilt tax</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}><Text style={type.bodySoft}>Actual net</Text><Pnl value={s.net} /></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}><Text style={type.bodySoft}>Rule-following net</Text><Pnl value={s.disciplinedNet} /></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}><Text style={[type.body, { fontWeight: '700' }]}>Paid to tilt</Text><Pnl value={s.tiltTax} /></View>
            <Text style={[type.caption, { marginTop: 8 }]}>Every trade tagged FOMO, revenge, tilted, bored, anxious or euphoric, or with a broken rule, summed. {s.ruleBreaks} rule breaks in this range.</Text>
          </View>
          <Breakdown title="By setup" rows={groupBy(filtered, (t) => (t.setup || 'no setup') as string)} />
          <Breakdown title="By feeling" rows={groupBy(filtered, (t) => (t.emotion || 'untagged') as string)} />
          <Breakdown title="By hour" rows={groupBy(filtered, (t) => `${new Date(t.opened_at).getHours()}:00` as string)} />
          <Breakdown title="By weekday" rows={groupBy(filtered, (t) => new Date(t.opened_at).toLocaleDateString(undefined, { weekday: 'short' }) as string)} />
        </>) : (
          <View style={{ marginTop: 10 }}>
            {filtered.length === 0 ? <Notice title="Nothing here yet" body="Log a trade from Today. Winners and losers both count." /> : null}
            {filtered.map((t: Trade) => (
              <Pressable key={t.id} onPress={() => navigation.navigate('Trade', { id: t.id })} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontWeight: '700' }]}>{t.symbol} <Text style={type.caption}>{t.side} · {t.setup || 'no setup'} · {new Date(t.opened_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text></Text>
                  {t.emotion || t.rules_broken.length ? <View style={{ marginTop: 6 }}><Facts tone={t.rules_broken.length ? 'red' : 'muted'} items={[t.emotion, ...t.rules_broken]} /></View> : null}
                </View>
                <Pnl value={t.pnl - (t.fees || 0)} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
function Breakdown({ title, rows }: { title: string; rows: { key: string; n: number; net: number; winRate: number }[] }) {
  if (!rows.length) return null;
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={type.label}>{title}</Text>
      {rows.slice(0, 8).map((r) => <View key={r.key} style={styles.brow}><Text style={[type.body, { flex: 1 }]}>{r.key}</Text><Text style={[type.caption, { width: 70 }]}>{r.n} · {(r.winRate * 100).toFixed(0)}%</Text><Pnl value={r.net} size={14} /></View>)}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.line, marginTop: 8 },
  brow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  tilt: { marginTop: 16, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.red },
});
