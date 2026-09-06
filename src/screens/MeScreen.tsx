import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Alert, ScrollView, Platform, Share } from 'react-native';
import { Screen, Eyebrow, Card, ProBadge } from '../components/UI';
import { Stat } from '../components/Bits';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { deleteAccount, tradesToCsv } from '../logic/api';
import { computeStats } from '../logic/stats';
import { money } from '../logic/types';
import { SITE } from '../config';
import { TabProps } from '../navigation';

function Row({ label, value, onPress, danger, pro }: { label: string; value?: string; onPress: () => void; danger?: boolean; pro?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}><Text style={[type.body, { fontWeight: '600' }, danger && { color: colors.danger }]}>{label}</Text>{pro ? <ProBadge /> : null}</View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{value ? <Text style={type.sub}>{value}</Text> : null}<Text style={{ color: colors.muted, fontSize: 18 }}>›</Text></View>
    </Pressable>
  );
}
export default function MeScreen({ navigation }: TabProps<'Me'>) {
  const { profile, trades, isPro, entitlement, retry } = useApp();
  const s = computeStats(trades);
  const exportCsv = async () => {
    if (!isPro) return navigation.navigate('Paywall', { reason: 'CSV export is Pro. Your data is yours; Pro is how you take it with you.' });
    const csv = tradesToCsv(trades);
    if (Platform.OS === 'web' && typeof document !== 'undefined') { const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'sizedown-trades.csv'; a.click(); }
    else await Share.share({ message: csv, title: 'sizedown-trades.csv' });
  };
  const onDelete = () => Alert.alert('Delete everything?', 'Trades, rules, evals, journal. No undo.', [{ text: 'Keep', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteAccount(); retry(); } catch (e: any) { Alert.alert('Could not delete', e?.message ?? 'Try again.'); } } }]);
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Eyebrow style={{ marginTop: 8 }}>Me</Eyebrow>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={type.h1}>{profile?.display_name || 'Trader'}</Text>{isPro ? <ProBadge /> : null}</View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <Stat label="Trades logged" value={String(s.n)} />
          <Stat label="All-time net" value={money(s.net)} color={s.net >= 0 ? colors.green : colors.red} />
          <Stat label="All-time tilt tax" value={money(s.tiltTax)} color={s.tiltTax < 0 ? colors.red : colors.soft} />
        </View>
        <Text style={[type.label, { marginTop: 22, marginBottom: 6 }]}>Pro</Text>
        <Card style={{ padding: 0 }}>
          {!isPro ? <Row label="Get Size Down Pro" value="$9.99 or $79 once" onPress={() => navigation.navigate('Paywall')} /> : <Row label={entitlement?.plan === 'lifetime' ? 'Lifetime Pro' : 'Pro, monthly'} value={entitlement?.current_period_end ? `renews ${new Date(entitlement.current_period_end).toLocaleDateString()}` : 'active'} onPress={() => Linking.openURL('mailto:tryformaapp@gmail.com?subject=Size%20Down%20billing')} />}
          <Row label="Restore purchase" onPress={() => navigation.navigate('Paywall')} />
          <Row label="Export trades (CSV)" onPress={exportCsv} pro />
        </Card>
        <Text style={[type.label, { marginTop: 22, marginBottom: 6 }]}>About</Text>
        <Card style={{ padding: 0 }}>
          <Row label="Rules and evals guide" onPress={() => Linking.openURL(`${SITE}/#how`)} />
          <Row label="Privacy policy" onPress={() => Linking.openURL(`${SITE}/privacy.html`)} />
          <Row label="Terms of use" onPress={() => Linking.openURL(`${SITE}/terms.html`)} />
          <Row label="Support" onPress={() => Linking.openURL('mailto:tryformaapp@gmail.com?subject=Size%20Down')} />
        </Card>
        <Text style={[type.label, { marginTop: 22, marginBottom: 6 }]}>Account</Text>
        <Card style={{ padding: 0 }}><Row label="Delete my account and data" onPress={onDelete} danger /></Card>
        <Text style={[type.caption, { marginTop: 14, lineHeight: 18 }]}>Your account lives on this device, no email needed. Pro is tied to it; keep your Stripe receipt to restore on a new device. Size Down is a journal for your own decisions, not financial advice.</Text>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, marginBottom: -1 } });
