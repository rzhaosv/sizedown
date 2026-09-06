import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, type } from '../theme';
import { PrimaryButton, GhostButton, ProgressDots, Eyebrow, Chip } from '../components/UI';
import { Field } from '../components/Form';
import { useApp } from '../store/AppContext';
import { MARKETS, Market } from '../logic/types';

const STEPS = 4;
export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [markets, setMarkets] = useState<Market[]>(['futures']);
  const [account, setAccount] = useState('');
  const [dailyLoss, setDailyLoss] = useState('');
  const [maxTrades, setMaxTrades] = useState('4');
  const [stopAfter, setStopAfter] = useState('2');
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true);
    try {
      await updateProfile({ display_name: name.trim() || 'Trader', markets, account_size: Number(account) || null, daily_loss_limit: Number(dailyLoss) || null, max_trades_per_day: Number(maxTrades) || null, stop_after_losses: Number(stopAfter) || null, cooloff_minutes: 15, currency: 'USD', onboarded: true });
      onDone();
    } catch (e: any) { Alert.alert('Could not save', e?.message ?? 'Try again.'); } finally { setBusy(false); }
  };
  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ paddingTop: 12 }}><ProgressDots count={STEPS} index={step} /></View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 0 && (<>
            <View style={{ alignItems: 'center', marginTop: 24 }}><Image source={require('../../assets/icon.png')} style={{ width: 112, height: 112, borderRadius: 28 }} /></View>
            <Eyebrow style={{ textAlign: 'center', marginTop: 22 }}>Size Down</Eyebrow>
            <Text style={[type.display, { textAlign: 'center', marginTop: 8 }]}>The journal that tells you{'\n'}what you already know.</Text>
            <Text style={[type.bodySoft, { textAlign: 'center', marginTop: 14, fontSize: 15 }]}>Log every trade in ten seconds. Tag how you felt. Set your rules once. Then watch the one number nobody else shows you: what you would have made if you had followed them.</Text>
            <View style={styles.promise}>
              <Line t="No broker login. No sync bugs. Your trades, typed in, honest." />
              <Line t="Prop-firm eval tracker with the real drawdown math." />
              <Line t="Rule-following P&L vs actual P&L. The tilt tax, in dollars." />
              <Line t="Free for 30 trades a month. Pro is $9.99 or $79 once." />
            </View>
          </>)}
          {step === 1 && (<>
            <Text style={type.h1}>What do you trade?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {MARKETS.map((m) => <Chip key={m.value} text={m.label} selected={markets.includes(m.value)} onPress={() => setMarkets(markets.includes(m.value) ? markets.filter((x) => x !== m.value) : [...markets, m.value])} />)}
            </View>
            <Field label="Call sign (optional)" value={name} onChange={setName} placeholder="What the app should call you" maxLength={40} />
            <Field label="Account size" value={account} onChange={setAccount} placeholder="25000" keyboardType="number-pad" hint="Used for percentages. Your eval accounts are set separately." />
          </>)}
          {step === 2 && (<>
            <Text style={type.h1}>Your rules. Say them once.</Text>
            <Text style={[type.bodySoft, { marginTop: 8 }]}>These are yours, not ours. The app never blocks a trade. It just shows you the rule you wrote, at the moment you are about to break it.</Text>
            <Field label="Daily loss limit ($)" value={dailyLoss} onChange={setDailyLoss} placeholder="500" keyboardType="number-pad" />
            <Field label="Max trades per day" value={maxTrades} onChange={setMaxTrades} keyboardType="number-pad" />
            <Field label="Stop after how many losses in a row" value={stopAfter} onChange={setStopAfter} keyboardType="number-pad" hint="Two is the number most funded traders use. After two, it is not trading anymore." />
          </>)}
          {step === 3 && (<>
            <Text style={type.h1}>One honest thing before you start.</Text>
            <Text style={[type.quote, { marginTop: 16 }]}>The number you need is always one million more than what you have. Every trader in this app knows that feeling. The journal cannot fix it. What it can do is show you, in your own numbers, that the money you are chasing is mostly money you are giving away on the days you should have closed the laptop.</Text>
            <Text style={[type.bodySoft, { marginTop: 16 }]}>Log the ugly trades too. Especially those. The tilt tax only works if it sees everything.</Text>
          </>)}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton title={step === STEPS - 1 ? 'Start logging' : step === 0 ? 'Set up in 60 seconds' : 'Next'} onPress={next} loading={busy} />
          {step > 0 ? <GhostButton title="Back" onPress={() => setStep(step - 1)} /> : <Text style={[type.caption, { textAlign: 'center', marginTop: 10 }]}>Not financial advice. A journal for your own decisions.</Text>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function Line({ t }: { t: string }) { return <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 7 }} /><Text style={[type.body, { flex: 1 }]}>{t}</Text></View>; }
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, body: { paddingHorizontal: 22, paddingBottom: 24 }, footer: { paddingHorizontal: 22, paddingBottom: 8, paddingTop: 8 },
  promise: { marginTop: 26, backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.line },
});
