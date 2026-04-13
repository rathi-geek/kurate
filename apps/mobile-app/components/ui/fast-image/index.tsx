import React from 'react';
import FastImage, { type FastImageProps } from 'react-native-fast-image';
import { cssInterop } from 'nativewind';

// NativeWind adapter so FastImage accepts `className` (maps to `style`).
cssInterop(FastImage, { className: 'style' });

type IFastImageProps = FastImageProps & { className?: string };

const Image = React.forwardRef<
  React.ComponentRef<typeof FastImage>,
  IFastImageProps
>(function Image(props, ref) {
  return <FastImage ref={ref} {...props} />;
});
Image.displayName = 'Image';

export { Image };
export { FastImage };
export const resizeMode = FastImage.resizeMode;
export const priority = FastImage.priority;
export const cacheControl = FastImage.cacheControl;
