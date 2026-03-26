import { View } from '@/components/Themed';
import { Button, ButtonText } from '@/components/ui/button';
import { useAuthStore } from '@/store';
import { router } from 'expo-router';

export default function Signup() {
  const login = useAuthStore(state => state.login);
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Button onPress={login}>
        <ButtonText>Signup</ButtonText>
      </Button>
      <Button onPress={() => router.push('/login')}>
        <ButtonText>Go to Login</ButtonText>
      </Button>
    </View>
  );
}
