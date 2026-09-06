import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Screen, Header, GhostButton, Card } from '../components/UI';
import { Pnl, Facts } from '../components/Bits';
import { colors, type } from '../theme';
import { useApp } from '../store/AppContext';
import { deleteTrade } from '../logic/api';
import { money } from '../logic/types';
import { ScreenProps } from '../navigation';

export default function TradeScreen({ navigation, route }: ScreenProps<'Trade'>) {
  const { trades, evals, refresh } = useApp();
  const t = trades.find((x) => x.id === route.params.id);
  if (!t) return <Screen edges={['top', 'bottom']}><Header title="Trade" onBack={() => navigation.goBack()} /></Screen>;
  const ev = evals.find((e) => e.id === t.eval_id);
  const del = () => Alert.alert('Delete this trade?', 'It leaves your stats too. Deleting the ugly ones is how the tilt tax lies to you.', [{ text: 'Keep', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTrade(t.id); await refresh(); navigation.goBack(); } }]);
  return (
    <Screen edges={['top', 'bottom']}>
      <Header title={t.symbol} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={type.caption}>{new Date(t.opened_at).toLocaleString()} · {t.market} · {t.side}{t.size ? ` · size ${t.size}` : ''}{ev ? ` · ${ev.name}` : ''}</Text>
        <View style={{ marginTop: 8 }}><Pnl value={t.pnl - (t.fees || 0)} size={34} /></View>
        <Text style={type.caption}>gross {money(t.pnl)} · fees {money(t.fees || 0)}</Text>
        <Card style={{ marginTop: 16 }}>
          <Row k="Setup" v={t.setup || 'no setup'} />
          <Row k="Feeling" v={t.emotion || 'untagged'} />
          <Row k="Followed plan" v={t.followed_plan == null ? '—' : t.followed_plan ? 'Yes' : 'No'} />
          {t.rules_broken.length ? <View style={{ marginTop: 10 }}><Facts tone="red" items={t.rules_broken} /></View> : null}
        </Card>
        {t.notes ? <Card style={{ marginTop: 12 }}><Text style={type.label}>Note</Text><Text style={[type.body, { marginTop: 6 }]}>{t.notes}</Text></Card> : null}
        <GhostButton title="Delete trade" onPress={del} color={colors.danger} />
      </ScrollView>
    </Screen>
  );
}
function Row({ k, v }: { k: string; v: string }) { return <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}><Text style={[type.caption, { width: 110 }]}>{k}</Text><Text style={[type.body, { flex: 1 }]}>{v}</Text></View>; }
