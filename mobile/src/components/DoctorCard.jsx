import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './Card.jsx';
import { colors, radii } from '../theme/colors.js';

export function DoctorCard({ doctor, onPress }) {
  const initials = doctor.user?.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <LinearGradient colors={[colors.teal, colors.sky, colors.sunrise]} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{doctor.user?.name}</Text>
          <Text style={styles.specialty}>{doctor.specialties?.join(', ')}</Text>
          <Text style={styles.meta}>
            ★ {doctor.rating?.toFixed(1)} ({doctor.ratingCount}) · {doctor.experienceYears}+ yrs
          </Text>
        </View>
        <View style={styles.feeBadge}>
          <Text style={styles.feeText}>₹{doctor.fee?.video}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '700', color: colors.charcoal },
  specialty: { fontSize: 12, color: colors.slate, marginTop: 1 },
  meta: { fontSize: 11, color: colors.slate, marginTop: 3 },
  feeBadge: { backgroundColor: `${colors.teal}1A`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.full },
  feeText: { color: colors.teal, fontWeight: '700', fontSize: 12 },
});
