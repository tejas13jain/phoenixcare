import { NavLink, Outlet } from 'react-router-dom';
import { PageTransition } from '../../components/layout/PageTransition.jsx';

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/doctors', label: 'Doctors & KYC' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/payments', label: 'Payments & Payouts' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/moderation', label: 'Moderation & Campaigns' },
];

export function AdminLayout() {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-bold text-2xl mb-6">Admin panel</h1>
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium ${
                  isActive ? 'bg-phoenix-gradient text-white' : 'bg-slate-600/10 text-slate-600'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </PageTransition>
  );
}
