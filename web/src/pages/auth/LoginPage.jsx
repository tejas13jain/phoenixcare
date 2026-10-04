import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PhoenixLogoLockup } from '../../assets/logo/PhoenixLogoLockup.jsx';
import { Button, Input, Card } from '../../components/ui/index.js';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { authApi } from '../../api/authApi.js';
import { useAuthStore } from '../../store/slices/authStore.js';
import { extractErrorMessage } from '../../api/client.js';
import { getFirstName } from '../../utils/formatName.js';

const DASHBOARD_PATH = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin' };

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login({ identifier, password });
      setSession(data);
      toast.success(`Welcome back, ${getFirstName(data.user.name)}!`);
      const from = location.state?.from;
      const redirectTo = from ? `${from.pathname}${from.search || ''}` : DASHBOARD_PATH[data.user.role] || '/';
      navigate(redirectTo, { replace: true });
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
            <h2 className="text-xl font-heading font-semibold text-center mb-1">Welcome back</h2>
            <p className="text-sm text-slate-600 text-center mb-6">Log in to continue your care journey</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email or phone"
                name="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Log in
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-slate-600">
              <Link to="/otp-login" className="text-teal-600 font-medium hover:underline">
                Log in with OTP instead
              </Link>
            </div>
            <div className="mt-2 text-center text-sm text-slate-600">
              New to PhoenixCare?{' '}
              <Link to="/signup" state={location.state} className="text-teal-600 font-medium hover:underline">
                Create an account
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
