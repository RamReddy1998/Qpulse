import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { LearnerAnalytics, User, Question } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BarChart3, Clock, Target, BookOpen, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export function AnalyticsPage() {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId');

  const [learners, setLearners] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(userIdParam || '');
  const [analytics, setAnalytics] = useState<LearnerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [topicQuestions, setTopicQuestions] = useState<Record<string, Question[]>>({});
  const [loadingTopicQs, setLoadingTopicQs] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .getLearners(1, 100)
      .then((data) => {
        setLearners(data.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadAnalytics(selectedUserId);
    }
  }, [selectedUserId]);

  const loadAnalytics = async (userId: string) => {
    setLoadingAnalytics(true);
    try {
      const data = await adminService.getLearnerAnalytics(userId);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleToggleTopic = async (topic: string) => {
    if (expandedTopic === topic) {
      setExpandedTopic(null);
      return;
    }
    setExpandedTopic(topic);
    if (!topicQuestions[topic]) {
      setLoadingTopicQs(topic);
      try {
        const qs = await adminService.getWeaknessQuestions(topic);
        setTopicQuestions((prev) => ({ ...prev, [topic]: qs }));
      } catch (err) {
        console.error('Failed to load topic questions:', err);
      } finally {
        setLoadingTopicQs(null);
      }
    }
  };

  if (loading) return <LoadingSpinner message="Loading..." />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Learner Analytics</h1>
        <p className="text-gray-500 mt-1">Detailed performance analytics per learner</p>
      </div>

      {/* Learner selector */}
      <div className="mb-6">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="input-field max-w-md"
        >
          <option value="">Select a learner</option>
          {learners.map((l) => (
            <option key={l.id} value={l.id}>{l.username}</option>
          ))}
        </select>
      </div>

      {loadingAnalytics ? (
        <LoadingSpinner message="Loading analytics..." />
      ) : analytics ? (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Time</p>
                  <p className="text-xl font-bold text-gray-900">{formatTime(analytics.totalTimeSec)}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Attempts</p>
                  <p className="text-xl font-bold text-gray-900">{analytics.totalAttempts}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Mock Tests</p>
                  <p className="text-xl font-bold text-gray-900">{analytics.mockTestCount}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Readiness</p>
                  <p className="text-xl font-bold text-gray-900">{analytics.readinessScore}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Accuracy Chart */}
          {analytics.topicAccuracy.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Topic Engagement & Accuracy</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topicAccuracy.slice(0, 12)} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weak Topics - Clickable with question display */}
          {analytics.weakTopics.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Weakness Detection
              </h2>
              <div className="space-y-3">
                {analytics.weakTopics.map((topic, i) => (
                  <div key={i}>
                    <button
                      onClick={() => handleToggleTopic(topic.topic)}
                      className={`w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ${
                        expandedTopic === topic.topic ? 'rounded-b-none' : ''
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{topic.topic}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{topic.count} questions affected</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">{topic.totalMistakes}</p>
                          <p className="text-xs text-red-500">total mistakes</p>
                        </div>
                        {expandedTopic === topic.topic ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    {expandedTopic === topic.topic && (
                      <div className="border border-t-0 border-red-200 dark:border-red-800 rounded-b-lg p-3 space-y-2">
                        {loadingTopicQs === topic.topic ? (
                          <LoadingSpinner message="Loading questions..." />
                        ) : topicQuestions[topic.topic]?.length ? (
                          topicQuestions[topic.topic].map((q, qi) => (
                            <div key={q.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                              <p className="text-gray-900 dark:text-white font-medium">{qi + 1}. {q.questionText}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-xs text-gray-500">{q.difficulty}</span>
                                <span className="text-xs text-gray-400">{q.topic}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400 text-center py-2">No questions found for this topic</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p>Select a learner to view their analytics</p>
        </div>
      )}
    </div>
  );
}
