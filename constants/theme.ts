import { MD3DarkTheme } from 'react-native-paper'

export const colors = {
  background:      '#1B4439',
  surface:         '#245A4A',
  surfaceVariant:  '#2E6B57',
  gold:            '#C9A84C',
  goldLight:       '#E8C97A',
  green:           '#2D5016',
  text:            '#FFFFFF',
  textMuted:       '#A2B2AA',
  error:           '#CF6679',
  border:          '#3A745F',
}

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary:          colors.gold,
    background:       colors.background,
    surface:          colors.surface,
    onSurface:        colors.text,
    surfaceVariant:   colors.surfaceVariant,
    onSurfaceVariant: colors.textMuted,
  },
}
