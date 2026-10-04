import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bell, Menu, X } from 'lucide-react';
import { PhoenixLogoLockup } from '../../assets/logo/PhoenixLogoLockup.jsx';
import { useAuthStore } from '../../store/slices/authStore.js';
import { Button } from '../ui/index.js';
import { LanguageSwitcher } from './LanguageSwitcher.jsx';

const DASHBOARD_PATH = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin' };

export function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-offwhite/80 backdrop-blur-lg border-b border-slate-600/10">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        <Link to="/">
          <PhoenixLogoLockup size={34} showTagline={false} />
        </Link>

        <div className="hidden md:flex items-center gap-6 font-medium text-sm text-slate-600">
          <Link to="/doctors" className="hover:text-teal-600">
            {t('nav.findDoctors')}
          </Link>
          <Link to="/#services" className="hover:text-teal-600">
            {t('nav.services')}
          </Link>
          <Link to="/blog" className="hover:text-teal-600">
            {t('nav.healthBlog')}
          </Link>
          {user && (
            <Link to={DASHBOARD_PATH[user.role]} className="hover:text-teal-600">
              {t('nav.dashboard')}
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <>
              <button aria-label="Notifications" className="relative rounded-full p-2 hover:bg-slate-600/10">
                <Bell size={20} className="text-slate-600" />
              </button>
              <span className="text-sm font-medium text-charcoal">{user.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                {t('nav.login')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                {t('nav.signup')}
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {menuOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden px-4 pb-4 flex flex-col gap-3 bg-offwhite border-t border-slate-600/10"
        >
          <Link to="/doctors" onClick={() => setMenuOpen(false)}>
            {t('nav.findDoctors')}
          </Link>
          <Link to="/#services" onClick={() => setMenuOpen(false)}>
            {t('nav.services')}
          </Link>
          <Link to="/blog" onClick={() => setMenuOpen(false)}>
            {t('nav.healthBlog')}
          </Link>
          <LanguageSwitcher variant="mobile" />
          {user ? (
            <>
              <Link to={DASHBOARD_PATH[user.role]} onClick={() => setMenuOpen(false)}>
                {t('nav.dashboard')}
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                {t('nav.login')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                {t('nav.signup')}
              </Button>
            </>
          )}
        </motion.div>
      )}
    </header>
  );
}
