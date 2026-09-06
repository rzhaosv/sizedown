import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Linking, ScrollView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, type } from '../theme';
import { PrimaryButton } from '../components/UI';
import { useApp } from '../store/AppContext';
import { restoreWithSession } from '../logic/api';
import { STRIPE_LINKS, SITE, PRICES, FREE_TRADES_PER_MONTH } from '../config';
import { ScreenProps } from '../navigation';

const BENEFITS: [string, string][] = [
  ['Unlimited trades', `Free is ${FREE_TRADES_PER_MONTH} a month. Pro never counts.`],
  ['Every eval, every firm', 'Track as many prop-firm accounts as you are paying for. Free tracks one.'],
  ['Tilt tax and discipline reports', 'By setup, emotion, hour, weekday. Rule-following P&L vs actual, every day.'],
  ['CSV export, forever', 'Your data is yours. Lifetime means lifetime.'],
];

export default function PaywallScreen({ navigation, route }: ScreenProps<'Paywall'>) {
  const { uid, setPrefs, refreshEntitlement, isPro } = useApp();
  const [plan, setPlan] = useState<'lifetime' | 'monthly'>('lifetime');
  const [waiting, setWaiting] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const poll = useRef<any>(null);
  useEffect(() => { setPrefs({ seenPaywall: true }); return () => clearInterval(poll.current); }, [setPrefs]);
  useEffect(() => { if (isPro) { clearInterval(poll.current); navigation.canGoBack() ? navigation.goBack() : navigation.replace('Tabs'); } }, [isPro, navigation]);

  const close = () => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Tabs'));
  const buy = async () => {
    if (!uid) return;
    const url = `${STRIPE_LINKS[plan]}?client_reference_id=${encodeURIComponent(uid)}`;
    setWaiting(true);
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.assign(url);
    else { await Linking.openURL(url); poll.current = setInterval(() => refreshEntitlement().then((ok) => ok && clearInterval(poll.current)), 4000); }
  };
  const restore = async () => {
    const sid = sessionId.trim();
    if (!/^cs_/.test(sid) || !uid) return Alert.alert('Session id', 'Paste the id that starts with cs_ from your Stripe receipt link.');
    const ok = await restoreWithSession(sid, uid);
    if (ok && (await refreshEntitlement())) Alert.alert('Restored', 'Pro is back on this device.');
    else Alert.alert('Not found', 'That session did not match a paid purchase. Email tryformaapp@gmail.com with your receipt and we will fix it by hand.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={close} hitSlop={12} style={{ alignSelf: 'flex-end', paddingVertical: 8 }}><Text style={{ color: colors.muted, fontSize: 16, fontWeight: '600' }}>Not now</Text></Pressable>
        <Text style={type.eyebrow}>Size Down Pro</Text>
        <Text style={[type.display, { marginTop: 8 }]}>Cheaper than one revenge trade.</Text>
        {route.params?.reason ? <Text style={[type.bodySoft, { marginTop: 10 }]}>{route.params.reason}</Text> : null}
        <View style={{ marginTop: 22, gap: 14 }}>
          {BENEFITS.map(([t, s]) => <View key={t} style={{ flexDirection: 'row', gap: 12 }}><View style={styles.tick}><Text style={{ color: colors.onAccent, fontWeight: '900', fontSize: 13 }}>✓</Text></View><View style={{ flex: 1 }}><Text style={type.h3}>{t}</Text><Text style={type.bodySoft}>{s}</Text></View></View>)}
        </View>
        <View style={{ marginTop: 26, gap: 10 }}>
          <Plan on={plan === 'lifetime'} onPress={() => setPlan('lifetime')} title="Lifetime" sub="Pay once. Own your journal. No renewals." price={PRICES.lifetime} per="once" best />
          <Plan on={plan === 'monthly'} onPress={() => setPlan('monthly')} title="Monthly" sub="Cancel any time from the Stripe receipt." price={PRICES.monthly} per="per month" />
        </View>
        <PrimaryButton title={waiting ? 'Waiting for Stripe…' : `Continue, ${PRICES[plan]} ${plan === 'lifetime' ? 'once' : 'per month'}`} onPress={buy} loading={waiting && Platform.OS !== 'web'} color={colors.accent} style={{ marginTop: 18 }} />
        <Text style={[type.caption, { textAlign: 'center', marginTop: 12, lineHeight: 18 }]}>Checkout is by Stripe, on the web. Monthly renews automatically until you cancel; lifetime is a single charge. Tied to this install; keep the receipt to restore on a new device.</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14 }}>
          <Pressable onPress={() => setRestoreOpen((v) => !v)}><Text style={styles.link}>Restore purchase</Text></Pressable>
          <Pressable onPress={() => Linking.openURL(`${SITE}/terms.html`)}><Text style={styles.link}>Terms</Text></Pressable>
          <Pressable onPress={() => Linking.openURL(`${SITE}/privacy.html`)}><Text style={styles.link}>Privacy</Text></Pressable>
        </View>
        {restoreOpen ? (
          <View style={{ marginTop: 14 }}>
            <Text style={type.caption}>Paste the checkout session id from your receipt link (starts with cs_).</Text>
            <TextInput value={sessionId} onChangeText={setSessionId} placeholder="cs_live_…" placeholderTextColor={colors.muted} autoCapitalize="none" style={styles.input} />
            <PrimaryButton title="Restore" onPress={restore} style={{ marginTop: 10, height: 48 }} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
function Plan({ on, onPress, title, sub, price, per, best }: { on: boolean; onPress: () => void; title: string; sub: string; price: string; per: string; best?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.plan, on && styles.planOn]}>
      <View style={{ flex: 1 }}><Text style={[type.h3, on && { color: colors.onAccent }]}>{title}{best ? '  · most traders' : ''}</Text><Text style={[type.caption, on && { color: colors.onAccent }]}>{sub}</Text></View>
      <View style={{ alignItems: 'flex-end' }}><Text style={[type.num, { fontSize: 24 }, on && { color: colors.onAccent }]}>{price}</Text><Text style={[type.caption, on && { color: colors.onAccent }]}>{per}</Text></View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  tick: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg, padding: 16, borderWidth: 1.5, borderColor: colors.lineStrong, backgroundColor: colors.surface },
  planOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  link: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.md, paddingHorizontal: 14, height: 48, fontSize: 15, color: colors.ink, marginTop: 8 },
});
