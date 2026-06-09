import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSearch } from '@/features/search/hooks/useSearch';
import { Input } from '@/design/primitives/Input';
import { Text } from '@/design/primitives/Text';
import { useTheme } from '@/design/theme/useTheme';
import { spacing } from '@/design/tokens/spacing';
import type { NewsUpdate } from '@/features/news/model/news.schema';

export default function SearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { query, results, loading, search, clear } = useSearch();

  const renderItem = ({ item }: { item: NewsUpdate }) => (
    <TouchableOpacity
      onPress={() => router.push(`/news/${item.id}`)}
      activeOpacity={0.7}
      style={[styles.resultRow, { borderBottomColor: colors.border }]}
      testID="search-result-item"
    >
      <View style={styles.resultText}>
        <Text variant="bodyBold" numberOfLines={2}>{item.title}</Text>
        <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
          {item.category} · {item.source_name ?? 'Telugu News'}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Input
            placeholder="Search Telugu news..."
            value={query}
            onChangeText={search}
            autoFocus
            returnKeyType="search"
            leftIcon={<Feather name="search" size={18} color={colors.textSecondary} />}
            style={{ flex: 1 }}
            testID="search-input"
          />
          <Pressable onPress={() => { clear(); router.back(); }} style={styles.cancelBtn}>
            <Text variant="label" tone="brand">Cancel</Text>
          </Pressable>
        </View>

        {loading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['6'] }} />
        )}

        {!loading && query.length > 0 && results.length === 0 && (
          <View style={styles.empty}>
            <Feather name="search" size={32} color={colors.border} />
            <Text variant="body" tone="secondary" style={{ marginTop: spacing['3'] }}>
              No results for "{query}"
            </Text>
          </View>
        )}

        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 84 : 20) }}
          keyboardDismissMode="on-drag"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing['4'], paddingVertical: spacing['2'], borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing['2'] },
  cancelBtn:  { paddingVertical: spacing['2'], paddingHorizontal: spacing['1'] },
  resultRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing['3'], paddingHorizontal: spacing['4'], borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing['3'] },
  resultText: { flex: 1 },
  empty:      { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
});
