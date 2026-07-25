import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors } from '../../utils/theme';

interface CardProps extends ViewProps {
  accentColor?: string;
}

export function Card({ children, style, accentColor, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        accentColor && { borderLeftColor: accentColor, borderLeftWidth: 3 },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
});
