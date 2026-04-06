import { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { ArrowLeft, X } from 'lucide-react-native';
import { useLocalization } from '@/context';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface VaultSearchBarProps {
  value: string;
  onSearch: (q: string) => void;
  onClose: () => void;
}

export function VaultSearchBar({
  value,
  onSearch,
  onClose,
}: VaultSearchBarProps) {
  const { t } = useLocalization();
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebouncedValue(localValue);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleClose = () => {
    setLocalValue('');
    onSearch('');
    onClose();
  };

  return (
    <HStack className="mx-4 mb-1 mt-2 items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-sm">
      <Pressable onPress={handleClose} className="p-1">
        <ArrowLeft size={16} className="text-muted-foreground" />
      </Pressable>
      <TextInput
        className="flex-1 font-sans text-sm text-foreground"
        placeholder={t('vault.search_placeholder')}
        placeholderTextColor="#5b7d99"
        value={localValue}
        onChangeText={setLocalValue}
        autoFocus
        returnKeyType="search"
      />
      {localValue.length > 0 && (
        <Pressable onPress={() => setLocalValue('')} className="p-1">
          <X size={14} className="text-muted-foreground" />
        </Pressable>
      )}
    </HStack>
  );
}
