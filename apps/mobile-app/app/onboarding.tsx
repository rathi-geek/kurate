import React, { useEffect } from 'react';
import { ScrollView } from '@/components/ui/scroll-view';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Divider } from '@/components/ui/divider';
import { Badge, BadgeText } from '@/components/ui/badge';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Motion } from '@legendapp/motion';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store';

// ─── Static data ────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote:
      'Kurate completely changed how I discover content. It\'s like having a brilliant friend who reads everything.',
    name: 'Nikhil Kamath',
    role: 'Co-founder, Zerodha',
  },
  {
    quote:
      'I organized 3 years of scattered bookmarks in a single afternoon. The AI tagging is unreal.',
    name: 'Naman Lahoti',
    role: 'Founder & Builder',
  },
  {
    quote: 'Replaced Pocket, Instapaper, and my 47 open tabs. Kurate just gets it.',
    name: 'Peter Thiel',
    role: 'Founder, Founders Fund',
  },
];

const FEATURES = [
  {
    label: 'S',
    bg: 'bg-primary/20',
    title: 'Save anything',
    desc: 'Drop any URL and we handle the rest — metadata, tags, and preview extracted instantly.',
  },
  {
    label: '★',
    bg: 'bg-accent',
    title: 'Discover more',
    desc: 'AI-powered recommendations tailored to your reading taste and saved content.',
  },
  {
    label: '◎',
    bg: 'bg-secondary',
    title: 'Proof of taste',
    desc: 'Build a living library others can follow. Your curation becomes your reputation.',
  },
];

const LOGOS = ['Product Hunt', 'Hacker News', 'Indie Hackers', 'Substack', 'Every', 'Readwise'];

const SHOWCASE_ITEMS = [
  { title: 'Tech Trends Report 2026', src: 'research.contrary.com', tag: 'AI' },
  { title: 'How to Do Great Work', src: 'paulgraham.com', tag: 'Startups' },
  { title: 'What I Read This Week #172', src: 'chamath.substack.com', tag: 'AI' },
];

