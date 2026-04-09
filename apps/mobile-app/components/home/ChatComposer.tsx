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
  const lastReportedUrl = useRef<string | null>(null);

  const displayPlaceholder = placeholder ?? t('vault.input_placeholder');
  const hasText = value.trim().length > 0;
  const showSend = hasText || !!lockedUrl;
  const isCollapsed = collapsible && !focused && !hasText && !lockedUrl;

  // URL detection — 150ms debounce
  useEffect(() => {
    if (!onUrlChange) return;
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => {
      const match = value.match(URL_REGEX);
      if (match) {
        const url = match[0];
        if (lockedUrl === url) {
          // Same URL pasted again — deduplicate from value
          const deduped = value.replace(url, '').trim();
          if (deduped !== value) setValue(deduped);
          return;
        }
        const remaining = value.replace(url, '').trim();
        setValue(remaining);
        setLockedUrl(url);
        lastReportedUrl.current = url;
        onUrlChange(url);
      } else if (lastReportedUrl.current !== null && !lockedUrl) {
        lastReportedUrl.current = null;
        onUrlChange(null);
      }
    }, 150);
    return () => {
      if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    };
  }, [value, lockedUrl, onUrlChange]);

  const handleSubmit = useCallback(async () => {
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed && !lockedUrl) return;

    // Fast paste+enter: URL not yet locked by debounce
    if (!lockedUrl && onUrlChange) {
      const match = trimmed.match(URL_REGEX);
      if (match) {
        const url = match[0];
        onUrlChange(url);
        const remaining = trimmed.replace(url, '').trim();
        onSend(remaining);
        setValue('');
        setLockedUrl(null);
        lastReportedUrl.current = null;
        return;
      }
    }

    // Reset ref so URL detection effect doesn't fire onUrlChange(null) after submit
    lastReportedUrl.current = null;
    // Send note text (lockedUrl handled by parent via previewUrl)
    onSend(trimmed);
    setValue('');
    setLockedUrl(null);
  }, [value, lockedUrl, disabled, onSend, onUrlChange]);

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
