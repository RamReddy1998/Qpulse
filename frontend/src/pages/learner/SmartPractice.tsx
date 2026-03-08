import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { certificationService } from '../../services/certification.service';
import { practiceService } from '../../services/practice.service';
import { Certification, Question, AiExplanation, AiHint } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  BookOpen, ChevronRight, ChevronLeft, Lightbulb, CheckCircle, XCircle,
  RotateCcw, Brain, Filter, X, HelpCircle,
} from 'lucide-react';

export function SmartPractice() {
  const [searchParams] = useSearchParams();
  const certIdParam = searchParams.get('certId');
  const questionIdParam = searchParams.get('questionId');

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedCertId, setSelectedCertId] = useState(certIdParam || '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState<AiExplanation | null>(null);
  const [hint, setHint] = useState<AiHint | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [loadingHint, setLoadingHint] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, total: 0 });
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [questionLimit, setQuestionLimit] = useState(20);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCount, setFilterCount] = useState(0);

  useEffect(() => {
    certificationService.getAll().then((certs) => {
      setCertifications(certs);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCertId) {
      Promise.all([
        practiceService.getTopics(selectedCertId),
        practiceService.getDifficulties(selectedCertId),
      ]).then(([t, d]) => {
        setTopics(t);
        setDifficulties(d);
      });
      if (questionIdParam) {
        loadSpecificQuestion(questionIdParam);
      } else {
        loadQuestions();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCertId]);

  useEffect(() => {
    if (selectedCertId && (selectedTopic || selectedDifficulty)) {
      practiceService
        .getFilterCount(selectedCertId, {
          topic: selectedTopic || undefined,
          difficulty: selectedDifficulty || undefined,
        })
        .then(setFilterCount);
    } else {
      setFilterCount(0);
    }
  }, [selectedCertId, selectedTopic, selectedDifficulty]);

  const loadSpecificQuestion = async (questionId: string) => {
    setLoadingQuestion(true);
    try {
      const q = await practiceService.getQuestionById(questionId);
      setQuestions([q]);
      setCurrentIdx(0);
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to load question:', err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const loadQuestions = useCallback(async () => {
    if (!selectedCertId) return;
    setLoadingQuestion(true);
    resetQuestionState();
    try {
      const qs = await practiceService.getQuestions(selectedCertId, 20);
      setQuestions(qs);
      setCurrentIdx(0);
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoadingQuestion(false);
    }
  }, [selectedCertId]);

  const handleApplyFilters = async () => {
    if (!selectedCertId) return;
    setLoadingQuestion(true);
    resetQuestionState();
    try {
      const qs = await practiceService.getFilteredQuestions(selectedCertId, {
        topic: selectedTopic || undefined,
        difficulty: selectedDifficulty || undefined,
        limit: questionLimit,
      });
      setQuestions(qs);
      setCurrentIdx(0);
      setStartTime(Date.now());
      setFiltersApplied(true);
      setShowFilters(false);
    } catch (err) {
      console.error('Failed to load filtered questions:', err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedTopic('');
    setSelectedDifficulty('');
    setQuestionLimit(20);
    setFiltersApplied(false);
    setFilterCount(0);
    loadQuestions();
  };

  const resetQuestionState = () => {
    setSelectedAnswer('');
    setSubmitted(false);
    setExplanation(null);
    setHint(null);
    setCorrectAnswer('');
    setIsCorrect(false);
  };

  const navigateQuestion = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIdx(idx);
      resetQuestionState();
      setStartTime(Date.now());
    }
  };

  const handleSubmit = async () => {
    const question = questions[currentIdx];
    if (!question || !selectedAnswer) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    setSubmitted(true);
    try {
      const result = await practiceService.submitAnswer(question.id, selectedAnswer, timeSpent);
      setIsCorrect(result.isCorrect);
      setCorrectAnswer(result.correctAnswer);
      setStats((prev) => ({
        correct: prev.correct + (result.isCorrect ? 1 : 0),
        wrong: prev.wrong + (result.isCorrect ? 0 : 1),
        total: prev.total + 1,
      }));
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const handleGetHint = async () => {
    const question = questions[currentIdx];
    if (!question) return;
    setLoadingHint(true);
    try {
      const h = await practiceService.getHint(question.id);
      setHint(h);
    } catch (err) {
      console.error('Failed to get hint:', err);
    } finally {
      setLoadingHint(false);
    }
  };

  const handleGetExplanation = async () => {
    const question = questions[currentIdx];
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Practice</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Select a certification to start practicing</p>
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
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600">
                    {cert.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cert._count.questions} questions</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const question = questions[currentIdx] || null;

  return (
    <div>
      {/* Header with stats and filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Practice</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {certifications.find((c) => c.id === selectedCertId)?.name}
            {filtersApplied && <span className="text-primary-600 ml-2">(Filtered)</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-700 dark:text-green-400 font-medium">{stats.correct}</span>
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700 dark:text-red-400 font-medium">{stats.wrong}</span>
            </span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary text-sm flex items-center gap-1 ${filtersApplied ? 'ring-2 ring-primary-500' : ''}`}
          >
            <Filter className="h-4 w-4" /> Filters
            {filtersApplied && <span className="ml-1 bg-primary-500 text-white text-xs rounded-full px-1.5">!</span>}
          </button>
          <button
            onClick={() => {
              setSelectedCertId('');
              setQuestions([]);
              setStats({ correct: 0, wrong: 0, total: 0 });
              setFiltersApplied(false);
            }}
            className="btn-secondary text-sm"
          >
            Change Certification
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Filter Questions</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label>
              <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="input-field">
                <option value="">All Topics</option>
                {topics.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
              <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} className="input-field">
                <option value="">All Difficulties</option>
                {difficulties.map((d) => (<option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Question Count {filterCount > 0 ? `(${filterCount} available)` : ''}
              </label>
              <input type="number" min={1} max={100} value={questionLimit} onChange={(e) => setQuestionLimit(parseInt(e.target.value) || 20)} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleApplyFilters} className="btn-primary text-sm">Apply Filter</button>
            <button onClick={handleResetFilters} className="btn-secondary text-sm">Reset Filter</button>
          </div>
        </div>
      )}

      {/* Question Navigation Bar */}
      {questions.length > 1 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">{currentIdx + 1} / {questions.length}</span>
          <div className="flex gap-1 flex-wrap">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => navigateQuestion(i)}
                className={`w-7 h-7 rounded text-xs font-medium ${
                  i === currentIdx
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

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
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Topic: {question.topic} | Difficulty: {question.difficulty}
                </span>
              </div>

              <p className="text-gray-900 dark:text-white font-medium mb-6 leading-relaxed whitespace-pre-line">
                {question.questionText}
              </p>

              <div className="space-y-3">
                {Object.entries(question.options).map(([key, value]) => {
                  let optionClass = 'border-gray-200 dark:border-gray-600 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20';
                  if (submitted) {
                    if (key === correctAnswer) {
                      optionClass = 'border-green-500 bg-green-50 dark:bg-green-900/20';
                    } else if (key === selectedAnswer && !isCorrect) {
                      optionClass = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                    } else {
                      optionClass = 'border-gray-200 dark:border-gray-600 opacity-60';
                    }
                  } else if (key === selectedAnswer) {
                    optionClass = 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
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
                                : 'border-gray-300 dark:border-gray-500 text-gray-500'
                        }`}>
                          {key}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                {!submitted ? (
                  <>
                    <button onClick={handleSubmit} disabled={!selectedAnswer} className="btn-primary flex-1">
                      Submit Answer
                    </button>
                    <button
                      onClick={handleGetHint}
                      disabled={loadingHint}
                      className="btn-secondary flex items-center justify-center gap-2"
                      title="Get hints without revealing the answer"
                    >
                      <HelpCircle className="h-4 w-4" />
                      {loadingHint ? 'Loading...' : 'Hint'}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleGetExplanation} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      <Brain className="h-4 w-4" /> AI Explanation
                    </button>
                    {currentIdx < questions.length - 1 && (
                      <button onClick={() => navigateQuestion(currentIdx + 1)} className="btn-secondary flex items-center gap-2">
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Previous / Next */}
              <div className="flex justify-between mt-4">
                <button onClick={() => navigateQuestion(currentIdx - 1)} disabled={currentIdx === 0} className="btn-secondary text-sm flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button onClick={() => navigateQuestion(currentIdx + 1)} disabled={currentIdx >= questions.length - 1} className="btn-secondary text-sm flex items-center gap-1">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Result banner */}
              {submitted && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                }`}>
                  {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  <span className="font-medium">
                    {isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}.`}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No more questions available.</p>
              <button onClick={loadQuestions} className="btn-primary mt-4">
                <RotateCcw className="h-4 w-4 inline mr-2" /> Reset & Start Over
              </button>
            </div>
          )}
        </div>

        {/* Right: AI Explanation / Hints */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {submitted ? 'AI Explanation' : 'AI Assistant'}
            </h2>
            {submitted && (
              <span className={`ml-auto flex items-center gap-1 text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {isCorrect ? 'Correct' : 'Wrong'}
              </span>
            )}
          </div>

          {loadingExplanation ? (
            <LoadingSpinner message="AI is analyzing..." />
          ) : loadingHint ? (
            <LoadingSpinner message="Generating hints..." />
          ) : hint && !submitted ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              <div>
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Hints</h3>
                <ul className="list-disc list-inside space-y-1">
                  {hint.hints.map((h, i) => (<li key={i} className="text-sm text-gray-700 dark:text-gray-300">{h}</li>))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">Tips</h3>
                <ul className="list-disc list-inside space-y-1">
                  {hint.tips.map((t, i) => (<li key={i} className="text-sm text-gray-700 dark:text-gray-300">{t}</li>))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">Solving Strategy</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{hint.solvingStrategy}</p>
              </div>
            </div>
          ) : explanation ? (
            <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2">
              <div>
                <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-400 mb-2">Step-by-Step</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{explanation.stepByStep}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">Correct Answer</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{explanation.correctAnswerExplanation}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Conceptual</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{explanation.conceptual}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">Exam Tips</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{explanation.examOriented}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">Wrong Options</h3>
                <div className="space-y-2">
                  {Object.entries(explanation.wrongOptionsExplanation).map(([key, val]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Option {key}:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Exam Trap</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{explanation.examTrap}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-2">Memory Trick</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{explanation.memoryTrick}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <Brain className="h-16 w-16 mx-auto mb-4 text-gray-200 dark:text-gray-600" />
              <p className="text-sm">
                {submitted
                  ? 'Click "AI Explanation" to get detailed analysis'
                  : 'Click "Hint" for solving tips, or submit your answer for full AI explanation'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
