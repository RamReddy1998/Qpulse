import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { AdminDashboard as AdminDashboardType } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Users, UserCheck, Target, FileCheck, Calendar, BookOpen, Layers } from 'lucide-react';

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboard()
      .then(setDashboard)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading admin dashboard..." />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Learners</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.totalLearners || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Learners (7d)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.activeLearners || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ff5f2d20' }}>
              <Target className="h-6 w-6" style={{ color: '#ff5f2d' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Readiness</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.avgReadiness || 0}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <FileCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Mock Tests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.totalMocks || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Batches */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5" style={{ color: '#ff5f2d' }} />
          Today&apos;s Batches
        </h2>
        {dashboard?.todayBatches && dashboard.todayBatches.length > 0 ? (
          <div className="space-y-3">
            {dashboard.todayBatches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ backgroundColor: '#ff5f2d10', borderColor: '#ff5f2d40' }}
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{batch.batchName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {batch.certificationName} &bull; Created {new Date(batch.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" style={{ color: '#ff5f2d' }} />
                  <span className="text-sm font-medium" style={{ color: '#ff5f2d' }}>{batch.participantCount} participants</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No batches created today</p>
        )}
      </div>

      {/* Certification Sections by Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Month */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: '#ff5f2d' }} />
            Current Month Certifications
          </h2>
          {dashboard?.currentMonthCerts && dashboard.currentMonthCerts.length > 0 ? (
            <div className="space-y-3">
              {dashboard.currentMonthCerts.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{cert.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Exam: {cert.examDate ? new Date(cert.examDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">{cert.questionCount} questions</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No certifications scheduled this month</p>
          )}
        </div>

        {/* Next Month */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Next Month Certifications
          </h2>
          {dashboard?.nextMonthCerts && dashboard.nextMonthCerts.length > 0 ? (
            <div className="space-y-3">
              {dashboard.nextMonthCerts.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{cert.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Exam: {cert.examDate ? new Date(cert.examDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">{cert.questionCount} questions</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No certifications scheduled next month</p>
          )}
        </div>
      </div>
    </div>
  );
}
