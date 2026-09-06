import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, type } from '../theme';
import { money } from '../logic/types';

/** P&L number coloured by sign. */
export function Pnl({ value, size = 16, currency = 'USD', style }: { value: number; size?: number; currency?: string; style?: any }) {
  const c = value > 0 ? colors.green : value < 0 ? colors.red : colors.soft;
  return <Text style={[type.numSm, { fontSize: size, color: c }, style]}>{value > 0 ? '+' : ''}{money(value, currency)}</Text>;
}

export function Facts({ items, tone = 'muted' }: { items: string[]; tone?: 'accent' | 'red' | 'green' | 'muted' }) {
  const bg = tone === 'red' ? colors.redSoft : tone === 'green' ? colors.greenSoft : tone === 'accent' ? colors.accentSoft : colors.surface2;
  const fg = tone === 'red' ? colors.red : tone === 'green' ? colors.green : tone === 'accent' ? colors.accent : colors.soft;
  return (
    <View style={styles.facts}>
      {items.filter(Boolean).map((t) => <View key={t} style={[styles.fact, { backgroundColor: bg }]}><Text style={[styles.factText, { color: fg }]}>{t}</Text></View>)}
    </View>
  );
}

export function Notice({ title, body, action, onAction, tone = 'muted' }: { title: string; body: string; action?: string; onAction?: () => void; tone?: 'muted' | 'red' | 'accent' }) {
  const border = tone === 'red' ? colors.red : tone === 'accent' ? colors.accent : colors.line;
  return (
    <View style={[styles.notice, { borderColor: border }]}>
      <Text style={type.h3}>{title}</Text>
      <Text style={[type.bodySoft, { marginTop: 6 }]}>{body}</Text>
      {action && onAction ? <Pressable onPress={onAction} style={{ marginTop: 12 }}><Text style={{ color: colors.accent, fontWeight: '700' }}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function Bar({ value, color = colors.accent, track = colors.surface2, height = 8 }: { value: number; color?: string; track?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

export function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={type.label}>{label}</Text>
      <Text style={[type.numSm, { fontSize: 20, marginTop: 4, color: color ?? colors.ink }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {sub ? <Text style={[type.caption, { marginTop: 2 }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fact: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  factText: { fontSize: 12, fontWeight: '700' },
  notice: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, marginTop: 12 },
  stat: { flex: 1, minWidth: 100, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.line },
});
