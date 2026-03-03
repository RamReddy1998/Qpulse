import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificationService } from '../../services/certification.service';
import { readinessService } from '../../services/readiness.service';
import { mockTestService } from '../../services/mocktest.service';
import { Certification, ReadinessHistory } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BookOpen, Target, FileCheck, Clock, ChevronRight, Award } from 'lucide-react';

export function LearnerDashboard() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [readiness, setReadiness] = useState<ReadinessHistory | null>(null);
  const [mockCount, setMockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [certs, readinessData, mockHistory] = await Promise.all([
        certificationService.getAll(),
        readinessService.getLatest(),
        mockTestService.getHistory(1, 1),
      ]);
      setCertifications(certs);
      setReadiness(readinessData);
      setMockCount(mockHistory.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const totalQuestions = certifications.reduce((sum, c) => sum + (c._count?.questions || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exam_ready': return 'text-green-600 bg-green-50';
      case 'almost_ready': return 'text-blue-600 bg-blue-50';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Learner Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your certification exam preparation progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Certifications</p>
              <p className="text-2xl font-bold text-gray-900">{certifications.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FileCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mock Tests</p>
              <p className="text-2xl font-bold text-gray-900">{mockCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Readiness Score</p>
              <p className="text-2xl font-bold text-gray-900">{readiness?.score || 0}%</p>
            </div>
          </div>
          {readiness && (
            <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(readiness.status)}`}>
              {readiness.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Certifications */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Certifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <div key={cert.id} className="card hover:shadow-md transition-shadow cursor-pointer group"
                 onClick={() => navigate(`/practice?certId=${cert.id}`)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {cert.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{cert.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      {cert._count.questions} questions
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/practice')}
            className="card hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Smart Practice</h3>
                <p className="text-sm text-gray-500">Practice with AI explanations</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/mock-tests')}
            className="card hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Mock Test</h3>
                <p className="text-sm text-gray-500">Timed exam simulation</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/readiness')}
            className="card hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Readiness Check</h3>
                <p className="text-sm text-gray-500">See if you're exam-ready</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
