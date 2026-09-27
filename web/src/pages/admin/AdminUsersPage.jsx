import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Skeleton, Input } from '../../components/ui/index.js';
import { adminApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi
      .listUsers({ role: role || undefined, q: q || undefined })
      .then((res) => setUsers(res.data.users))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [role]);

  const toggleActive = async (user) => {
    try {
      await adminApi.setUserActive(user._id, !user.isActive);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u)));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white"
        >
          <option value="">All roles</option>
          <option value="patient">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="admin">Admins</option>
        </select>
        <Button onClick={load}>Search</Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u._id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{u.name}</p>
                <p className="text-xs text-slate-600">
                  {u.email} · {u.phone}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="teal">{u.role}</Badge>
                <Badge variant={u.isActive ? 'success' : 'error'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
                <Button size="sm" variant={u.isActive ? 'danger' : 'outline'} onClick={() => toggleActive(u)}>
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
