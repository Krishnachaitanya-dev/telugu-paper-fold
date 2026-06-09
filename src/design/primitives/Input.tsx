import React from 'react';
import { TextInput, View, type TextInputProps, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { fontSize } from '../tokens/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, style, ...rest }: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {label && <Text variant="label" style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.destructive : colors.border,
            borderRadius: radius.md,
          },
        ]}
      >
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            { color: colors.textPrimary, fontSize: fontSize.base },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          testID={rest.testID ?? label?.toLowerCase().replace(/\s+/g, '-')}
          {...rest}
        />
      </View>
      {error && <Text variant="caption" tone="destructive">{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { gap: 4 },
  label:     { marginBottom: 2 },
  container: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, height: 46, paddingHorizontal: spacing['3'] },
  icon:      { marginRight: spacing['2'] },
  input:     { flex: 1, height: '100%' },
});
