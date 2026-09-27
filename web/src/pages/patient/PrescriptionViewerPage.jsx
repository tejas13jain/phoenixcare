import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Pill, FlaskConical, Stethoscope } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Badge, Button, Skeleton } from '../../components/ui/index.js';
import { prescriptionApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';

export function PrescriptionViewerPage() {
  const { appointmentId } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    prescriptionApi
      .getByAppointment(appointmentId)
      .then((res) => setPrescription(res.data.prescription))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (!prescription) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-slate-600">No prescription found.</div>;
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading font-bold text-xl">Digital Prescription</h1>
            {prescription.pdfUrl && (
              <a href={prescription.pdfUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">
                  <Download size={16} className="mr-1" /> Download PDF
                </Button>
              </a>
            )}
          </div>

          {prescription.diagnosis?.length > 0 && (
            <Section icon={Stethoscope} title="Diagnosis">
              <div className="flex flex-wrap gap-2">
                {prescription.diagnosis.map((d) => (
                  <Badge key={d} variant="teal">
                    {d}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {prescription.medicines?.length > 0 && (
            <Section icon={Pill} title="Medicines">
              <div className="space-y-2">
                {prescription.medicines.map((m, i) => (
                  <div key={i} className="rounded-xl bg-slate-600/5 p-3 text-sm">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-slate-600">
                      {m.dosage} · {m.frequency} · {m.durationDays} day(s)
                    </p>
                    {m.instructions && <p className="text-xs text-slate-600 mt-1">{m.instructions}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {prescription.labTestsAdvised?.length > 0 && (
            <Section icon={FlaskConical} title="Lab tests advised">
              <div className="flex flex-wrap gap-2">
                {prescription.labTestsAdvised.map((t) => (
                  <Badge key={t} variant="sunrise">
                    {t}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {prescription.advice && (
            <Section title="Advice">
              <p className="text-sm text-charcoal">{prescription.advice}</p>
            </Section>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-charcoal mb-2">
        {Icon && <Icon size={16} className="text-teal-600" />} {title}
      </h3>
      {children}
    </div>
  );
}
