import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '../ui/index.js';
import { adminLabApi } from '../../api/labApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { LAB_ACCREDITATIONS, LAB_TEST_CATEGORIES } from '../../constants/labs.js';
import { ChoiceChip, FieldLabel, FormSection, TextArea, Toggle, fieldErrorsFrom } from './FormControls.jsx';

const emptyTest = () => ({
  name: '',
  category: 'blood',
  price: '',
  offerPrice: '',
  sampleType: '',
  preparation: '',
  reportHours: 24,
  homeCollection: true,
});

function initialState(lab) {
  return {
    name: lab?.name || '',
    licenseNumber: lab?.licenseNumber || '',
    accreditations: lab?.accreditations || [],
    contactPerson: lab?.contactPerson || '',
    email: lab?.email || '',
    phone: lab?.phone || '',
    address: lab?.address || '',
    city: lab?.city || '',
    pincode: lab?.pincode || '',
    operatingHours: lab?.operatingHours || '',
    homeCollection: lab?.homeCollection ?? true,
    homeCollectionFee: lab?.homeCollectionFee ?? 0,
    description: lab?.description || '',
    status: lab?.status || 'active',
    tests: lab?.tests?.length
      ? lab.tests.map((t) => ({ ...emptyTest(), ...t, offerPrice: t.offerPrice ?? '' }))
      : [emptyTest()],
  };
}

const CELL = 'w-full rounded-lg border border-slate-600/20 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40';

