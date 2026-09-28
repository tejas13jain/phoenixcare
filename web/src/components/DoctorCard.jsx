import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Languages, IndianRupee, BadgeCheck } from 'lucide-react';
import { Card, Badge, Button } from './ui/index.js';
import { getSpecialtyInfo } from '../constants/specialties.js';

export function DoctorCard({ doctor }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const initials = doctor.user?.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  const primarySpecialty = doctor.specialties?.[0];
  const specialtyInfo = primarySpecialty ? getSpecialtyInfo(primarySpecialty) : null;
  const specialtyLabel = specialtyInfo ? t(`specialty.${specialtyInfo.i18nKey}.label`) : primarySpecialty;
  const specialtyTagline = specialtyInfo ? t(`specialty.${specialtyInfo.i18nKey}.tagline`) : null;

  return (
    <Card hoverLift className="flex flex-col gap-3 cursor-pointer" onClick={() => navigate(`/doctors/${doctor._id}`)}>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-phoenix-gradient text-white flex items-center justify-center font-heading font-semibold shrink-0">
          {doctor.user?.avatarUrl ? (
            <img src={doctor.user.avatarUrl} alt={doctor.user.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-heading font-semibold text-charcoal flex items-center gap-1 truncate">
            {doctor.user?.name}
            <BadgeCheck size={15} className="text-teal-600 shrink-0" aria-label={t('doctorCard.verified')} />
          </h3>
          <p className="text-xs font-medium text-slate-700">{specialtyLabel}</p>
          {specialtyTagline && <p className="text-xs text-slate-500">{specialtyTagline}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <Star size={14} className="text-warning fill-warning" /> {doctor.rating?.toFixed(1)} ({doctor.ratingCount})
        </span>
        <span>
          {doctor.experienceYears}+ {t('doctorCard.yearsExp')}
        </span>
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
          {t('doctorCard.bookNow')}
        </Button>
      </div>
    </Card>
  );
}
