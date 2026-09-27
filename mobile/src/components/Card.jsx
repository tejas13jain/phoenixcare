import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radii, shadow } from '../theme/colors.js';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({ children, style, onPress }) {
  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>;
  }

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withTiming(0.97, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      style={[styles.card, animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    ...shadow.soft,
  },
});
