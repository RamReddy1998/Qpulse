import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readinessService } from '../../services/readiness.service';
import { practiceService } from '../../services/practice.service';
import { MistakeLog, AiExplanation } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AlertTriangle, RotateCcw, BookOpen, ChevronDown, ChevronUp, CheckCircle, Brain } from 'lucide-react';

export function MistakeAnalysis() {
  const [mistakes, setMistakes] = useState<MistakeLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, AiExplanation>>({});
  const [loadingExp, setLoadingExp] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMistakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadMistakes = async () => {
    setLoading(true);
    try {
      const data = await readinessService.getMistakes(page, 20);
      setMistakes(data.data);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error('Failed to load mistakes:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const loadExplanation = async (questionId: string) => {
    if (explanations[questionId]) return;
    setLoadingExp(questionId);
    try {
      const exp = await practiceService.getExplanation(questionId);
      setExplanations((prev) => ({ ...prev, [questionId]: exp }));
    } catch (err) {
      console.error('Failed to load explanation:', err);
    } finally {
      setLoadingExp(null);
    }
  };

  const handlePracticeQuestion = (questionId: string, certificationId: string) => {
    navigate(`/practice?questionId=${questionId}&certId=${certificationId}`);
  };

  if (loading && page === 1) return <LoadingSpinner message="Loading mistake analysis..." />;

  const repeatedMistakes = mistakes.filter((m) => m.mistakeCount > 1).length;
  const topicsAffected = new Set(mistakes.map((m) => m.question.topic)).size;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mistake Analysis</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track and review your incorrect answers to improve</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Mistakes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Repeated Mistakes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{repeatedMistakes}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Topics Affected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{topicsAffected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mistakes list */}
      {mistakes.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No mistakes recorded yet. Start practicing to track your progress!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.map((mistake) => (
            <div key={mistake.id} className="card cursor-pointer hover:shadow-md transition-shadow">
              <div
                onClick={() => {
                  toggleExpand(mistake.id);
                  if (expandedId !== mistake.id) loadExplanation(mistake.question.id);
                }}
                className="flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
                    {mistake.question.questionText}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="badge-info">{mistake.question.topic}</span>
                    <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{mistake.question.difficulty}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {mistake.question.certification?.name}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <div>
                    <div className={`text-lg font-bold ${
                      mistake.mistakeCount >= 3 ? 'text-red-600' : mistake.mistakeCount >= 2 ? 'text-orange-600' : 'text-yellow-600'
                    }`}>
                      {mistake.mistakeCount}x
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">mistakes</p>
                  </div>
                  {expandedId === mistake.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === mistake.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Correct answer */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Correct Answer
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Option {mistake.question.correctAnswer}: {mistake.question.options[mistake.question.correctAnswer as keyof typeof mistake.question.options]}
                    </p>
                  </div>

                  {/* All Options */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">All Options</h4>
                    <div className="space-y-1">
                      {Object.entries(mistake.question.options).map(([key, val]) => (
                        <div
                          key={key}
                          className={`text-sm p-2 rounded ${
                            key === mistake.question.correctAnswer
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <span className="font-medium">{key}:</span> {val}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Explanation */}
                  {loadingExp === mistake.question.id ? (
                    <LoadingSpinner message="Loading explanation..." />
                  ) : explanations[mistake.question.id] && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1">
                        <Brain className="h-4 w-4" /> AI Explanation
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{explanations[mistake.question.id].stepByStep}</p>
                    </div>
                  )}

                  {/* Practice button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePracticeQuestion(mistake.question.id, mistake.question.certificationId); }}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" /> Practice This Question
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
