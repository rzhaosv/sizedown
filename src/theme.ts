import { Platform, TextStyle } from 'react-native';

/** Terminal dark: near-black ground, bone text, red/green only where money is. */
export const colors = {
  bg: '#0B0D10',
  surface: '#141820',
  surface2: '#1C222B',
  ink: '#ECEFF3',
  text: '#ECEFF3',
  soft: '#AEB6C2',
  muted: '#6F7A88',
  accent: '#E8B84A',
  accentSoft: 'rgba(232,184,74,0.14)',
  green: '#2ECC71',
  greenSoft: 'rgba(46,204,113,0.14)',
  red: '#E84A4A',
  redSoft: 'rgba(232,74,74,0.14)',
  line: 'rgba(236,239,243,0.08)',
  lineStrong: 'rgba(236,239,243,0.18)',
  onAccent: '#0B0D10',
  danger: '#E84A4A',
  ok: '#2ECC71',
  okSoft: 'rgba(46,204,113,0.14)',
  overlay: 'rgba(0,0,0,0.6)',
  // kept for shared components
  coral: '#E84A4A',
  coralSoft: 'rgba(232,74,74,0.14)',
  lilac: '#E8B84A',
  plum: '#141820',
  plumDeep: '#0B0D10',
  onPlum: '#ECEFF3',
  onPlumMuted: '#6F7A88',
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };
export const space = (n: number) => n * 4;
export const mono = Platform.select({ ios: 'Menlo', web: 'ui-monospace, Menlo, Consolas, monospace', default: 'monospace' }) as string;
export const serif = mono;
const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const type: Record<string, TextStyle> = {
  display: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  h1: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  h2: { fontSize: 19, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, fontWeight: '400', color: colors.ink, lineHeight: 22 },
  bodySoft: { fontSize: 14, fontWeight: '400', color: colors.soft, lineHeight: 21 },
  quote: { fontSize: 17, fontWeight: '500', color: colors.ink, lineHeight: 25 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.accent, letterSpacing: 1.6, textTransform: 'uppercase' },
  label: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1.4, textTransform: 'uppercase' },
  sub: { fontSize: 13, fontWeight: '500', color: colors.soft },
  caption: { fontSize: 12, fontWeight: '500', color: colors.muted },
  num: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, fontFamily: mono, ...tabular },
  numSm: { fontSize: 16, fontWeight: '700', color: colors.ink, fontFamily: mono, ...tabular },
};
