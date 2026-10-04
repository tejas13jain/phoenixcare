import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Check, Circle } from 'lucide-react';
import { PhoenixLogoLockup } from '../../assets/logo/PhoenixLogoLockup.jsx';
import { Button, Input, Card } from '../../components/ui/index.js';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { authApi } from '../../api/authApi.js';
import { useAuthStore } from '../../store/slices/authStore.js';
import { extractErrorMessage } from '../../api/client.js';
import { fieldErrorsFrom } from '../../components/admin/FormControls.jsx';

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', short: 'at least 8 characters', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter (A–Z)', short: 'an uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'One number (0–9)', short: 'a number (0–9)', test: (p) => /[0-9]/.test(p) },
];

// Same idea as the server: ignore spaces, dashes and brackets, then expect 8–15 digits.
const phoneDigits = (value) => value.replace(/\D/g, '');

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Please enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address, like name@example.com';
  const digits = phoneDigits(form.phone);
  if (digits.length < 8 || digits.length > 15) {
    errors.phone = 'Enter a valid mobile number, for example 98765 43210 or +91 98765 43210';
  }
  const failed = PASSWORD_RULES.filter((r) => !r.test(form.password));
  if (failed.length) errors.password = `Password needs: ${failed.map((r) => r.short).join(', ')}`;
  return errors;
}

export function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'patient' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.signup({ ...form, name: form.name.trim(), email: form.email.trim() });
      setSession(data);
      toast.success('Account created — welcome to PhoenixCare!');
      // A patient who was sent here from a page (e.g. a booking link) returns to it afterwards.
      const from = location.state?.from;
      const back = form.role === 'patient' && from ? `${from.pathname}${from.search || ''}` : null;
      navigate(back || (form.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'), { replace: true });
    } catch (err) {
      // Show the server's specific complaint next to the field it is about.
      setErrors(fieldErrorsFrom(err));
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

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input label="Full name" name="name" value={form.name} onChange={update('name')} error={errors.name} autoComplete="name" />
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={update('email')}
                error={errors.email}
                autoComplete="email"
              />
              <Input
                label="Mobile number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                error={errors.phone}
                placeholder="98765 43210 or +91 98765 43210"
                autoComplete="tel"
              />
              <div>
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  error={errors.password}
                  autoComplete="new-password"
                />
                <ul className="mt-2 space-y-1" aria-label="Password requirements">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(form.password);
                    return (
                      <li key={rule.key} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-success' : 'text-slate-600'}`}>
                        {ok ? <Check size={13} /> : <Circle size={13} />} {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
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
