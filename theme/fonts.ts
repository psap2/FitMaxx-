export const fonts = {
  regular: 'Exo2_400Regular',
  bold: 'Exo2_700Bold',
};

export type FontWeight = keyof typeof fonts;

export const getFontFamily = (weight: FontWeight = 'regular') => fonts[weight];