// ─── Onboarding / Landing screen ────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useAuthStore(state => state.completeOnboarding);

  // Hero fade-up animations
  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(24);
  const subtitleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(24);
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(24);

  // CTA card pulse
  const ctaScale = useSharedValue(1);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    heroY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
    subtitleOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
    subtitleY.value = withDelay(
      150,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
    ctaOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
    ctaY.value = withDelay(
      300,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
    ctaScale.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      true,
    );
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleY.value }],
  }));
  const ctaButtonStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));
  const ctaCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const handleGetStarted = () => {
    completeOnboarding();
    router.push('/signup');
  };

  const handleLogIn = () => {
    completeOnboarding();
    router.push('/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Announcement banner */}
      <View className="bg-primary px-4 py-2.5">
        <Text className="text-center font-sans text-sm font-medium text-primary-foreground">
          Now on iOS & Android —{' '}
          <Text className="font-sans font-bold underline text-primary-foreground">
            Join the waitlist
          </Text>
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ── Logo row ────────────────────────────────────────────────── */}
        <HStack className="items-center px-6 pt-6 pb-2 gap-2">
          <View className="h-7 w-7 rounded-full border-2 border-foreground items-center justify-center">
            <View className="h-3 w-3 rounded-full bg-foreground" />
          </View>
          <Text className="font-sans text-xl font-black tracking-tight text-foreground">
            kurate
          </Text>
        </HStack>

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <VStack className="items-center px-6 py-14 gap-5">
          <Animated.View style={heroStyle} className="items-center">
            <Text className="font-sans text-4xl font-black italic tracking-tight text-foreground text-center leading-tight">
              Your second brain{'\n'}for the internet
            </Text>
          </Animated.View>

          <Animated.View style={subtitleStyle} className="items-center">
            <Text className="font-sans text-base text-muted-foreground text-center leading-relaxed max-w-xs">
              Save links, discover what matters, and build a library that reflects who you are.
            </Text>
          </Animated.View>

          <Animated.View style={ctaButtonStyle} className="w-full gap-3">
            <Button size="lg" onPress={handleGetStarted} className="w-full">
              <ButtonText>Get Started</ButtonText>
            </Button>
            <Button size="lg" variant="outline" onPress={handleLogIn} className="w-full">
              <ButtonText>Log In</ButtonText>
            </Button>
          </Animated.View>
        </VStack>

        {/* ── Platform badges ─────────────────────────────────────────── */}
        <HStack className="px-6 pb-10 gap-2 justify-center">
          {['Web', 'iOS', 'Android'].map(p => (
            <View
              key={p}
              className="flex-row items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5"
            >
              <View className="h-1.5 w-1.5 rounded-full bg-foreground" />
              <Text className="font-sans text-sm font-medium text-foreground">{p}</Text>
            </View>
          ))}
        </HStack>

        {/* ── Dark showcase ────────────────────────────────────────────── */}
        <View className="mx-6 mb-10 rounded-xl bg-foreground overflow-hidden">
          <VStack className="p-5 gap-1">
            <Text className="font-sans text-xs font-bold tracking-widest uppercase text-white/40 mb-2">
              Your Library
            </Text>
            {SHOWCASE_ITEMS.map((item, i) => (
              <View
                key={i}
                className={`py-3 ${i > 0 ? 'border-t border-white/[0.06]' : ''}`}
              >
                <Text className="font-sans text-sm font-semibold text-white mb-1">
                  {item.title}
                </Text>
                <HStack className="items-center gap-2">
                  <Text className="font-mono text-xs text-white/35">{item.src}</Text>
                  <View className="rounded bg-white/[0.07] px-1.5 py-0.5">
                    <Text className="font-sans text-xs text-white/50">{item.tag}</Text>
                  </View>
                </HStack>
              </View>
            ))}
          </VStack>
        </View>

        {/* ── Logo ticker (static scroll) ──────────────────────────────── */}
        <View className="bg-primary mb-10 py-3 overflow-hidden">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack className="px-4 gap-6">
              {[...LOGOS, ...LOGOS].map((l, i) => (
                <Text key={i} className="font-sans text-sm font-bold text-primary-foreground/50 whitespace-nowrap">
                  {l}
                </Text>
              ))}
            </HStack>
          </ScrollView>
        </View>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <VStack className="px-6 mb-10 gap-4">
          <Text className="font-sans text-2xl font-black text-foreground text-center mb-2">
            Everything you need to curate better
          </Text>
          {FEATURES.map((f, i) => (
            <Motion.View
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20, delay: i * 100 }}
            >
              <Card className="p-5 rounded-xl shadow-sm">
                <HStack className="gap-4 items-start">
                  <View
                    className={`h-11 w-11 ${f.bg} rounded-xl items-center justify-center shrink-0`}
                  >
                    <Text className="font-sans text-base font-bold text-foreground">{f.label}</Text>
                  </View>
                  <VStack className="flex-1 gap-1">
                    <Text className="font-sans text-base font-bold text-foreground">{f.title}</Text>
                    <Text className="font-sans text-sm text-muted-foreground leading-relaxed">
                      {f.desc}
                    </Text>
                  </VStack>
                </HStack>
              </Card>
            </Motion.View>
          ))}
        </VStack>

        <Divider className="mx-6 mb-10" />

        {/* ── Testimonials ─────────────────────────────────────────────── */}
        <VStack className="px-6 mb-10 gap-4">
          <Text className="font-sans text-2xl font-black italic text-foreground text-center mb-2">
            Loved by curious minds
          </Text>
          {TESTIMONIALS.map((t, i) => (
            <Motion.View
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20, delay: i * 80 }}
            >
              <Card className="p-5 rounded-xl bg-card shadow-sm">
                <VStack className="gap-4 items-center">
                  <View className="h-11 w-11 rounded-full bg-primary/20 items-center justify-center">
                    <Text className="font-sans text-sm font-bold text-primary">
                      {t.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </Text>
                  </View>
                  <Text className="font-sans text-sm text-foreground text-center leading-relaxed">
                    "{t.quote}"
                  </Text>
                  <VStack className="items-center gap-0.5">
                    <Text className="font-sans text-sm font-bold text-foreground">{t.name}</Text>
                    <Text className="font-sans text-xs text-muted-foreground">{t.role}</Text>
                  </VStack>
                </VStack>
              </Card>
            </Motion.View>
          ))}
        </VStack>

        {/* ── CTA section ──────────────────────────────────────────────── */}
        <View className="px-6 mb-10">
          <Animated.View
            style={ctaCardStyle}
            className="border-2 border-border rounded-xl p-8 items-center gap-5"
          >
            <Text className="font-sans text-sm text-muted-foreground">Ready to start?</Text>
            <Text className="font-sans text-2xl font-black text-foreground text-center">
              <Text className="italic">Build your library.</Text>
              {'\n'}Share your taste.
            </Text>
            <VStack className="w-full gap-3">
              <Button size="lg" onPress={handleGetStarted} className="w-full">
                <ButtonText>Get Started — it's free</ButtonText>
              </Button>
              <Button size="lg" variant="outline" onPress={handleLogIn} className="w-full">
                <ButtonText>Log In</ButtonText>
              </Button>
            </VStack>
          </Animated.View>
        </View>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <View className="border-t border-border px-6 pt-8 pb-12">
          <HStack className="justify-evenly mb-8">
            {[
              {
                title: 'Company',
                links: ['About', 'Careers', 'Blog', 'Press'],
              },
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Extension', 'Mobile'],
              },
              {
                title: 'Resources',
                links: ['Help', 'Community', 'Privacy', 'Terms'],
              },
            ].map(col => (
              <VStack key={col.title} className="items-center gap-2">
                <Text className="font-sans text-sm italic text-muted-foreground">{col.title}</Text>
                {col.links.map(link => (
                  <Text key={link} className="font-sans text-xs text-muted-foreground/75">
                    {link}
                  </Text>
                ))}
              </VStack>
            ))}
          </HStack>

          <VStack className="items-center gap-2">
            <HStack className="items-center gap-2">
              <View className="h-8 w-8 rounded-full border-2 border-foreground items-center justify-center">
                <View className="h-3.5 w-3.5 rounded-full bg-foreground" />
              </View>
              <Text className="font-sans text-3xl font-black tracking-tight text-foreground">
                kurate
              </Text>
            </HStack>
            <Text className="font-sans text-xs text-muted-foreground/55 text-center">
              © 2025 Kurate. All rights reserved.
            </Text>
            <HStack className="gap-4 mt-1">
              {['Terms', 'Privacy', 'Data Controls'].map(l => (
                <Text key={l} className="font-sans text-xs text-muted-foreground/55">
                  {l}
                </Text>
              ))}
            </HStack>
          </VStack>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
