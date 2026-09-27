import { useNavigate } from 'react-router-dom';
import { Star, Languages, IndianRupee } from 'lucide-react';
import { Card, Badge, Button } from './ui/index.js';

export function DoctorCard({ doctor }) {
  const navigate = useNavigate();
  const initials = doctor.user?.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <Card hoverLift className="flex flex-col gap-3 cursor-pointer" onClick={() => navigate(`/doctors/${doctor._id}`)}>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-phoenix-gradient text-white flex items-center justify-center font-heading font-semibold">
          {doctor.user?.avatarUrl ? (
            <img src={doctor.user.avatarUrl} alt={doctor.user.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div>
          <h3 className="font-heading font-semibold text-charcoal">{doctor.user?.name}</h3>
          <p className="text-xs text-slate-600">{doctor.specialties?.join(', ')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <Star size={14} className="text-warning fill-warning" /> {doctor.rating?.toFixed(1)} ({doctor.ratingCount})
        </span>
        <span>{doctor.experienceYears}+ yrs exp</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-600">
        <Languages size={14} /> {doctor.languages?.slice(0, 2).join(', ')}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-600/10">
        <Badge variant="teal" className="flex items-center">
          <IndianRupee size={12} />
          {doctor.fee?.video} video
        </Badge>
        <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/doctors/${doctor._id}`); }}>
          Book now
        </Button>
      </div>
    </Card>
  );
}
