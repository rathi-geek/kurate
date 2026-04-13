import React from 'react';
import FastImage, { type FastImageProps } from 'react-native-fast-image';
import { cssInterop } from 'nativewind';

// NativeWind adapter so FastImage accepts `className` (maps to `style`).
cssInterop(FastImage, { className: 'style' });

type IFastImageProps = FastImageProps & { className?: string };

// FastImage is a class component whose types don't surface a ref prop in
// its JSX intrinsics — skip forwardRef, nothing in this codebase needs the ref.
const Image = (props: IFastImageProps) => <FastImage {...props} />;
Image.displayName = 'Image';

export { Image };
export { FastImage };
export const resizeMode = FastImage.resizeMode;
export const priority = FastImage.priority;
export const cacheControl = FastImage.cacheControl;
