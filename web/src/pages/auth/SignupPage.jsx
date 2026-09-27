import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PhoenixLogoLockup } from '../../assets/logo/PhoenixLogoLockup.jsx';
import { Button, Input, Card } from '../../components/ui/index.js';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { authApi } from '../../api/authApi.js';
import { useAuthStore } from '../../store/slices/authStore.js';
import { extractErrorMessage } from '../../api/client.js';

export function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'patient' });
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.signup(form);
      setSession(data);
      toast.success('Account created — welcome to PhoenixCare!');
      navigate(form.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard', { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-phoenix-gradient-soft">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="w-full max-w-md p-8">
            <div className="flex justify-center mb-6">
              <PhoenixLogoLockup size={40} />
            </div>
            <h2 className="text-xl font-heading font-semibold text-center mb-1">Create your account</h2>
            <p className="text-sm text-slate-600 text-center mb-6">Join thousands rising stronger with PhoenixCare</p>

            <div className="flex rounded-xl bg-slate-600/10 p-1 mb-5">
              {['patient', 'doctor'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role }))}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                    form.role === role ? 'bg-white shadow-soft text-teal-600' : 'text-slate-600'
                  }`}
                >
                  I'm a {role}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full name" name="name" value={form.name} onChange={update('name')} required />
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={update('email')}
                required
              />
              <Input
                label="Phone (with country code)"
                name="phone"
                value={form.phone}
                onChange={update('phone')}
                placeholder="+919812345678"
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="At least 8 characters, 1 uppercase, 1 number"
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Create account
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 font-medium hover:underline">
                Log in
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
