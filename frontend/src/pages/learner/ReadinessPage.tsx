import { useEffect, useState } from 'react';
import { readinessService } from '../../services/readiness.service';
import { certificationService } from '../../services/certification.service';
import { ReadinessScore, ReadinessHistory, TopicAccuracy, Certification } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Target, TrendingUp, Brain, Clock, RefreshCw } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function ReadinessPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedCertId, setSelectedCertId] = useState('');
  const [score, setScore] = useState<ReadinessScore | null>(null);
  const [history, setHistory] = useState<ReadinessHistory[]>([]);
  const [topicAccuracy, setTopicAccuracy] = useState<TopicAccuracy[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    certificationService.getAll().then((certs) => {
      setCertifications(certs);
    });
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCertId]);

  const loadData = async () => {
    try {
      const certId = selectedCertId || undefined;
      const [hist, topics] = await Promise.all([
        readinessService.getHistory(certId),
        readinessService.getTopicAccuracy(certId),
      ]);
      setHistory(hist);
      setTopicAccuracy(topics);

      if (hist.length > 0) {
        setScore({
          finalScore: hist[0].score,
          status: hist[0].status,
          avgScore: 0,
          trendGrowth: 0,
          topicMastery: 0,
          timeEfficiency: 0,
        });
      } else {
        setScore(null);
      }
    } catch (err) {
      console.error('Failed to load readiness data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const certId = selectedCertId || undefined;
      const newScore = await readinessService.calculate(certId);
      setScore(newScore);
      const hist = await readinessService.getHistory(certId);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to calculate readiness:', err);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading readiness data..." />;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exam_ready': return { bg: '#10b981', text: 'text-green-700', label: 'Exam Ready' };
      case 'almost_ready': return { bg: '#3b82f6', text: 'text-blue-700', label: 'Almost Ready' };
      case 'needs_improvement': return { bg: '#f59e0b', text: 'text-yellow-700', label: 'Needs Improvement' };
      default: return { bg: '#ef4444', text: 'text-red-700', label: 'Not Ready' };
    }
  };

  const statusInfo = score ? getStatusColor(score.status) : getStatusColor('not_ready');
  const gaugeData = [{ name: 'score', value: score?.finalScore || 0, fill: statusInfo.bg }];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Readiness Score</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Your exam preparation readiness assessment</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCertId}
            onChange={(e) => setSelectedCertId(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All Certifications</option>
            {certifications.map((cert) => (
              <option key={cert.id} value={cert.id}>{cert.name}</option>
            ))}
          </select>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Calculating...' : 'Calculate Score'}
          </button>
        </div>
      </div>

      {/* Main Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card col-span-1 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              barSize={20}
              data={gaugeData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar background dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="-mt-16 text-center">
            <p className="text-4xl font-bold text-gray-900">{score?.finalScore || 0}</p>
            <p className="text-sm text-gray-500">out of 100</p>
            <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${statusInfo.text} bg-opacity-10`}
                  style={{ backgroundColor: `${statusInfo.bg}20` }}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="card col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h2>
          <p className="text-xs text-gray-500 mb-4">
            readiness = (0.4 x avg_score) + (0.2 x trend) + (0.2 x topic_mastery) + (0.2 x time_efficiency)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Avg Score (40%)</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{score?.avgScore || 0}</p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(score?.avgScore || 0, 100)}%` }} />
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Trend Growth (20%)</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{score?.trendGrowth || 0}</p>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(score?.trendGrowth || 0, 100)}%` }} />
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Topic Mastery (20%)</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{score?.topicMastery || 0}</p>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(score?.topicMastery || 0, 100)}%` }} />
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Time Efficiency (20%)</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{score?.timeEfficiency || 0}</p>
              <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${Math.min(score?.timeEfficiency || 0, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Accuracy Chart */}
      {topicAccuracy.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Topic Accuracy</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topicAccuracy.slice(0, 15)} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Score History</h2>
          <div className="space-y-2">
            {history.map((h) => {
              const info = getStatusColor(h.status);
              return (
                <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                         style={{ backgroundColor: info.bg }}>
                      {h.score}
                    </div>
                    <span className={`text-sm font-medium ${info.text}`}>{info.label}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(h.calculatedAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
