import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { certificationService } from '../../services/certification.service';
import { Batch, Certification, UploadResult } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Layers, Plus, UserPlus, X, ChevronRight, Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface ParsedQuestion {
  questionText: string;
  options: Record<string, string>;
  correctAnswer: string;
  difficulty: string;
  topic: string;
}

export function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchCertId, setNewBatchCertId] = useState('');
  const [newBatchStartTime, setNewBatchStartTime] = useState('');
  const [newBatchEndTime, setNewBatchEndTime] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // Question upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCertId, setUploadCertId] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [batchData, certs] = await Promise.all([
        adminService.getBatches(1, 50),
        certificationService.getAll(),
      ]);
      setBatches(batchData.data);
      setCertifications(certs);
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await adminService.createBatch(
        newBatchName,
        newBatchCertId,
        newBatchStartTime || undefined,
        newBatchEndTime || undefined
      );
      setShowCreate(false);
      setNewBatchName('');
      setNewBatchCertId('');
      setNewBatchStartTime('');
      setNewBatchEndTime('');
      loadData();
      setMessage('Batch created successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create batch');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        // Try JSON parse first
        const data = JSON.parse(text);
        const questions: ParsedQuestion[] = Array.isArray(data) ? data : data.questions || [];
        setParsedQuestions(questions.map((q: ParsedQuestion) => ({
          questionText: q.questionText || '',
          options: q.options || { A: '', B: '', C: '', D: '' },
          correctAnswer: q.correctAnswer || '',
          difficulty: q.difficulty || 'Medium',
          topic: q.topic || 'General',
        })));
      } catch {
        setError('Failed to parse file. Please upload a valid JSON file with questions.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteQuestion = (idx: number) => {
    setParsedQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEditQuestion = (idx: number, field: string, value: string) => {
    setParsedQuestions((prev) => prev.map((q, i) => {
      if (i !== idx) return q;
      if (field.startsWith('option_')) {
        const optKey = field.replace('option_', '');
        return { ...q, options: { ...q.options, [optKey]: value } };
      }
      return { ...q, [field]: value };
    }));
  };

  const handleUploadQuestions = async () => {
    if (!uploadCertId || parsedQuestions.length === 0) return;
    setUploading(true);
    try {
      const result = await adminService.uploadQuestions(uploadCertId, parsedQuestions);
      setUploadResult(result);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to upload questions');
    } finally {
      setUploading(false);
    }
  };

  const handleAddParticipant = async (batchId: string) => {
    if (!addUsername.trim()) return;
    setError('');
    try {
      await adminService.addParticipant(batchId, addUsername.trim());
      setAddUsername('');
      // Reload batch details
      const batch = await adminService.getBatchDetails(batchId);
      setSelectedBatch(batch);
      setMessage('Participant added');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to add participant');
    }
  };

  const handleRemoveParticipant = async (batchId: string, userId: string) => {
    try {
      await adminService.removeParticipant(batchId, userId);
      const batch = await adminService.getBatchDetails(batchId);
      setSelectedBatch(batch);
      setMessage('Participant removed');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to remove participant:', err);
    }
  };

  const handleSelectBatch = async (batchId: string) => {
    try {
      const batch = await adminService.getBatchDetails(batchId);
      setSelectedBatch(batch);
    } catch (err) {
      console.error('Failed to load batch:', err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading batches..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-500 mt-1">Create and manage learner batches</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Batch
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{message}</div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Batch</h2>
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch Name</label>
                <input
                  type="text"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Batch 2024 - GCP ACE"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certification</label>
                <select
                  value={newBatchCertId}
                  onChange={(e) => setNewBatchCertId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select certification</option>
                  {certifications.map((cert) => (
                    <option key={cert.id} value={cert.id}>{cert.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newBatchStartTime}
                    onChange={(e) => setNewBatchStartTime(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={newBatchEndTime}
                    onChange={(e) => setNewBatchEndTime(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch List */}
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              <Layers className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No batches created yet</p>
            </div>
          ) : (
            batches.map((batch) => (
              <button
                key={batch.id}
                onClick={() => handleSelectBatch(batch.id)}
                className={`card w-full text-left hover:shadow-md transition-shadow ${
                  selectedBatch?.id === batch.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{batch.batchName}</h3>
                    <p className="text-sm text-gray-500">{batch.certification.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {batch._count?.participants || 0} participants
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Batch Details */}
        <div className="lg:col-span-2">
          {selectedBatch ? (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{selectedBatch.batchName}</h2>
              <p className="text-sm text-gray-500 mb-4">{selectedBatch.certification.name}</p>

              {/* Add participant */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="Enter learner username"
                  className="input-field flex-1"
                />
                <button
                  onClick={() => handleAddParticipant(selectedBatch.id)}
                  className="btn-primary flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" /> Add
                </button>
              </div>

              {/* Participants */}
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Participants ({selectedBatch.participants?.length || 0})
              </h3>
              {!selectedBatch.participants?.length ? (
                <p className="text-sm text-gray-500">No participants yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedBatch.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-700">
                            {p.user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{p.user.username}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveParticipant(selectedBatch.id, p.user.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-400">
              <Layers className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p>Select a batch to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Question Upload Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary-600" />
            Question Upload
          </h2>
          <button onClick={() => { setShowUpload(!showUpload); setUploadResult(null); setParsedQuestions([]); }} className="btn-secondary text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> {showUpload ? 'Close' : 'Upload Questions'}
          </button>
        </div>

        {showUpload && (
          <div className="card">
            {/* Upload Result Summary */}
            {uploadResult && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{uploadResult.total}</p>
                    <p className="text-xs text-gray-500">Total Detected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{uploadResult.successful}</p>
                    <p className="text-xs text-green-600">Imported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{uploadResult.failed}</p>
                    <p className="text-xs text-red-600">Failed</p>
                  </div>
                </div>
                {uploadResult.failures.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {uploadResult.failures.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        Q{f.index + 1}: {f.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Select cert and upload */}
            {!uploadResult && (
              <>
                <div className="flex items-end gap-3 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certification</label>
                    <select value={uploadCertId} onChange={(e) => setUploadCertId(e.target.value)} className="input-field">
                      <option value="">Select certification</option>
                      {certifications.map((cert) => (
                        <option key={cert.id} value={cert.id}>{cert.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="btn-secondary text-sm cursor-pointer flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Choose File
                      <input type="file" accept=".json,.pdf" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Step 2: Review parsed questions */}
                {parsedQuestions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Review Questions ({parsedQuestions.length})
                      </h3>
                      <button
                        onClick={handleUploadQuestions}
                        disabled={uploading || !uploadCertId}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Approve & Upload'}
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {parsedQuestions.map((q, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          {editingIdx === idx ? (
                            <div className="space-y-2">
                              <input
                                value={q.questionText}
                                onChange={(e) => handleEditQuestion(idx, 'questionText', e.target.value)}
                                className="input-field text-sm"
                                placeholder="Question text"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                  <input
                                    key={opt}
                                    value={q.options[opt] || ''}
                                    onChange={(e) => handleEditQuestion(idx, `option_${opt}`, e.target.value)}
                                    className="input-field text-xs"
                                    placeholder={`Option ${opt}`}
                                  />
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <select value={q.correctAnswer} onChange={(e) => handleEditQuestion(idx, 'correctAnswer', e.target.value)} className="input-field text-xs">
                                  {['A', 'B', 'C', 'D'].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <select value={q.difficulty} onChange={(e) => handleEditQuestion(idx, 'difficulty', e.target.value)} className="input-field text-xs">
                                  {['Easy', 'Medium', 'Hard'].map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <input value={q.topic} onChange={(e) => handleEditQuestion(idx, 'topic', e.target.value)} className="input-field text-xs" placeholder="Topic" />
                              </div>
                              <button onClick={() => setEditingIdx(null)} className="btn-secondary text-xs">Done</button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-white font-medium">{idx + 1}. {q.questionText.substring(0, 120)}...</p>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs text-gray-500">{q.topic}</span>
                                  <span className="text-xs text-gray-400">{q.difficulty}</span>
                                  <span className="text-xs text-green-600">Answer: {q.correctAnswer}</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => setEditingIdx(idx)} className="text-blue-500 hover:text-blue-700 text-xs">Edit</button>
                                <button onClick={() => handleDeleteQuestion(idx)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
