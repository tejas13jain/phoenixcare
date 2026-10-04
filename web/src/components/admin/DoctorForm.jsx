import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Input } from '../ui/index.js';
import { adminApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { SPECIALTIES } from '../../constants/specialties.js';
import { ChoiceChip, FieldError, FieldLabel, FormSection, Select, TextArea, Toggle, fieldErrorsFrom, splitList } from './FormControls.jsx';

const MODES = [
  { key: 'video', label: 'Video' },
  { key: 'audio', label: 'Audio' },
  { key: 'chat', label: 'Chat' },
  { key: 'in_clinic', label: 'In clinic' },
];

const KYC_OPTIONS = [
  { value: 'verified', label: 'Verified — visible to patients now' },
  { value: 'under_review', label: 'Under review — hidden until verified' },
  { value: 'pending', label: 'Pending — hidden until documents are uploaded and approved' },
  { value: 'rejected', label: 'Rejected' },
];

function initialState(doctor) {
  return {
    name: doctor?.user?.name || '',
    email: doctor?.user?.email || '',
    phone: doctor?.user?.phone || '',
    specialties: doctor?.specialties || [],
    registrationNumber: doctor?.registrationNumber?.startsWith('PENDING-') ? '' : doctor?.registrationNumber || '',
    registrationCouncil: doctor?.registrationCouncil || '',
    qualifications: (doctor?.qualifications || []).join(', '),
    experienceYears: doctor?.experienceYears ?? '',
    languages: (doctor?.languages || ['English']).join(', '),
    consultationModes: doctor?.consultationModes?.length ? doctor.consultationModes : ['video'],
    fee: {
      video: doctor?.fee?.video ?? '',
      audio: doctor?.fee?.audio ?? '',
      chat: doctor?.fee?.chat ?? '',
      in_clinic: doctor?.fee?.in_clinic ?? '',
    },
    city: doctor?.city || '',
    clinicAddress: doctor?.clinicAddress || '',
    bio: doctor?.bio || '',
    kycStatus: doctor?.kycStatus || 'pending',
    isFeatured: doctor?.isFeatured ?? false,
    isAcceptingNewPatients: doctor?.isAcceptingNewPatients ?? true,
  };
}

// Onboard a new doctor (creates their login) or edit an existing one.
export function DoctorForm({ doctor, onSaved, onCancel }) {
  const isEdit = !!doctor;
  const [form, setForm] = useState(() => initialState(doctor));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };
  const toggleIn = (field, value) =>
    set(field, form[field].includes(value) ? form[field].filter((v) => v !== value) : [...form[field], value]);

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter the doctor’s full name';
    if (!isEdit && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email';
    if (!isEdit && !/^\+?[1-9]\d{7,14}$/.test(form.phone.replace(/[\s-]/g, ''))) next.phone = 'Enter a valid phone with country code';
    if (!form.specialties.length) next.specialties = 'Choose at least one specialty';
    if (form.registrationNumber.trim().length < 3) next.registrationNumber = 'Registration number is required';
    if (!form.consultationModes.length) next.consultationModes = 'Choose at least one mode';
    for (const m of form.consultationModes) {
      if (form.fee[m] === '' || Number(form.fee[m]) < 0) next[`fee.${m}`] = 'Enter a fee';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      specialties: form.specialties,
      registrationNumber: form.registrationNumber.trim(),
      registrationCouncil: form.registrationCouncil.trim(),
      qualifications: splitList(form.qualifications),
      experienceYears: Number(form.experienceYears) || 0,
      languages: splitList(form.languages),
      consultationModes: form.consultationModes,
      // Only send fees for the modes the doctor actually offers.
      fee: Object.fromEntries(form.consultationModes.map((m) => [m, Number(form.fee[m]) || 0])),
      city: form.city.trim(),
      clinicAddress: form.clinicAddress.trim(),
      bio: form.bio.trim(),
      kycStatus: form.kycStatus,
      isFeatured: form.isFeatured,
      isAcceptingNewPatients: form.isAcceptingNewPatients,
    };
    if (!isEdit) Object.assign(payload, { email: form.email.trim(), phone: form.phone.trim() });

    setSaving(true);
    try {
      const res = isEdit ? await adminApi.updateDoctor(doctor._id, payload) : await adminApi.createDoctor(payload);
      toast.success(res.message);
      onSaved(res.data);
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      <FormSection title="Account">
        <Input name="name" label="Full name" placeholder="e.g. Priya Nair" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="email"
            type="email"
            label="Email (used to sign in)"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
            disabled={isEdit}
          />
          <Input
            name="phone"
            type="tel"
            label="Phone with country code"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            error={errors.phone}
            disabled={isEdit}
          />
        </div>
        {!isEdit && (
          <p className="text-xs text-slate-600">
            A temporary password is created automatically and emailed to the doctor. After signing in, they accept the terms and upload their
            verification documents; you review them under Documents, then verify.
          </p>
        )}
      </FormSection>

      <FormSection title="Credentials">
        <div>
          <FieldLabel>Specialties</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => (
              <ChoiceChip key={s.name} selected={form.specialties.includes(s.name)} onClick={() => toggleIn('specialties', s.name)}>
                {s.name}
              </ChoiceChip>
            ))}
          </div>
          <FieldError>{errors.specialties}</FieldError>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="registrationNumber"
            label="Medical registration no."
            value={form.registrationNumber}
            onChange={(e) => set('registrationNumber', e.target.value)}
            error={errors.registrationNumber}
          />
          <Input
            name="registrationCouncil"
            label="Registration council"
            placeholder="e.g. Karnataka Medical Council"
            value={form.registrationCouncil}
            onChange={(e) => set('registrationCouncil', e.target.value)}
          />
          <Input
            name="qualifications"
            label="Qualifications (comma separated)"
            placeholder="MBBS, MD Pediatrics"
            value={form.qualifications}
            onChange={(e) => set('qualifications', e.target.value)}
          />
          <Input
            name="experienceYears"
            type="number"
            min="0"
            label="Years of experience"
            value={form.experienceYears}
            onChange={(e) => set('experienceYears', e.target.value)}
            error={errors.experienceYears}
          />
        </div>
        <Select
          id="kycStatus"
          label="Verification status"
          value={form.kycStatus}
          onChange={(e) => set('kycStatus', e.target.value)}
        >
          {KYC_OPTIONS.filter((o) => isEdit || o.value !== 'verified').map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormSection>

      <FormSection title="Consultations & fees">
        <div>
          <FieldLabel>Consultation modes</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <ChoiceChip key={m.key} selected={form.consultationModes.includes(m.key)} onClick={() => toggleIn('consultationModes', m.key)}>
                {m.label}
              </ChoiceChip>
            ))}
          </div>
          <FieldError>{errors.consultationModes}</FieldError>
        </div>
        {form.consultationModes.length > 0 && (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            {MODES.filter((m) => form.consultationModes.includes(m.key)).map((m) => (
              <Input
                key={m.key}
                name={`fee-${m.key}`}
                type="number"
                min="0"
                label={`${m.label} fee (₹)`}
                value={form.fee[m.key]}
                onChange={(e) => {
                  setForm((f) => ({ ...f, fee: { ...f.fee, [m.key]: e.target.value } }));
                  setErrors((er) => ({ ...er, [`fee.${m.key}`]: undefined }));
                }}
                error={errors[`fee.${m.key}`]}
              />
            ))}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="languages" label="Languages (comma separated)" value={form.languages} onChange={(e) => set('languages', e.target.value)} />
          <Input name="city" label="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <Input name="clinicAddress" label="Clinic address (for in-clinic visits)" value={form.clinicAddress} onChange={(e) => set('clinicAddress', e.target.value)} />
        <TextArea id="bio" label="Short bio" hint="shown on the doctor’s profile" rows={3} maxLength={2000} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
      </FormSection>

      <FormSection title="Visibility">
        <Toggle
          checked={form.isAcceptingNewPatients}
          onChange={(v) => set('isAcceptingNewPatients', v)}
          label="Accepting new patients"
          description="Turn off to hide the doctor from search without removing them."
        />
        <Toggle checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} label="Feature on the home page" description="Shown in “Top-rated doctors”." />
      </FormSection>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-600/10">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEdit ? 'Save changes' : 'Onboard doctor'}
        </Button>
      </div>
    </form>
  );
}
