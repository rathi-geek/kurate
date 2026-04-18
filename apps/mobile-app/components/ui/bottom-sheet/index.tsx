import React from 'react';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';

type IBottomSheetProps = Omit<BottomSheetModalProps, 'children'> & {
  children: React.ReactNode;
};

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    pressBehavior="close"
    opacity={0.4}
  />
);

const BottomSheet = React.forwardRef<BottomSheetModal, IBottomSheetProps>(
  function BottomSheet(
    { children, backgroundStyle, handleIndicatorStyle, ...props },
    ref,
  ) {
    return (
      <BottomSheetModal
        ref={ref}
        backdropComponent={renderBackdrop}
        enableDynamicSizing
        backgroundStyle={[
          {
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
          backgroundStyle,
        ]}
        handleIndicatorStyle={[
          { backgroundColor: '#dce3ea', width: 36 },
          handleIndicatorStyle,
        ]}
        {...props}
      >
        {children}
      </BottomSheetModal>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';

export { BottomSheet, BottomSheetView, BottomSheetScrollView };
export type { BottomSheetModal as BottomSheetHandle };
