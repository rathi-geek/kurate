import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';

export default function OnboardingProfileScreen() {
  return (
    <AuthPageShell>
      <OnboardingForm />
    </AuthPageShell>
  );
}
