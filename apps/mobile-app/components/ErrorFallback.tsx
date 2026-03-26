import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import { Button, ButtonText } from '@/components/ui/button';
import { useErrorBoundary } from 'react-error-boundary';
type Props = {
  error: Error;
};

function ErrorFallback({ error }: Props) {
  const { resetBoundary } = useErrorBoundary();
  return (
    <View style={styles.container}>
      <Text
        style={styles.title}
        lightColor="rgba(0,0,0,)"
        darkColor="rgba(255,255,255)"
      >
        Something went wrong
      </Text>

      <Text
        style={styles.subTitle}
        lightColor="rgba(0,0,0,0.6)"
        darkColor="rgba(255,255,255,0.6)"
      >
        {error.message}
      </Text>
      <Text
        style={styles.subTitle}
        lightColor="rgba(0,0,0,0.8)"
        darkColor="rgba(255,255,255,0.8)"
      >
        Note: update this screen to modify the error boundary UI.
      </Text>

      <Button onPress={resetBoundary} style={styles.button}>
        {/* reset  state */}
        <ButtonText>Retry</ButtonText>
      </Button>
    </View>
  );
}

export default ErrorFallback;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  subTitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
