import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PhoenixLogoLockup } from '../../assets/logo/PhoenixLogoLockup.jsx';
import { Button, Input, Card } from '../../components/ui/index.js';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { authApi } from '../../api/authApi.js';
import { useAuthStore } from '../../store/slices/authStore.js';
import { extractErrorMessage } from '../../api/client.js';

const DASHBOARD_PATH = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin' };

export function OtpLoginPage() {
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const channel = identifier.includes('@') ? 'email' : 'sms';
      await authApi.requestOtp({ identifier, channel, purpose: 'login' });
      toast.success(`OTP sent via ${channel}. Check the backend logs in dev mode.`);
      setStep('verify');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp({ identifier, code, purpose: 'login' });
      setSession(data);
      toast.success('Logged in successfully!');
      navigate(DASHBOARD_PATH[data.user.role] || '/', { replace: true });
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
            <h2 className="text-xl font-heading font-semibold text-center mb-1">
              {step === 'request' ? 'Log in with OTP' : 'Enter the code'}
            </h2>
            <p className="text-sm text-slate-600 text-center mb-6">
              {step === 'request'
                ? 'We will send a 6-digit code to your email or phone'
                : `We sent a code to ${identifier}`}
            </p>

            {step === 'request' ? (
              <form onSubmit={requestOtp} className="space-y-4">
                <Input
                  label="Email or phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com or +919812345678"
                  required
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <Input
                  label="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  inputMode="numeric"
                  required
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Verify & log in
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-sm text-slate-600 hover:underline"
                  onClick={() => setStep('request')}
                >
                  Use a different email/phone
                </button>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
