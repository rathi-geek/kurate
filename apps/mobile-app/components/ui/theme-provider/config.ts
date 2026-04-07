import { vars } from 'nativewind';
import { lightTheme, darkTheme, toNativeWindVars } from '@kurate/theme';

export const config = {
  light: vars(toNativeWindVars(lightTheme)),
  dark: vars(toNativeWindVars(darkTheme)),
};
