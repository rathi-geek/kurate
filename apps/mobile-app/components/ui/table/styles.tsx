import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { isWeb } from '@gluestack-ui/utils/nativewind-utils';

const captionTableStyle = isWeb ? 'caption-bottom' : '';

export const tableStyle = tva({
  base: `table w-[800px] border-collapse`,
});

export const tableHeaderStyle = tva({
  base: '',
});

export const tableBodyStyle = tva({
  base: '',
});

export const tableFooterStyle = tva({
  base: '',
});

export const tableHeadStyle = tva({
  base: 'font-roboto flex-1 px-6 py-[14px] text-left text-[16px] font-bold leading-[22px] text-foreground/80',
});

export const tableRowStyleStyle = tva({
  base: 'border-0 border-b border-solid border-border/80 bg-background',
  variants: {
    isHeaderRow: {
      true: '',
    },
    isFooterRow: {
      true: 'border-b-0 ',
    },
  },
});

export const tableDataStyle = tva({
  base: 'font-roboto flex-1 px-6 py-[14px] text-left text-[16px] font-medium leading-[22px] text-foreground/80',
});

export const tableCaptionStyle = tva({
  base: `${captionTableStyle} font-roboto bg-background/90 px-6 py-[14px] text-[16px] font-normal leading-[22px] text-foreground/90`,
});
