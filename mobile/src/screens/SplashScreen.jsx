import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { PhoenixIcon } from '../components/PhoenixIcon.jsx';
import { colors } from '../theme/colors.js';

// Plays once on cold launch, ~1.8s total, then RootNavigator swaps it for onboarding/home.
export function SplashScreen({ onDone }) {
  const iconOpacity = useSharedValue(0);
  const iconY = useSharedValue(20);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    iconOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    iconY.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) });
    textOpacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    taglineOpacity.value = withDelay(750, withTiming(1, { duration: 500 }));

    const timer = setTimeout(onDone, 1800);
    return () => clearTimeout(timer);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ translateY: iconY.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <LinearGradient colors={[colors.teal, colors.sky, colors.sunrise]} style={styles.container}>
      <Animated.View style={iconStyle}>
        <PhoenixIcon size={96} />
      </Animated.View>
      <Animated.Text style={[styles.title, textStyle]}>PhoenixCare</Animated.Text>
      <Animated.Text style={[styles.tagline, taglineStyle]}>Rise stronger, every day.</Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 20, fontSize: 26, fontWeight: '700', color: colors.white },
  tagline: { marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.85)' },
});