// Onboard a diagnostic lab with its test menu, or edit an existing one.
export function LabForm({ lab, onSaved, onCancel }) {
  const isEdit = !!lab;
  const [form, setForm] = useState(() => initialState(lab));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };
  const setTest = (i, field, value) => {
    setForm((f) => ({ ...f, tests: f.tests.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)) }));
    setErrors((e) => ({ ...e, [`tests.${i}.${field}`]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Lab name is required';
    if (form.licenseNumber.trim().length < 3) next.licenseNumber = 'License number is required';
    if (!/^\+?\d{8,15}$/.test(form.phone.replace(/[\s-]/g, ''))) next.phone = 'Enter a valid phone number';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email';
    if (form.address.trim().length < 5) next.address = 'Address is required';
    if (form.city.trim().length < 2) next.city = 'City is required';
    form.tests.forEach((t, i) => {
      if (t.name.trim().length < 2) next[`tests.${i}.name`] = 'Name required';
      if (t.price === '' || Number(t.price) < 0) next[`tests.${i}.price`] = 'Price required';
      if (t.offerPrice !== '' && Number(t.offerPrice) > Number(t.price)) next[`tests.${i}.offerPrice`] = 'Above price';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      homeCollectionFee: Number(form.homeCollectionFee) || 0,
      tests: form.tests.map((t) => ({
        ...(t._id && { _id: t._id }),
        name: t.name.trim(),
        category: t.category,
        price: Number(t.price),
        offerPrice: t.offerPrice === '' ? null : Number(t.offerPrice),
        sampleType: t.sampleType.trim(),
        preparation: t.preparation.trim(),
        reportHours: Number(t.reportHours) || 0,
        homeCollection: form.homeCollection && t.homeCollection,
      })),
    };

    setSaving(true);
    try {
      const res = isEdit ? await adminLabApi.update(lab._id, payload) : await adminLabApi.create(payload);
      toast.success(res.message);
      onSaved(res.data.lab);
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      <FormSection title="Lab details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="name" label="Lab name" placeholder="e.g. Sunrise Diagnostics" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
          <Input name="licenseNumber" label="License / registration no." value={form.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} error={errors.licenseNumber} />
        </div>
        <div>
          <FieldLabel>Accreditations</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {LAB_ACCREDITATIONS.map((a) => (
              <ChoiceChip
                key={a}
                selected={form.accreditations.includes(a)}
                onClick={() =>
                  set('accreditations', form.accreditations.includes(a) ? form.accreditations.filter((x) => x !== a) : [...form.accreditations, a])
                }
              >
                {a}
              </ChoiceChip>
            ))}
          </div>
        </div>
        <TextArea id="description" label="About the lab" hint="shown to patients" rows={2} maxLength={1000} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </FormSection>

      <FormSection title="Contact & location">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input name="contactPerson" label="Contact person" value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} />
          <Input name="phone" type="tel" label="Phone (shown to patients)" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
          <Input name="email" type="email" label="Email (internal)" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
        </div>
        <Input name="address" label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} error={errors.address} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input name="city" label="City" value={form.city} onChange={(e) => set('city', e.target.value)} error={errors.city} />
          <Input name="pincode" label="PIN code" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
          <Input name="operatingHours" label="Timings" placeholder="Mon–Sat, 7am–8pm" value={form.operatingHours} onChange={(e) => set('operatingHours', e.target.value)} />
        </div>
      </FormSection>

      <FormSection title="Home sample collection">
        <Toggle checked={form.homeCollection} onChange={(v) => set('homeCollection', v)} label="Offers home sample collection" />
        {form.homeCollection && (
          <div className="max-w-xs">
            <Input name="homeCollectionFee" type="number" min="0" label="Collection fee (₹, 0 = free)" value={form.homeCollectionFee} onChange={(e) => set('homeCollectionFee', e.target.value)} />
          </div>
        )}
      </FormSection>

      <FormSection title={`Tests offered (${form.tests.length})`}>
        <div className="space-y-3">
          {form.tests.map((t, i) => (
            <div key={t._id || i} className="rounded-xl border border-slate-600/15 bg-offwhite p-3">
              <div className="grid gap-2 sm:grid-cols-[2fr_1.2fr_0.8fr_0.8fr_auto] items-start">
                <div>
                  <input aria-label="Test name" placeholder="Test name, e.g. CBC" value={t.name} onChange={(e) => setTest(i, 'name', e.target.value)} className={CELL} />
                  {errors[`tests.${i}.name`] && <p className="mt-0.5 text-xs text-error">{errors[`tests.${i}.name`]}</p>}
                </div>
                <select aria-label="Category" value={t.category} onChange={(e) => setTest(i, 'category', e.target.value)} className={CELL}>
                  {LAB_TEST_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div>
                  <input aria-label="Price" type="number" min="0" placeholder="Price ₹" value={t.price} onChange={(e) => setTest(i, 'price', e.target.value)} className={CELL} />
                  {errors[`tests.${i}.price`] && <p className="mt-0.5 text-xs text-error">{errors[`tests.${i}.price`]}</p>}
                </div>
                <div>
                  <input aria-label="Offer price" type="number" min="0" placeholder="Offer ₹" value={t.offerPrice} onChange={(e) => setTest(i, 'offerPrice', e.target.value)} className={CELL} />
                  {errors[`tests.${i}.offerPrice`] && <p className="mt-0.5 text-xs text-error">{errors[`tests.${i}.offerPrice`]}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tests: f.tests.filter((_, idx) => idx !== i) }))}
                  aria-label={`Remove ${t.name || 'test'}`}
                  className="justify-self-end rounded-lg p-2 text-slate-600 hover:bg-error/10 hover:text-error"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_2fr_0.8fr]">
                <input aria-label="Sample type" placeholder="Sample (blood, urine…)" value={t.sampleType} onChange={(e) => setTest(i, 'sampleType', e.target.value)} className={CELL} />
                <input aria-label="Preparation" placeholder="Preparation, e.g. 10–12 hrs fasting" value={t.preparation} onChange={(e) => setTest(i, 'preparation', e.target.value)} className={CELL} />
                <input aria-label="Report time in hours" type="number" min="0" placeholder="Report in (hrs)" value={t.reportHours} onChange={(e) => setTest(i, 'reportHours', e.target.value)} className={CELL} />
              </div>
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, tests: [...f.tests, emptyTest()] }))}>
          <Plus size={14} /> Add test
        </Button>
      </FormSection>

      <FormSection title="Visibility">
        <Toggle
          checked={form.status === 'active'}
          onChange={(v) => set('status', v ? 'active' : 'inactive')}
          label="Active — visible to patients"
          description="Turn off to hide the lab from patients without deleting it."
        />
      </FormSection>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-600/10">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEdit ? 'Save changes' : 'Onboard lab'}
        </Button>
      </div>
    </form>
  );
}
