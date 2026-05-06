import { MD3DarkTheme } from 'react-native-paper'

export const colors = {
  background:      '#1A1A2E',
  surface:         '#16213E',
  surfaceVariant:  '#0F3460',
  gold:            '#C9A84C',
  goldLight:       '#E8C97A',
  green:           '#2D5016',
  text:            '#FFFFFF',
  textMuted:       '#9E9E9E',
  error:           '#CF6679',
  border:          '#2A2A4A',
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
