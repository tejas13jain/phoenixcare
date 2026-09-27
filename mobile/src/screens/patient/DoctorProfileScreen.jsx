import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doctorApi } from '../../api/doctorApi.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { colors, radii } from '../../theme/colors.js';

export function DoctorProfileScreen({ route }) {
  const { doctorId } = route.params;
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorApi
      .getById(doctorId)
      .then((res) => setDoctor(res.data.doctor))
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return <ActivityIndicator color={colors.teal} style={{ marginTop: 100 }} />;
  if (!doctor) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
      <Card style={{ alignItems: 'center' }}>
        <LinearGradient colors={[colors.teal, colors.sky, colors.sunrise]} style={styles.avatar}>
          <Text style={styles.avatarText}>
            {doctor.user?.name
              ?.split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')}
          </Text>
        </LinearGradient>
        <Text style={styles.name}>{doctor.user?.name}</Text>
        <Text style={styles.specialty}>{doctor.specialties?.join(', ')}</Text>
        <Text style={styles.rating}>
          ★ {doctor.rating?.toFixed(1)} ({doctor.ratingCount}) · {doctor.experienceYears}+ yrs
        </Text>
        <Text style={styles.bio}>{doctor.bio}</Text>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>Choose a consultation mode</Text>
        {doctor.consultationModes?.map((mode) => (
          <View key={mode} style={styles.modeRow}>
            <Text style={styles.modeLabel}>{mode.replace('_', ' ')}</Text>
            <Text style={styles.modeFee}>₹{doctor.fee?.[mode]}</Text>
          </View>
        ))}
        <Button title="Book now" onPress={() => {}} style={{ marginTop: 12 }} />
        <Text style={styles.note}>
          The full booking flow (slot picker, intake form, payment) is live on the web app today and is the
          reference implementation this screen will port next.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offwhite },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 22 },
  name: { fontSize: 19, fontWeight: '700', color: colors.charcoal },
  specialty: { fontSize: 13, color: colors.slate, marginTop: 2 },
  rating: { fontSize: 12, color: colors.slate, marginTop: 6 },
  bio: { fontSize: 13, color: colors.charcoal, textAlign: 'center', marginTop: 12, lineHeight: 19 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.charcoal, marginBottom: 10 },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.slate}15`,
  },
  modeLabel: { fontSize: 13, color: colors.charcoal, textTransform: 'capitalize' },
  modeFee: { fontSize: 13, color: colors.teal, fontWeight: '700' },
  note: { fontSize: 11, color: colors.slate, marginTop: 10, lineHeight: 15 },
});
