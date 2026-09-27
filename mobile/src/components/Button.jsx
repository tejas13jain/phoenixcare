import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radii } from '../theme/colors.js';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 100 });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const content = (
    <>
      {loading && <ActivityIndicator color={variant === 'primary' ? colors.white : colors.teal} style={{ marginRight: 8 }} />}
      <Text style={[styles.label, variant !== 'primary' && { color: colors.teal }]}>{title}</Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animatedStyle, style]}
      >
        <LinearGradient
          colors={[colors.teal, colors.sky, colors.sunrise]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, (disabled || loading) && { opacity: 0.6 }]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, styles.button, styles.outline, (disabled || loading) && { opacity: 0.6 }, style]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
  },
  outline: {
    borderWidth: 2,
    borderColor: colors.teal,
    backgroundColor: 'transparent',
  },
  label: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
});
