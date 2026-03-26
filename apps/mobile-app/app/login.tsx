import { View } from '@/components/Themed';
import { Button, ButtonText } from '@/components/ui/button';
import { useAuthStore } from '@/store';
import { Link, router } from 'expo-router';

export default function Login() {
  const login = useAuthStore(state => state.login);
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Button onPress={login}>
        <ButtonText>Login</ButtonText>
      </Button>
      <Button onPress={() => router.push('/signup')}>
        <ButtonText>Go to Signup</ButtonText>
      </Button>
      <Link asChild push href="/modal">
        <Button>
          <ButtonText>Go to Modal</ButtonText>
        </Button>
      </Link>
    </View>
  );
}
