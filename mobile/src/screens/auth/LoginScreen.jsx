import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { PhoenixIcon } from '../../components/PhoenixIcon.jsx';
import { Button } from '../../components/Button.jsx';
import { colors, radii } from '../../theme/colors.js';
import { authApi } from '../../api/authApi.js';
import { useAuthStore } from '../../store/authStore.js';
import { extractErrorMessage } from '../../api/client.js';

export function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ identifier, password });
      setSession(data);
    } catch (err) {
      Alert.alert('Login failed', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.logoRow}>
        <PhoenixIcon size={40} />
        <Text style={styles.brand}>PhoenixCare</Text>
      </View>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to continue your care journey</Text>

      <Text style={styles.label}>Email or phone</Text>
      <TextInput
        style={styles.input}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        placeholder="you@example.com"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      <Button title="Log in" onPress={handleLogin} loading={loading} style={{ marginTop: 12 }} />

      <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
        New to PhoenixCare? <Text style={{ color: colors.teal, fontWeight: '600' }}>Create an account</Text>
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offwhite, padding: 24, justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 },
  brand: { fontSize: 20, fontWeight: '700', color: colors.charcoal },
  title: { fontSize: 20, fontWeight: '700', color: colors.charcoal, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.slate, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '500', color: colors.charcoal, marginBottom: 6, marginTop: 14 },
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
