import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { Button, ButtonText } from '@/components/ui/button';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';

function CrashTestContent() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Intentional crash for testing error boundary!');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Error Boundary Test</Text>
      <Text style={styles.description}>
        Click the button below to test the error boundary
      </Text>
      <Button onPress={() => setShouldCrash(true)} style={styles.button}>
        <ButtonText>Trigger Error</ButtonText>
      </Button>
    </View>
  );
}

export default function CrashTest() {
  return (
    <PageErrorBoundary onRetry={() => console.log('User clicked retry')}>
      <CrashTestContent />
    </PageErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    color: 'gray',
  },
  button: {
    paddingHorizontal: 24,
  },
});
