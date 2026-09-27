import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { PhoenixIcon } from '../../components/PhoenixIcon.jsx';
import { Button } from '../../components/Button.jsx';
import { colors, radii } from '../../theme/colors.js';
import { authApi } from '../../api/authApi.js';
import { useAuthStore } from '../../store/authStore.js';
import { extractErrorMessage } from '../../api/client.js';

export function SignupScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'patient' });
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSignup = async () => {
    setLoading(true);
    try {
      const { data } = await authApi.signup(form);
      setSession(data);
    } catch (err) {
      Alert.alert('Signup failed', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoRow}>
        <PhoenixIcon size={36} />
        <Text style={styles.brand}>PhoenixCare</Text>
      </View>
      <Text style={styles.title}>Create your account</Text>

      <View style={styles.roleToggle}>
        {['patient', 'doctor'].map((role) => (
          <Text
            key={role}
            onPress={() => update('role')(role)}
            style={[styles.roleOption, form.role === role && styles.roleOptionActive]}
          >
            I'm a {role}
          </Text>
        ))}
      </View>

      <Field label="Full name" value={form.name} onChangeText={update('name')} />
      <Field label="Email" value={form.email} onChangeText={update('email')} autoCapitalize="none" keyboardType="email-address" />
      <Field label="Phone (with country code)" value={form.phone} onChangeText={update('phone')} placeholder="+919812345678" />
      <Field label="Password" value={form.password} onChangeText={update('password')} secureTextEntry />

      <Button title="Create account" onPress={handleSignup} loading={loading} style={{ marginTop: 16 }} />

      <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
        Already have an account? <Text style={{ color: colors.teal, fontWeight: '600' }}>Log in</Text>
      </Text>
    </ScrollView>
  );
}

function Field({ label, ...props }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.offwhite, padding: 24, paddingTop: 60 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  brand: { fontSize: 18, fontWeight: '700', color: colors.charcoal },
  title: { fontSize: 20, fontWeight: '700', color: colors.charcoal, textAlign: 'center', marginBottom: 20 },
  roleToggle: { flexDirection: 'row', backgroundColor: `${colors.slate}1A`, borderRadius: radii.md, padding: 4, marginBottom: 16 },
  roleOption: { flex: 1, textAlign: 'center', paddingVertical: 8, borderRadius: 8, color: colors.slate, fontSize: 13, fontWeight: '600' },
  roleOptionActive: { backgroundColor: colors.white, color: colors.teal },
  label: { fontSize: 13, fontWeight: '500', color: colors.charcoal, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: `${colors.slate}33`,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: colors.white,
  },
  link: { textAlign: 'center', marginTop: 20, color: colors.slate, fontSize: 13 },
});
