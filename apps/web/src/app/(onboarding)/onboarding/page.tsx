import type { Metadata } from "next";

import { OnboardingForm } from "./_components/onboarding-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingForm />;
}
