import { useEffect, useState } from 'react';
import { readinessService } from '../../services/readiness.service';
import { MistakeLog } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AlertTriangle, RotateCcw, BookOpen } from 'lucide-react';

export function MistakeAnalysis() {
  const [mistakes, setMistakes] = useState<MistakeLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMistakes();
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

  if (loading && page === 1) return <LoadingSpinner message="Loading mistake analysis..." />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mistake Analysis</h1>
        <p className="text-gray-500 mt-1">Track and review your incorrect answers to improve</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Total Mistakes</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500">Repeated Mistakes</p>
              <p className="text-2xl font-bold text-gray-900">
                {mistakes.filter((m) => m.mistakeCount > 1).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Topics Affected</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(mistakes.map((m) => m.question.topic)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mistakes list */}
      {mistakes.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No mistakes recorded yet. Start practicing to track your progress!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.map((mistake) => (
            <div key={mistake.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium line-clamp-2">
                    {mistake.question.questionText}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="badge-info">{mistake.question.topic}</span>
                    <span className="badge">{mistake.question.difficulty}</span>
                    <span className="text-xs text-gray-500">
                      {mistake.question.certification?.name}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-bold ${
                    mistake.mistakeCount >= 3 ? 'text-red-600' : mistake.mistakeCount >= 2 ? 'text-orange-600' : 'text-yellow-600'
                  }`}>
                    {mistake.mistakeCount}x
                  </div>
                  <p className="text-xs text-gray-500">mistakes</p>
                </div>
              </div>
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
