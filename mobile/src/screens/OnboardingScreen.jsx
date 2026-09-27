import { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radii } from '../theme/colors.js';
import { Button } from '../components/Button.jsx';

const SLIDES = [
  {
    key: 'find',
    title: 'Find the right doctor, fast',
    body: 'Search by specialty, symptom, language, or fee — see verified doctors with real ratings.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    key: 'consult',
    title: 'Consult your way',
    body: 'Video, audio, or chat — book a slot that works for you and connect in seconds.',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80',
  },
  {
    key: 'records',
    title: 'Everything in one place',
    body: 'Digital prescriptions, health records, and appointment history — always in your pocket.',
    image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=800&q=80',
  },
];

const ONBOARDING_SEEN_KEY = 'phoenixcare-onboarding-seen';

export function OnboardingScreen({ onDone }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    onDone();
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      finish();
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <Text onPress={finish} style={styles.skip}>
          Skip
        </Text>
        <Button title={index === SLIDES.length - 1 ? 'Get started' : 'Next'} onPress={next} style={{ width: 160 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offwhite },
  slide: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 80 },
  image: { width: '100%', height: 260, borderRadius: radii.xl, marginBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: colors.charcoal, textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 14, color: colors.slate, textAlign: 'center', lineHeight: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: `${colors.slate}33` },
  dotActive: { backgroundColor: colors.teal, width: 20 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  skip: { color: colors.slate, fontSize: 14 },
});
