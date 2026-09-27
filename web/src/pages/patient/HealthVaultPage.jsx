import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, FileText, Activity, Scan, Trash2 } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Button, Badge, Skeleton, Input } from '../../components/ui/index.js';
import { healthRecordApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';

const TYPE_META = {
  lab_report: { icon: FileText, label: 'Lab report' },
  prescription: { icon: FileText, label: 'Prescription' },
  vitals: { icon: Activity, label: 'Vitals' },
  scan: { icon: Scan, label: 'Scan' },
  other: { icon: FileText, label: 'Other' },
};

export function HealthVaultPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    healthRecordApi
      .list()
      .then((res) => setRecords(res.data.records))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Give this record a title');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', 'lab_report');
      if (file) formData.append('file', file);
      await healthRecordApi.upload(formData);
      toast.success('Record saved to your vault');
      setTitle('');
      setFile(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await healthRecordApi.remove(id);
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="font-heading font-bold text-2xl">Health vault</h1>

        <Card>
          <h2 className="font-heading font-semibold mb-3">Add a report or document</h2>
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="e.g. CBC blood test — Sept 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1"
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-teal-700"
            />
            <Button type="submit" loading={uploading}>
              <Upload size={16} className="mr-1" /> Upload
            </Button>
          </form>
        </Card>

        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : records.length === 0 ? (
          <Card className="text-center py-12 text-slate-600">No records yet — your reports and vitals will appear here.</Card>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const meta = TYPE_META[record.type] || TYPE_META.other;
              const Icon = meta.icon;
              return (
                <Card key={record._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-teal-50 p-2.5 text-teal-600">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="font-medium text-sm">{record.title}</p>
                      <Badge variant="neutral">{meta.label}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.fileUrl && (
                      <a href={record.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-600 hover:underline">
                        View
                      </a>
                    )}
                    <button onClick={() => handleDelete(record._id)} className="text-error">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
