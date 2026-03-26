import { sizeConfig } from '@/constants/sizeConfig';
import { PixelRatio, useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= sizeConfig.tabletBreakpoint;

  const scale = (size: number) => {
    if (isTablet) {
      return size * sizeConfig.tabletScale;
    }
    return size;
  };

  const fontSize = (size: number) => {
    if (isTablet) {
      return size * sizeConfig.tabletFontScale;
    }
    return size;
  };

  const spacing = (space: number) => {
    if (isTablet) {
      return space * sizeConfig.tabletSpacingScale;
    }
    return space;
  };

  const widthPercentageToDP = (elementWidthPercentage: number) => {
    const elemWidth = (width * elementWidthPercentage) / 100;
    return PixelRatio.roundToNearestPixel(elemWidth);
  };

  const heightPercentageToDP = (elementHeightPercentage: number) => {
    const elemHeight = (height * elementHeightPercentage) / 100;
    return PixelRatio.roundToNearestPixel(elemHeight);
  };

  return {
    width,
    height,
    isTablet,
    scale,
    fontSize,
    spacing,
    widthPercentageToDP,
    heightPercentageToDP,
  };
}
