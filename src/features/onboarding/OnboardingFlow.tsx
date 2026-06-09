import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/design/primitives/Text';
import { Button } from '@/design/primitives/Button';
import { Badge } from '@/design/primitives/Badge';
import { useTheme } from '@/design/theme/useTheme';
import { spacing } from '@/design/tokens/spacing';
import { analytics } from '@/core/analytics/analytics';

const CATEGORIES = ['All', 'Politics', 'Sports', 'Movies', 'Business', 'Districts', 'Technology'];
const { width } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: Props) {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const advance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 2) { setStep(s => s + 1); return; }
    analytics.track('onboarding_completed', { category: selectedCategory });
    onComplete();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Step indicators */}
      <View style={styles.dots}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === step ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>

      {step === 0 && (
        <View style={styles.content}>
          <Text variant="h2" style={{ textAlign: 'center', marginBottom: spacing['3'] }}>
            తెలుగు వార్తలు {'\n'}ఒక్క చోటికి
          </Text>
          <Text variant="body" tone="secondary" style={{ textAlign: 'center', marginBottom: spacing['8'] }}>
            Welcome to Insta News Telugu — your source for the latest Telugu news, live TV, and videos.
          </Text>
          <Button label="Get Started" onPress={advance} size="lg" style={{ alignSelf: 'stretch' }} />
        </View>
      )}

      {step === 1 && (
        <View style={styles.content}>
          <Text variant="h3" style={{ textAlign: 'center', marginBottom: spacing['2'] }}>
            Pick your interests
          </Text>
          <Text variant="body" tone="secondary" style={{ textAlign: 'center', marginBottom: spacing['6'] }}>
            We'll show you relevant news first
          </Text>
          <View style={styles.chips}>
            {CATEGORIES.map(cat => (
              <Badge
                key={cat}
                label={cat}
                variant={selectedCategory === cat ? 'primary' : 'secondary'}
              />
            ))}
          </View>
          <Button label="Continue" onPress={advance} size="lg" style={{ alignSelf: 'stretch', marginTop: spacing['8'] }} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.content}>
          <Text variant="h3" style={{ textAlign: 'center', marginBottom: spacing['2'] }}>
            Stay informed
          </Text>
          <Text variant="body" tone="secondary" style={{ textAlign: 'center', marginBottom: spacing['8'] }}>
            Enable notifications to get breaking news alerts instantly.
          </Text>
          <Button
            label={notificationsEnabled ? 'Notifications enabled ✓' : 'Enable Notifications'}
            variant={notificationsEnabled ? 'secondary' : 'primary'}
            onPress={() => setNotificationsEnabled(true)}
            size="lg"
            style={{ alignSelf: 'stretch', marginBottom: spacing['4'] }}
          />
          <Button label="Start Reading" onPress={advance} variant="ghost" size="lg" style={{ alignSelf: 'stretch' }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['6'] },
  dots:    { flexDirection: 'row', gap: 8, marginBottom: spacing['10'] },
  dot:     { width: 8, height: 8, borderRadius: 4 },
  content: { width: '100%', alignItems: 'center' },
  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
});
