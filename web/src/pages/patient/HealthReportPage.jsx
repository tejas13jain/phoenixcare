import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { Droplet, Moon, Footprints, Smile, Scale, HeartPulse } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Badge, Skeleton, Button } from '../../components/ui/index.js';
import { wellnessApi } from '../../api/pushApi.js';
import { extractErrorMessage } from '../../api/client.js';

const RANGE_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

export function HealthReportPage() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(undefined);

  useEffect(() => {
    setReport(undefined);
    wellnessApi
      .getHealthReport(days)
      .then((res) => setReport(res.data))
      .catch((err) => toast.error(extractErrorMessage(err)));
  }, [days]);

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-heading font-bold text-2xl">My health report</h1>
          <div className="flex gap-2">
            {RANGE_OPTIONS.map((o) => (
              <Button key={o.value} size="sm" variant={days === o.value ? 'primary' : 'outline'} onClick={() => setDays(o.value)}>
                {o.label}
              </Button>
            ))}
          </div>
        </div>

        {report === undefined ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <>
            <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatTile icon={Droplet} label="Avg glasses/day" value={report.summary.avgGlasses ?? '—'} />
              <StatTile icon={Moon} label="Avg sleep (h)" value={report.summary.avgSleepHours ?? '—'} />
              <StatTile icon={Footprints} label="Avg steps/day" value={report.summary.avgSteps ?? '—'} />
              <StatTile icon={Smile} label="Avg mood" value={report.summary.avgMoodScore ? `${report.summary.avgMoodScore}/5` : '—'} />
              <StatTile
                icon={Scale}
                label="Weight change"
                value={report.summary.weightChange != null ? `${report.summary.weightChange > 0 ? '+' : ''}${report.summary.weightChange}kg` : '—'}
              />
              <StatTile icon={HeartPulse} label="Days logged" value={report.summary.loggedDaysCount} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <h2 className="font-heading font-semibold mb-4">Sleep trend</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={report.series.sleep}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#44586622" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="hours" stroke="#0F6E6A" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h2 className="font-heading font-semibold mb-4">Steps trend</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={report.series.activity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#44586622" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="steps" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h2 className="font-heading font-semibold mb-4">Water intake</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={report.series.water}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#44586622" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="glasses" stroke="#2C8FEA" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h2 className="font-heading font-semibold mb-4">Weight trend</h2>
                {report.series.weight.length < 2 ? (
                  <p className="text-sm text-slate-600">Log your weight on a few more days to see a trend.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={report.series.weight}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#44586622" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="#FF9466" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {report.series.mood.length > 0 && (
              <Card>
                <h2 className="font-heading font-semibold mb-4">Mood log</h2>
                <div className="flex flex-wrap gap-2">
                  {report.series.mood.map((m) => (
                    <Badge key={m.date} variant="teal">
                      {m.date}: {m.mood}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <Card className="text-center py-4">
      <Icon size={18} className="mx-auto text-teal-600 mb-1.5" />
      <p className="font-heading font-bold text-lg">{value}</p>
      <p className="text-[10px] text-slate-600">{label}</p>
    </Card>
  );
}
