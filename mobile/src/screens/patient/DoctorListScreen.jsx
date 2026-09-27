import { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { doctorApi } from '../../api/doctorApi.js';
import { DoctorCard } from '../../components/DoctorCard.jsx';
import { colors, radii } from '../../theme/colors.js';

export function DoctorListScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q) => {
    setLoading(true);
    doctorApi
      .list(q ? { q } : {})
      .then((res) => setDoctors(res.data.doctors))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(''), []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find your doctor</Text>
      <TextInput
        style={styles.search}
        placeholder="Search by symptom or specialty"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => load(query)}
        returnKeyType="search"
      />

      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <DoctorCard doctor={item} onPress={() => navigation.navigate('DoctorProfile', { doctorId: item._id })} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No doctors match this search.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offwhite, padding: 16, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: colors.charcoal, marginBottom: 14 },
  search: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.slate}22`,
  },
  empty: { textAlign: 'center', color: colors.slate, marginTop: 40 },
});
