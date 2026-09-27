// Mirrors web/tailwind.config.js — keep these two files in sync when the brand palette changes.
export const colors = {
  teal: '#0F6E6A',
  tealDark: '#0C5A57',
  sky: '#2C8FEA',
  sunrise: '#FF6B35',
  coral: '#FF9466',
  offwhite: '#F7FAFA',
  slate: '#445866',
  charcoal: '#1E2A32',
  success: '#2ECC71',
  warning: '#F5B914',
  error: '#E63946',
  white: '#FFFFFF',
};

export const gradients = {
  phoenix: [colors.teal, colors.sky, colors.sunrise],
};

export const fonts = {
  heading: 'Poppins_600SemiBold',
  headingBold: 'Poppins_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
};

export const radii = {
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const shadow = {
  soft: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};
