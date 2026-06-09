import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text } from './Text';

interface AvatarProps {
  size?: number;
  imageUri?: string | null;
  name?: string | null;
  color?: string;
  online?: boolean;
}

export function Avatar({ size = 44, imageUri, name, color = '#F97316', online }: AvatarProps) {
  const initials = (name ?? 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'U';

  return (
    <View style={{ width: size, height: size }}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
        >
          <Text
            style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}
          >
            {initials}
          </Text>
        </View>
      )}
      {online && (
        <View
          style={[
            styles.onlineDot,
            { width: size * 0.28, height: size * 0.28, borderRadius: (size * 0.28) / 2, right: 0, bottom: 0 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image:     { resizeMode: 'cover' },
  fallback:  { alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
});
