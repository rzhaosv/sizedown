import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Header, PrimaryButton, Chip, Segmented } from '../components/UI';
import { Field, ChipPicker } from '../components/Form';
import { Notice } from '../components/Bits';
import { colors, type } from '../theme';
import { useApp } from '../store/AppContext';
import { addTrade, countTradesThisMonth, todayStart } from '../logic/api';
import { ruleWarnings } from '../logic/stats';
import { EMOTIONS, SETUPS, RULES, MARKETS, Market, Side, Emotion, dayKey } from '../logic/types';
import { FREE_TRADES_PER_MONTH } from '../config';
import { ScreenProps } from '../navigation';

export default function LogTradeScreen({ navigation, route }: ScreenProps<'LogTrade'>) {
  const { uid, profile, trades, evals, isPro, refresh } = useApp();
  const p = profile!;
  const [symbol, setSymbol] = useState('');
  const [market, setMarket] = useState<Market>(p.markets[0] ?? 'stocks');
  const [side, setSide] = useState<Side>('long');
  const [pnl, setPnl] = useState('');
  const [fees, setFees] = useState('');
  const [size, setSize] = useState('');
  const [setup, setSetup] = useState<string[]>([]);
  const [emotion, setEmotion] = useState<Emotion>('');
  const [followed, setFollowed] = useState<'yes' | 'no'>('yes');
  const [rules, setRules] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [evalId, setEvalId] = useState<string | null>(route.params?.evalId ?? (evals.find((e) => e.status === 'active')?.id ?? null));
  const [busy, setBusy] = useState(false);

  const today = useMemo(() => trades.filter((t) => t.opened_at >= todayStart()), [trades]);
  const warnings = useMemo(() => ruleWarnings(today, p), [today, p]);

  const save = async () => {
    const n = Number(pnl.replace(/[^0-9.-]/g, ''));
    if (!symbol.trim()) return Alert.alert('Symbol', 'What did you trade?');
    if (Number.isNaN(n)) return Alert.alert('P&L', 'Enter the result as a number. Negative for a loss.');
    if (!uid) return;
    setBusy(true);
    try {
      if (!isPro && (await countTradesThisMonth(uid)) >= FREE_TRADES_PER_MONTH) { setBusy(false); return navigation.navigate('Paywall', { reason: `Free covers ${FREE_TRADES_PER_MONTH} trades a month. You are past it, which is either a great month or a problem. Either way, Pro is unlimited.` }); }
      await addTrade(uid, { eval_id: evalId, symbol: symbol.trim().toUpperCase(), market, side, size: Number(size) || null, entry: null, exit: null, pnl: n, fees: Number(fees) || 0, opened_at: new Date().toISOString(), closed_at: new Date().toISOString(), setup: setup[0] ?? '', emotion, followed_plan: followed === 'yes', rules_broken: rules, notes: notes.trim() });
      await refresh();
      navigation.goBack();
    } catch (e: any) { Alert.alert('Could not save', e?.message ?? 'Try again.'); } finally { setBusy(false); }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Log a trade" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          {warnings.map((w) => <Notice key={w} tone="red" title="Your rule, not ours" body={w} />)}
          <Text style={[type.caption, { marginTop: 10 }]}>Today: {today.length} trade{today.length === 1 ? '' : 's'} · {dayKey(new Date())}</Text>
          <Field label="Symbol" value={symbol} onChange={setSymbol} placeholder="MNQ, SPY 0DTE, BTC" autoCapitalize="none" maxLength={20} />
          <Text style={[type.label, { marginTop: 14 }]}>Market</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{MARKETS.map((m) => <Chip key={m.value} small text={m.label} selected={market === m.value} onPress={() => setMarket(m.value)} />)}</View>
          <Text style={[type.label, { marginTop: 14 }]}>Side</Text>
          <Segmented<Side> value={side} onChange={setSide} options={[{ value: 'long', label: 'Long' }, { value: 'short', label: 'Short' }]} />
          <Field label="Result ($, negative for a loss)" value={pnl} onChange={setPnl} placeholder="-140" keyboardType="default" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Fees" value={fees} onChange={setFees} placeholder="4.50" keyboardType="default" /></View>
            <View style={{ flex: 1 }}><Field label="Size" value={size} onChange={setSize} placeholder="2" keyboardType="default" /></View>
          </View>
          <ChipPicker label="Setup" options={SETUPS} value={setup} onChange={(v) => setSetup(v.slice(-1))} allowCustom customPlaceholder="Your setup name" />
          <Text style={[type.label, { marginTop: 16 }]}>How you felt going in</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{EMOTIONS.map((e) => <Chip key={e.value} small text={e.label} selected={emotion === e.value} onPress={() => setEmotion(emotion === e.value ? '' : e.value)} />)}</View>
          <Text style={[type.label, { marginTop: 16 }]}>Did you follow your plan?</Text>
          <Segmented<'yes' | 'no'> value={followed} onChange={setFollowed} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} activeColor={followed === 'no' ? colors.red : colors.green} />
          {followed === 'no' ? <ChipPicker label="Which rule did you break?" options={RULES} value={rules} onChange={setRules} allowCustom customPlaceholder="Something else" /> : null}
          {evals.filter((e) => e.status === 'active').length ? (<>
            <Text style={[type.label, { marginTop: 16 }]}>Count toward eval</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <Chip small text="None" selected={!evalId} onPress={() => setEvalId(null)} />
              {evals.filter((e) => e.status === 'active').map((e) => <Chip key={e.id} small text={e.name || e.firm} selected={evalId === e.id} onPress={() => setEvalId(e.id)} />)}
            </View>
          </>) : null}
          <Field label="Note (optional)" value={notes} onChange={setNotes} placeholder="What you saw. What you told yourself." multiline maxLength={2000} />
          <PrimaryButton title="Save trade" onPress={save} loading={busy} style={{ marginTop: 22 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
