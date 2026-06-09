export const fontSize = {
  xs:   12,
  sm:   14,
  base: 16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeight = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  extrabold:'800',
  black:    '900',
} as const;

export const lineHeight = {
  tight:   1.2,
  normal:  1.4,
  relaxed: 1.65,
} as const;

export const textVariants = {
  h1:      { fontSize: fontSize['4xl'], fontWeight: fontWeight.black,    lineHeight: Math.round(fontSize['4xl'] * lineHeight.tight) },
  h2:      { fontSize: fontSize['3xl'], fontWeight: fontWeight.black,    lineHeight: Math.round(fontSize['3xl'] * lineHeight.tight) },
  h3:      { fontSize: fontSize['2xl'], fontWeight: fontWeight.extrabold,lineHeight: Math.round(fontSize['2xl'] * lineHeight.tight) },
  title:   { fontSize: fontSize.xl,    fontWeight: fontWeight.bold,      lineHeight: Math.round(fontSize.xl    * lineHeight.normal) },
  body:    { fontSize: fontSize.base,  fontWeight: fontWeight.regular,   lineHeight: Math.round(fontSize.base  * lineHeight.relaxed) },
  bodyBold:{ fontSize: fontSize.base,  fontWeight: fontWeight.semibold,  lineHeight: Math.round(fontSize.base  * lineHeight.relaxed) },
  label:   { fontSize: fontSize.sm,    fontWeight: fontWeight.semibold,  lineHeight: Math.round(fontSize.sm    * lineHeight.normal) },
  caption: { fontSize: fontSize.xs,    fontWeight: fontWeight.regular,   lineHeight: Math.round(fontSize.xs    * lineHeight.normal) },
} as const;

export type TextVariant = keyof typeof textVariants;
