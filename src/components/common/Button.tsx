import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../../utils/theme';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const bg = {
    primary: colors.primary,
    secondary: colors.surface,
    ghost: 'transparent',
    danger: '#8B0000',
  }[variant];

  const textColor = variant === 'ghost' ? colors.textSecondary : colors.text;

  const paddingV = { sm: 8, md: 14, lg: 18 }[size];
  const fontSize = { sm: 13, md: 15, lg: 17 }[size];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: bg, paddingVertical: paddingV },
        variant === 'secondary' && styles.secondaryBorder,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.label, { fontSize, color: textColor }]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontWeight: '600',
  },
});
