import { useEffect, useState, useCallback, useRef } from 'react';
import { certificationService } from '../../services/certification.service';
import { mockTestService } from '../../services/mocktest.service';
import { Certification, Question, MockTestResult } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Clock, ChevronRight, ChevronLeft, Flag, CheckCircle, XCircle, Minus, AlertTriangle } from 'lucide-react';

type TestState = 'select' | 'config' | 'active' | 'result' | 'history';

interface AnswerMap {
  [questionId: string]: { answer: string; timeSpent: number };
}

export function MockTestPage() {
  const [testState, setTestState] = useState<TestState>('select');
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedCertId, setSelectedCertId] = useState('');
  const [questionCount, setQuestionCount] = useState(30);
  const [mockTestId, setMockTestId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<MockTestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; mockName: string; totalScore: number; completedAt: string | null; certification?: { name: string }; certificationName?: string }>>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    Promise.all([
      certificationService.getAll(),
      mockTestService.getHistory(1, 10),
    ]).then(([certs, hist]) => {
      setCertifications(certs);
      setHistory(hist.data as typeof history);
      setLoading(false);
    });
  }, []);

  // Timer
  useEffect(() => {
    if (testState === 'active' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testState, timeLeft > 0]);

  const handleStartTest = async () => {
    setLoading(true);
    try {
      const test = await mockTestService.start(selectedCertId, questionCount);
      setMockTestId(test.mockTestId);
      setQuestions(test.questions);
      setTimeLeft(test.totalQuestions * 90); // 90 seconds per question
      setCurrentIdx(0);
      setAnswers({});
      questionStartRef.current = Date.now();
      setTestState('active');
    } catch (err) {
      console.error('Failed to start test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    const qId = questions[currentIdx].id;
    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
    setAnswers((prev) => ({
      ...prev,
      [qId]: { answer, timeSpent: (prev[qId]?.timeSpent || 0) + timeSpent },
    }));
    questionStartRef.current = Date.now();
  };

  const handleSubmitTest = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      userAnswer: answers[q.id]?.answer || '',
      timeSpentSec: answers[q.id]?.timeSpent || 0,
    }));

    try {
      const res = await mockTestService.submit(mockTestId, formattedAnswers);
      setResult(res);
      setTestState('result');
    } catch (err) {
      console.error('Failed to submit test:', err);
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions, mockTestId, submitting]);

  const handleAutoSubmit = useCallback(() => {
    handleSubmitTest();
  }, [handleSubmitTest]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingSpinner message="Loading..." />;

  // Certification selection
  if (testState === 'select') {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mock Tests</h1>
            <p className="text-gray-500 mt-1">Simulate real exam conditions</p>
          </div>
          <button onClick={() => setTestState('history')} className="btn-secondary">
            View History
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <button
              key={cert.id}
              onClick={() => { setSelectedCertId(cert.id); setTestState('config'); }}
              className="card hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                    {cert.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{cert._count.questions} questions available</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Test configuration
  if (testState === 'config') {
    const cert = certifications.find((c) => c.id === selectedCertId);
    const maxQ = Math.min(cert?._count.questions || 30, 100);

    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Configure Mock Test</h1>
        <p className="text-gray-500 mb-6">{cert?.name}</p>
        <div className="card">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
            <input
              type="range"
              min={5}
              max={maxQ}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>5</span>
              <span className="text-primary-600 font-bold text-lg">{questionCount}</span>
              <span>{maxQ}</span>
            </div>
          </div>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
            <p className="text-sm text-gray-600"><span className="font-medium">Time:</span> {formatTime(questionCount * 90)} ({questionCount * 90 / 60} min)</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Negative Marking:</span> -0.25 per wrong answer</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Auto Submit:</span> When timer runs out</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTestState('select')} className="btn-secondary flex-1">Back</button>
            <button onClick={handleStartTest} className="btn-primary flex-1">Start Test</button>
          </div>
        </div>
      </div>
    );
  }

  // Active test
  if (testState === 'active') {
    const currentQ = questions[currentIdx];
    const currentAnswer = answers[currentQ?.id]?.answer || '';

    return (
      <div>
        {/* Timer bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-8 -mt-8 px-8 py-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">
                Question {currentIdx + 1}/{questions.length}
              </span>
              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { questionStartRef.current = Date.now(); setCurrentIdx(i); }}
                    className={`w-7 h-7 rounded text-xs font-medium ${
                      i === currentIdx
                        ? 'bg-primary-600 text-white'
                        : answers[questions[i].id]
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${
                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
              <button
                onClick={handleSubmitTest}
                disabled={submitting}
                className="btn-danger flex items-center gap-2 text-sm"
              >
                <Flag className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>

        {/* Question */}
        {currentQ && (
          <div className="card max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-info">{currentQ.topic}</span>
              <span className="badge">{currentQ.difficulty}</span>
            </div>

            <p className="text-gray-900 font-medium mb-6 leading-relaxed whitespace-pre-line">
              {currentQ.questionText}
            </p>

            <div className="space-y-3 mb-6">
              {Object.entries(currentQ.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleSelectAnswer(key)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    currentAnswer === key
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                      currentAnswer === key
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-gray-300 text-gray-500'
                    }`}>
                      {key}
                    </span>
                    <span className="text-sm text-gray-700">{value}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => { questionStartRef.current = Date.now(); setCurrentIdx(Math.max(0, currentIdx - 1)); }}
                disabled={currentIdx === 0}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => { questionStartRef.current = Date.now(); setCurrentIdx(currentIdx + 1); }}
                  className="btn-primary flex items-center gap-2"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={handleSubmitTest} disabled={submitting} className="btn-danger flex items-center gap-2">
                  <Flag className="h-4 w-4" /> Finish Test
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Result
  if (testState === 'result' && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Mock Test Results</h1>
        <div className="card mb-6">
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold ${
              result.percentage >= 70 ? 'text-green-600' : result.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {result.percentage}%
            </div>
            <p className="text-gray-500 mt-2">Score: {result.totalScore.toFixed(1)} / {result.totalQuestions}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{result.correct}</p>
              <p className="text-xs text-green-600">Correct</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-700">{result.wrong}</p>
              <p className="text-xs text-red-600">Wrong</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Minus className="h-6 w-6 text-gray-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-700">{result.unanswered}</p>
              <p className="text-xs text-gray-600">Unanswered</p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Negative marks: <span className="font-bold">-{result.negativeMarks.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setTestState('select')} className="btn-secondary flex-1">
            Back to Tests
          </button>
          <button onClick={() => { setTestState('config'); }} className="btn-primary flex-1">
            Take Another Test
          </button>
        </div>
      </div>
    );
  }

  // History
  if (testState === 'history') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Test History</h1>
          <button onClick={() => setTestState('select')} className="btn-secondary">Back</button>
        </div>
        {history.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">No mock tests taken yet.</div>
        ) : (
          <div className="space-y-3">
            {history.map((test) => (
              <div key={test.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{test.mockName}</h3>
                  <p className="text-sm text-gray-500">{test.certification?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-700">{test.totalScore.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">
                    {test.completedAt ? new Date(test.completedAt).toLocaleDateString() : 'In progress'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
