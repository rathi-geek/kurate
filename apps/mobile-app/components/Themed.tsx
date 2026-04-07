import { Text as DefaultText, View as DefaultView } from 'react-native';
import { cssInterop } from 'nativewind';
import { lightTheme, darkTheme } from '@kurate/theme';
import { useColorScheme } from './useColorScheme';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: 'foreground' | 'background',
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  const tokens = theme === 'dark' ? darkTheme : lightTheme;
  return colorName === 'foreground'
    ? tokens.brandForeground
    : tokens.brandBackground;
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor(
    { light: lightColor, dark: darkColor },
    'foreground',
  );

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background',
  );

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
