import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import BrandConcentricArch from '@kurate/icons/brand/brand-concentric-arch.svg';

interface BrandLogoProps {
  size?: number;
  name?: string;
}

export function BrandLogo({ size = 24, name = 'kurate' }: BrandLogoProps) {
  return (
    <HStack className="items-center gap-2">
      <BrandConcentricArch width={size} height={size * 0.75} />
      <Text className="font-sans text-xl font-black tracking-tight text-foreground">
        {name}
      </Text>
    </HStack>
  );
}
