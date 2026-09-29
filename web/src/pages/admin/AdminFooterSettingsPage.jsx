import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Eye } from 'lucide-react';
import { Card, Button, Input, Skeleton } from '../../components/ui/index.js';
import { settingsApi } from '../../api/settingsApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { FOOTER_ICON_NAMES, getFooterIcon } from '../../constants/footerIcons.js';

export function AdminFooterSettingsPage() {
  const [form, setForm] = useState(undefined);
  const [saving, setSaving] = useState(false);

  const load = () => {
    settingsApi
      .getFooter()
      .then((res) => setForm(res.data.footer))
      .catch((err) => toast.error(extractErrorMessage(err)));
  };

  useEffect(load, []);

  if (form === undefined) return <Skeleton className="h-96 w-full" />;

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateBadge = (i, key, value) =>
    setForm((f) => ({ ...f, trustBadges: f.trustBadges.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)) }));
  const addBadge = () =>
    setForm((f) => ({ ...f, trustBadges: [...(f.trustBadges || []), { icon: FOOTER_ICON_NAMES[0], label: '' }] }));
  const removeBadge = (i) => setForm((f) => ({ ...f, trustBadges: f.trustBadges.filter((_, idx) => idx !== i) }));

  const updateColumnTitle = (i, title) =>
    setForm((f) => ({ ...f, columns: f.columns.map((c, idx) => (idx === i ? { ...c, title } : c)) }));
  const addColumn = () => setForm((f) => ({ ...f, columns: [...(f.columns || []), { title: 'New column', links: [] }] }));
  const removeColumn = (i) => setForm((f) => ({ ...f, columns: f.columns.filter((_, idx) => idx !== i) }));

  const updateLink = (colIndex, linkIndex, key, value) =>
    setForm((f) => ({
      ...f,
      columns: f.columns.map((c, idx) =>
        idx === colIndex
          ? { ...c, links: c.links.map((l, j) => (j === linkIndex ? { ...l, [key]: value } : l)) }
          : c
      ),
    }));
  const addLink = (colIndex) =>
    setForm((f) => ({
      ...f,
      columns: f.columns.map((c, idx) => (idx === colIndex ? { ...c, links: [...c.links, { label: '', url: '' }] } : c)),
    }));
  const removeLink = (colIndex, linkIndex) =>
    setForm((f) => ({
      ...f,
      columns: f.columns.map((c, idx) =>
        idx === colIndex ? { ...c, links: c.links.filter((_, j) => j !== linkIndex) } : c
      ),
    }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        tagline: form.tagline,
        description: form.description,
        copyrightText: form.copyrightText,
        trustBadges: (form.trustBadges || []).filter((b) => b.label.trim()),
        columns: (form.columns || [])
          .filter((c) => c.title.trim())
          .map((c) => ({ ...c, links: c.links.filter((l) => l.label.trim() && l.url.trim()) })),
      };
      const res = await settingsApi.updateFooter(payload);
      setForm(res.data.footer);
      toast.success('Footer updated — live on the site now');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-semibold text-lg">Footer settings</h2>
          <p className="text-sm text-slate-600">
            Edit the site-wide footer — tagline, trust badges, link columns, and copyright.
          </p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-teal-600 hover:underline">
          <Eye size={14} /> View live site
        </a>
      </div>

      <Card className="space-y-4">
        <h3 className="font-heading font-semibold text-sm text-charcoal">Brand copy</h3>
        <Input label="Tagline" value={form.tagline || ''} onChange={(e) => updateField('tagline', e.target.value)} maxLength={120} />
        <div>
          <label className="block mb-1.5 text-sm font-medium text-charcoal">Description</label>
          <textarea
            rows={3}
            value={form.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            maxLength={500}
            className="w-full rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white"
          />
        </div>
        <Input
          label="Copyright text"
          value={form.copyrightText || ''}
          onChange={(e) => updateField('copyrightText', e.target.value)}
          maxLength={160}
        />
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-sm text-charcoal">Trust badges</h3>
          <button onClick={addBadge} className="text-xs font-medium text-teal-600 flex items-center gap-1" disabled={(form.trustBadges || []).length >= 6}>
            <Plus size={14} /> Add badge
          </button>
        </div>
        <div className="space-y-2">
          {(form.trustBadges || []).map((badge, i) => {
            const Icon = getFooterIcon(badge.icon);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="rounded-lg bg-slate-600/10 p-2 text-slate-600 shrink-0">
                  <Icon size={16} />
                </span>
                <select
                  value={badge.icon}
                  onChange={(e) => updateBadge(i, 'icon', e.target.value)}
                  className="rounded-lg border border-slate-600/20 px-2 py-2 text-xs bg-white shrink-0"
                >
                  {FOOTER_ICON_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Badge label"
                  value={badge.label}
                  onChange={(e) => updateBadge(i, 'label', e.target.value)}
                  maxLength={60}
                  className="flex-1 rounded-lg border border-slate-600/20 px-3 py-2 text-sm bg-white"
                />
                <button onClick={() => removeBadge(i)} className="text-slate-600 hover:text-error shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          {(form.trustBadges || []).length === 0 && <p className="text-xs text-slate-600">No trust badges yet.</p>}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-sm text-charcoal">Link columns</h3>
          <button onClick={addColumn} className="text-xs font-medium text-teal-600 flex items-center gap-1" disabled={(form.columns || []).length >= 6}>
            <Plus size={14} /> Add column
          </button>
        </div>
        <div className="space-y-4">
          {(form.columns || []).map((column, i) => (
            <div key={i} className="rounded-xl border border-slate-600/15 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={column.title}
                  onChange={(e) => updateColumnTitle(i, e.target.value)}
                  maxLength={60}
                  className="flex-1 rounded-lg border border-slate-600/20 px-3 py-2 text-sm font-medium bg-white"
                />
                <button onClick={() => removeColumn(i)} className="text-slate-600 hover:text-error shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="space-y-1.5 pl-2">
                {column.links.map((link, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => updateLink(i, j, 'label', e.target.value)}
                      className="flex-1 rounded-lg border border-slate-600/20 px-2.5 py-1.5 text-xs bg-white"
                    />
                    <input
                      placeholder="URL (e.g. /doctors)"
                      value={link.url}
                      onChange={(e) => updateLink(i, j, 'url', e.target.value)}
                      className="flex-1 rounded-lg border border-slate-600/20 px-2.5 py-1.5 text-xs bg-white"
                    />
                    <button onClick={() => removeLink(i, j)} className="text-slate-600 hover:text-error shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addLink(i)} className="text-xs font-medium text-teal-600 flex items-center gap-1">
                  <Plus size={12} /> Add link
                </button>
              </div>
            </div>
          ))}
          {(form.columns || []).length === 0 && <p className="text-xs text-slate-600">No link columns yet.</p>}
        </div>
      </Card>

      <Button onClick={save} loading={saving} className="w-full sm:w-auto">
        <Save size={16} /> Save footer
      </Button>
    </div>
  );
}
