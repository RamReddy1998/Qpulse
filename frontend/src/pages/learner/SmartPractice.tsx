import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { certificationService } from '../../services/certification.service';
import { practiceService } from '../../services/practice.service';
import { Certification, Question, AiExplanation } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BookOpen, ChevronRight, Lightbulb, CheckCircle, XCircle, RotateCcw, Brain } from 'lucide-react';

export function SmartPractice() {
  const [searchParams] = useSearchParams();
  const certIdParam = searchParams.get('certId');

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedCertId, setSelectedCertId] = useState(certIdParam || '');
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState<AiExplanation | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, total: 0 });
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    certificationService.getAll().then((certs) => {
      setCertifications(certs);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCertId) {
      loadNextQuestion();
    }
  }, [selectedCertId]);

  const loadNextQuestion = useCallback(async () => {
    if (!selectedCertId) return;
    setLoadingQuestion(true);
    setSelectedAnswer('');
    setSubmitted(false);
    setExplanation(null);
    setCorrectAnswer('');

    try {
      const questions = await practiceService.getQuestions(selectedCertId, 1, answeredIds);
      if (questions.length > 0) {
        setQuestion(questions[0]);
        setStartTime(Date.now());
      }
    } catch (err) {
      console.error('Failed to load question:', err);
    } finally {
      setLoadingQuestion(false);
    }
  }, [selectedCertId, answeredIds]);

  const handleSubmit = async () => {
    if (!question || !selectedAnswer) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    setSubmitted(true);

    try {
      const result = await practiceService.submitAnswer(question.id, selectedAnswer, timeSpent);
      setIsCorrect(result.isCorrect);
      setCorrectAnswer(result.correctAnswer);
      setAnsweredIds((prev) => [...prev, question.id]);
      setStats((prev) => ({
        correct: prev.correct + (result.isCorrect ? 1 : 0),
        wrong: prev.wrong + (result.isCorrect ? 0 : 1),
        total: prev.total + 1,
      }));
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const handleGetExplanation = async () => {
    if (!question) return;
    setLoadingExplanation(true);

    try {
      const exp = await practiceService.getExplanation(question.id, selectedAnswer);
      setExplanation(exp);
    } catch (err) {
      console.error('Failed to get explanation:', err);
    } finally {
      setLoadingExplanation(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading..." />;

  // Certification selection
  if (!selectedCertId) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Smart Practice</h1>
          <p className="text-gray-500 mt-1">Select a certification to start practicing</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <button
              key={cert.id}
              onClick={() => setSelectedCertId(cert.id)}
              className="card hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                    {cert.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{cert._count.questions} questions</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Practice</h1>
          <p className="text-gray-500 mt-1">
            {certifications.find((c) => c.id === selectedCertId)?.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-700 font-medium">{stats.correct}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 font-medium">{stats.wrong}</span>
          </div>
          <button
            onClick={() => { setSelectedCertId(''); setAnsweredIds([]); setStats({ correct: 0, wrong: 0, total: 0 }); }}
            className="btn-secondary text-sm"
          >
            Change Certification
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Question */}
        <div className="card">
          {loadingQuestion ? (
            <LoadingSpinner message="Loading question..." />
          ) : question ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-500">
                  Topic: {question.topic} | Difficulty: {question.difficulty}
                </span>
              </div>

              <p className="text-gray-900 font-medium mb-6 leading-relaxed whitespace-pre-line">
                {question.questionText}
              </p>

              <div className="space-y-3">
                {Object.entries(question.options).map(([key, value]) => {
                  let optionClass = 'border-gray-200 hover:border-primary-300 hover:bg-primary-50';
                  if (submitted) {
                    if (key === correctAnswer) {
                      optionClass = 'border-green-500 bg-green-50';
                    } else if (key === selectedAnswer && !isCorrect) {
                      optionClass = 'border-red-500 bg-red-50';
                    } else {
                      optionClass = 'border-gray-200 opacity-60';
                    }
                  } else if (key === selectedAnswer) {
                    optionClass = 'border-primary-500 bg-primary-50';
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => !submitted && setSelectedAnswer(key)}
                      disabled={submitted}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionClass}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                          submitted && key === correctAnswer
                            ? 'bg-green-500 text-white border-green-500'
                            : submitted && key === selectedAnswer && !isCorrect
                              ? 'bg-red-500 text-white border-red-500'
                              : key === selectedAnswer
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'border-gray-300 text-gray-500'
                        }`}>
                          {key}
                        </span>
                        <span className="text-sm text-gray-700">{value}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedAnswer}
                    className="btn-primary flex-1"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <>
                    <button onClick={handleGetExplanation} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Explanation
                    </button>
                    <button onClick={loadNextQuestion} className="btn-secondary flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Next
                    </button>
                  </>
                )}
              </div>

              {/* Result banner */}
              {submitted && (
                <div className={`mt-4 p-3 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <div className="flex items-center gap-2">
                    {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    <span className="font-medium">
                      {isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}.`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No more questions available.</p>
              <button onClick={() => { setAnsweredIds([]); loadNextQuestion(); }} className="btn-primary mt-4">
                Reset & Start Over
              </button>
            </div>
          )}
        </div>

        {/* Right: AI Explanation */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">AI Explanation</h2>
          </div>

          {loadingExplanation ? (
            <LoadingSpinner message="AI is analyzing..." />
          ) : explanation ? (
            <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2">
              <div>
                <h3 className="text-sm font-semibold text-primary-700 mb-2">Step-by-Step</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{explanation.stepByStep}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-700 mb-2">Correct Answer</h3>
                <p className="text-sm text-gray-700">{explanation.correctAnswerExplanation}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-700 mb-2">Conceptual</h3>
                <p className="text-sm text-gray-700">{explanation.conceptual}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-purple-700 mb-2">Exam Tips</h3>
                <p className="text-sm text-gray-700">{explanation.examOriented}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-orange-700 mb-2">Wrong Options</h3>
                <div className="space-y-2">
                  {Object.entries(explanation.wrongOptionsExplanation).map(([key, val]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-600">Option {key}:</span>{' '}
                      <span className="text-gray-700">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-2">Exam Trap</h3>
                <p className="text-sm text-gray-700">{explanation.examTrap}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-teal-700 mb-2">Memory Trick</h3>
                <p className="text-sm text-gray-700">{explanation.memoryTrick}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Brain className="h-16 w-16 mx-auto mb-4 text-gray-200" />
              <p className="text-sm">Submit an answer, then click "AI Explanation" to get detailed analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
