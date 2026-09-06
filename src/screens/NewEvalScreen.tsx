import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Header, PrimaryButton, Chip, Segmented } from '../components/UI';
import { Field } from '../components/Form';
import { type } from '../theme';
import { useApp } from '../store/AppContext';
import { addEval } from '../logic/api';
import { FIRM_PRESETS, FirmPreset, DrawdownType, money } from '../logic/types';
import { ScreenProps } from '../navigation';

export default function NewEvalScreen({ navigation }: ScreenProps<'NewEval'>) {
  const { uid, refresh } = useApp();
  const [preset, setPreset] = useState<FirmPreset>(FIRM_PRESETS[0]);
  const [size, setSize] = useState<number>(FIRM_PRESETS[0].sizes[1]);
  const [name, setName] = useState('');
  const [target, setTarget] = useState(String(FIRM_PRESETS[0].target));
  const [daily, setDaily] = useState(FIRM_PRESETS[0].dailyLoss == null ? '' : String(FIRM_PRESETS[0].dailyLoss));
  const [dd, setDd] = useState(String(FIRM_PRESETS[0].drawdown));
  const [ddType, setDdType] = useState<DrawdownType>(FIRM_PRESETS[0].ddType);
  const [cons, setCons] = useState(FIRM_PRESETS[0].consistency == null ? '' : String(FIRM_PRESETS[0].consistency));
  const [minDays, setMinDays] = useState(String(FIRM_PRESETS[0].minDays));
  const [cost, setCost] = useState('');
  const [busy, setBusy] = useState(false);
  const pick = (f: FirmPreset) => { setPreset(f); setSize(f.sizes[Math.min(1, f.sizes.length - 1)]); setTarget(String(f.target)); setDaily(f.dailyLoss == null ? '' : String(f.dailyLoss)); setDd(String(f.drawdown)); setDdType(f.ddType); setCons(f.consistency == null ? '' : String(f.consistency)); setMinDays(String(f.minDays)); };
  const pctOf = (s: string) => Math.round((Number(s) / 100) * size);
  const save = async () => {
    if (!uid) return;
    setBusy(true);
    try {
      await addEval(uid, { firm: preset.firm, name: name.trim() || `${preset.label} ${money(size)}`, account_size: size, profit_target: pctOf(target), max_daily_loss: daily ? pctOf(daily) : null, max_drawdown: pctOf(dd), drawdown_type: ddType, consistency_pct: cons ? Number(cons) : null, min_days: Number(minDays) || 0, cost: Number(cost) || null, started_at: new Date().toISOString().slice(0, 10), status: 'active' });
      await refresh(); navigation.goBack();
    } catch (e: any) { Alert.alert('Could not add', e?.message ?? 'Try again.'); } finally { setBusy(false); }
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="New eval" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={type.label}>Firm</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{FIRM_PRESETS.map((f) => <Chip key={f.firm} small text={f.label} selected={preset.firm === f.firm} onPress={() => pick(f)} />)}</View>
          <Text style={[type.caption, { marginTop: 8 }]}>{preset.note} Rules change often; check the firm’s page and edit anything below.</Text>
          <Text style={[type.label, { marginTop: 16 }]}>Account size</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{preset.sizes.map((s) => <Chip key={s} small text={money(s)} selected={size === s} onPress={() => setSize(s)} />)}</View>
          <Field label="Name (optional)" value={name} onChange={setName} placeholder={`${preset.label} ${money(size)}`} maxLength={60} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Profit target %" value={target} onChange={setTarget} keyboardType="default" hint={`= ${money(pctOf(target))}`} /></View>
            <View style={{ flex: 1 }}><Field label="Max drawdown %" value={dd} onChange={setDd} keyboardType="default" hint={`= ${money(pctOf(dd))}`} /></View>
          </View>
          <Text style={[type.label, { marginTop: 14 }]}>Drawdown type</Text>
          <Segmented<DrawdownType> value={ddType} onChange={setDdType} options={[{ value: 'static', label: 'Static' }, { value: 'eod_trailing', label: 'EOD trailing' }, { value: 'intraday_trailing', label: 'Intraday' }]} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Daily loss % (blank if none)" value={daily} onChange={setDaily} keyboardType="default" hint={daily ? `= ${money(pctOf(daily))}` : 'no daily limit'} /></View>
            <View style={{ flex: 1 }}><Field label="Consistency % (blank if none)" value={cons} onChange={setCons} keyboardType="default" hint="best day ≤ this % of profit" /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Minimum trading days" value={minDays} onChange={setMinDays} keyboardType="default" /></View>
            <View style={{ flex: 1 }}><Field label="What you paid ($)" value={cost} onChange={setCost} placeholder="167" keyboardType="default" /></View>
          </View>
          <PrimaryButton title="Start tracking" onPress={save} loading={busy} style={{ marginTop: 22 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
