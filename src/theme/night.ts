// Braam Night+ design tokens. Every screen pulls colour and type from
// here so the look stays consistent (and can be tweaked in one place).

export const night = {
  // Ink (dark surfaces) — darkest to lightest
  inkDeep: '#0E0D0B',
  scanner: '#1A1815',
  ink: '#15130F',
  ink3: '#1F1C17',
  ink2: '#2A2722',
  darkLine: '#3A362F',
  inkMuted: '#B9B2A4',
  navInactive: '#A8A193',

  // Paper (light surfaces)
  paper: '#F3F0E8',
  sand: '#E8E3D7',
  card: '#FFFFFF',
  line: '#E6E0D3',
  border: '#DDD7C9',
  divider: '#EFEAE0',
  handle: '#CFC8B8',
  muted: '#5E594F',
  body: '#3A362F',
  faint: '#8F887A',

  // Sub-brand accents (+ a slightly deeper shade for the big "&" watermarks)
  orange: '#FF4F1A',
  orangeDeep: '#E84313',
  blue: '#8FA8FF',
  blueDeep: '#7C96F2',
  lime: '#C8F03C',
  limeDeep: '#B3DB2A',
  yellow: '#FFC23D',
  yellowDeep: '#F0AE1F',

  // Status
  danger: '#C8321C',
  dangerDark: '#3A1A12',
  pink: '#FFD9CF',
  pinkText: '#9A2B0B',
  cream: '#FFF6D6',
  successBg: '#D6F5C8',
  success: '#1E5B0F',
  amberBg: '#FFE7A8',
  amber: '#E8A34A',
  warnDark: '#3A2E10',
  refundBg: '#DCE4FF',
};

// Font family names as registered in app/_layout.tsx.
export const fonts = {
  display: 'BebasNeue',
  regular: 'InstrumentSans',
  medium: 'InstrumentSans-Medium',
  semibold: 'InstrumentSans-SemiBold',
  bold: 'InstrumentSans-Bold',
  mono: 'JetBrainsMono-Medium',
  monoBold: 'JetBrainsMono-Bold',
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };
