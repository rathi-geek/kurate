import { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Link, Plus } from 'lucide-react-native';
import { useLocalization } from '@/context';
import { URL_REGEX } from '@kurate/hooks';
import { lightTheme } from '@kurate/theme';

interface ChatComposerProps {
  onSend: (text: string) => void | Promise<void>;
  onUrlChange?: (url: string | null) => void;
  placeholder?: string;
  collapsible?: boolean;
  disabled?: boolean;
}

export function ChatComposer({
  onSend,
  onUrlChange,
  placeholder,
  collapsible = false,
  disabled = false,
}: ChatComposerProps) {
  const { t } = useLocalization();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [lockedUrl, setLockedUrl] = useState<string | null>(null);
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayPlaceholder = placeholder ?? t('vault.input_placeholder');
  const hasText = value.trim().length > 0;
  const showSend = hasText || !!lockedUrl;
  const isCollapsed = collapsible && !focused && !hasText && !lockedUrl;

  useEffect(() => {
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => {
      const match = value.match(URL_REGEX);
      if (match) {
        const url = match[0];
        if (url !== lockedUrl) {
          const remainder = value.replace(url, '').trim();
          setValue(remainder);
          setLockedUrl(url);
          onUrlChange?.(url);
        }
      } else if (!lockedUrl) {
        onUrlChange?.(null);
      }
    }, 150);
    return () => {
      if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    };
  }, [value, lockedUrl, onUrlChange]);

  const handleSubmit = useCallback(async () => {
    const text = value.trim();
    if (!text && !lockedUrl) return;

    if (!lockedUrl && onUrlChange) {
      const match = text.match(URL_REGEX);
      if (match) {
        onUrlChange(match[0]);
        const remainder = text.replace(match[0], '').trim();
        setValue(remainder);
        setLockedUrl(match[0]);
        return;
      }
    }

    setValue('');
    setLockedUrl(null);
    onUrlChange?.(null);
    await onSend(text);
  }, [value, lockedUrl, onSend, onUrlChange]);

  return (
    <HStack
      className={`mx-4 items-center rounded-full bg-card p-2 shadow-lg ${isCollapsed ? 'h-10' : 'h-12'}`}
    >
      <Link size={15} className="ml-1 shrink-0 text-muted-foreground" />
      <TextInput
        className="flex-1 bg-transparent px-2 py-1.5 font-sans text-sm text-foreground"
        placeholder={displayPlaceholder}
        placeholderTextColor={lightTheme.brandMutedForeground}
        value={value}
        onChangeText={setValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
        editable={!disabled}
        multiline={false}
      />
      {showSend && (
        <Pressable
          onPress={handleSubmit}
          className="h-8 w-8 items-center justify-center rounded-full bg-primary"
        >
          <Plus size={14} className="text-primary-foreground" />
        </Pressable>
      )}
    </HStack>
  );
}
