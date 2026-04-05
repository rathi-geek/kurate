import { StyleSheet } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useLocalization } from '@/context';
import { storageUtils } from '@/utils';
import { useAuthStore } from '@/store';
import { supabase } from '@/libs/supabase/client';
import { Link } from 'expo-router';

export default function TabOneScreen() {
  const { theme, mode, setMode } = useTheme();
  const { t, setLocale, switchToDeviceLocale } = useLocalization();
  const isAutoMode = mode === 'system';
  const reset = useAuthStore(state => state.reset);
  return (
    <View style={styles.container} className="bg-background">
      <Text className="mb-10 text-2xl font-bold text-foreground">
        Theme and Language Settings
      </Text>

      <View style={styles.section}>
        <Text className="text-foreground" style={styles.label}>
          Auto (Follow System)
        </Text>
        <Button
          onPress={() => setMode(isAutoMode ? 'light' : 'system')}
          className={isAutoMode ? 'bg-foreground/95' : 'bg-foreground/20'}
          style={styles.toggleButton}
        >
          <ButtonText className="text-background">
            {isAutoMode ? 'ON' : 'OFF'}
          </ButtonText>
        </Button>
      </View>

      {!isAutoMode && (
        <View style={styles.section}>
          <Text className="text-foreground" style={styles.label}>
            Manual Theme
          </Text>
          <View style={styles.buttonRow}>
            <Button
              onPress={() => setMode('light')}
              className={
                mode === 'light' ? 'bg-foreground/95' : 'bg-foreground/20'
              }
              style={styles.themeButton}
            >
              <ButtonText className="text-background">Light</ButtonText>
            </Button>
            <Button
              onPress={() => setMode('dark')}
              className={
                mode === 'dark' ? 'bg-foreground/95' : 'bg-foreground/20'
              }
              style={styles.themeButton}
            >
              <ButtonText className="text-background">Dark</ButtonText>
            </Button>
          </View>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text className="text-foreground" style={styles.infoText}>
          Current Mode: {isAutoMode ? 'Auto (System)' : mode}
        </Text>
        <Text className="text-foreground" style={styles.infoText}>
          Active Theme: {theme}
        </Text>
      </View>
      <View style={styles.infoSection}>
        <Button
          variant="default"
          size="default"
          onPress={() => setLocale('en')}
        >
          <ButtonText>English</ButtonText>
        </Button>
        <Button
          onPress={() => setLocale('es')}
          variant="default"
          size="default"
        >
          <ButtonText>Spanish</ButtonText>
        </Button>
        <Button
          onPress={() => setLocale('pt')}
          variant="default"
          size="default"
        >
          <ButtonText>Portuguese</ButtonText>
        </Button>
      </View>
      <Text>{t('test')}</Text>
      <Button
        onPress={() => {
          storageUtils.clearAllItems();
          switchToDeviceLocale();
        }}
        className="bg-foreground"
      >
        <ButtonText className="text-background">
          Set to device locale
        </ButtonText>
      </Button>
      <Link asChild push href="/modal" className="my-2">
        <Button>
          <ButtonText>Go to Modal</ButtonText>
        </Button>
      </Link>
      <Button
        variant="destructive"
        onPress={async () => {
          await supabase.auth.signOut();
          reset();
          await storageUtils.clearAllItems();
        }}
      >
        <ButtonText>Logout</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  section: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  toggleButton: {
    minWidth: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  themeButton: {
    flex: 1,
    maxWidth: 120,
  },
  infoSection: {
    marginTop: 40,
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
