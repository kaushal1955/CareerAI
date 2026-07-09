import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic, RefreshCcw, Send } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { evaluateInterview, generateInterview, getLatestInterview } from '../../services/interviewService';

const interviewTypeOptions = [
  { value: 'technical', label: 'Technical' },
  { value: 'hr', label: 'HR' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'coding', label: 'Coding' },
];

export default function MockInterviewPage() {
  const { getToken } = useAuth();
  const [interviewType, setInterviewType] = useState('technical');
  const [interview, setInterview] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadLatest = async () => {
    try {
      setLoading(true);
      const response = await getLatestInterview(getToken);
      setInterview(response.interview || null);
      setAnswers(response.interview?.answers || []);
      if (response.interview?.interviewType) {
        setInterviewType(response.interview.interviewType);
      }
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load mock interview session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatest();
  }, []);

  const answerMap = useMemo(() => {
    const map = new Map();
    (answers || []).forEach((item) => {
      map.set(Number(item.questionIndex), item.answer || '');
    });
    return map;
  }, [answers]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setMessage('');
      setError('');
      const response = await generateInterview(getToken, interviewType);
      setInterview(response.interview);
      setAnswers([]);
      setMessage('Mock interview generated successfully.');
    } catch (generateError) {
      setError(generateError?.response?.data?.message || 'Unable to generate interview questions.');
    } finally {
      setGenerating(false);
    }
  };

  const updateAnswer = (questionIndex, answer) => {
    setAnswers((prev) => {
      const existing = prev.find((item) => Number(item.questionIndex) === questionIndex);
      if (existing) {
        return prev.map((item) =>
          Number(item.questionIndex) === questionIndex ? { ...item, answer } : item,
        );
      }
      return [...prev, { questionIndex, answer }];
    });
  };

  const handleEvaluate = async () => {
    if (!interview?._id) return;

    try {
      setEvaluating(true);
      setMessage('');
      setError('');
      const response = await evaluateInterview(getToken, interview._id, answers);
      setInterview(response.interview);
      setAnswers(response.interview.answers || []);
      setMessage('Interview evaluated successfully.');
    } catch (evaluateError) {
      setError(evaluateError?.response?.data?.message || 'Unable to evaluate interview responses.');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading mock interview..." />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/learning-roadmap" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
            <ArrowLeft size={16} />
            Back to learning roadmap
          </Link>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Mock interview</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Practice interview rounds with structured feedback</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Generate HR, technical, behavioral, or coding interview questions based on your target career and evaluate your written answers.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="input min-w-44" value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
            {interviewTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="btn-primary" type="button" onClick={handleGenerate} disabled={generating}>
            <RefreshCcw size={16} className="mr-2" />
            {generating ? 'Generating...' : 'Generate interview'}
          </button>
        </div>
      </section>

      {message ? <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      {interview ? (
        <>
          <section className="card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3 text-brand-300">
                  <Mic size={20} />
                  <p className="text-sm font-medium uppercase tracking-[0.25em]">Interview session</p>
                </div>
                <h2 className="mt-3 text-3xl font-bold text-white">{interview.targetCareer}</h2>
                <p className="mt-2 text-slate-400 capitalize">{interview.interviewType} round · {interview.questions?.length || 0} questions</p>
              </div>
              {interview.status === 'completed' ? (
                <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-5 py-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Score</p>
                  <p className="mt-2 text-3xl font-bold text-white">{interview.performanceScore}%</p>
                </div>
              ) : null}
            </div>
          </section>

          <div className="space-y-5">
            {(interview.questions || []).map((questionItem, index) => {
              const questionFeedback = (interview.perQuestionFeedback || []).find(
                (item) => Number(item.questionIndex) === index,
              );

              return (
                <section key={`${questionItem.question}-${index}`} className="card p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">Question {index + 1}</span>
                    <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-200 capitalize">{questionItem.difficulty}</span>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">{questionItem.category}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{questionItem.question}</h3>
                  <p className="mt-3 text-sm text-slate-500">Tip: include examples, reasoning, and outcomes when possible.</p>
                  <textarea
                    className="input mt-5 min-h-32"
                    placeholder="Write your answer here..."
                    value={answerMap.get(index) || ''}
                    onChange={(e) => updateAnswer(index, e.target.value)}
                  />
                  {questionFeedback ? (
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                      <p className="font-medium text-white">Score: {questionFeedback.score}%</p>
                      <p className="mt-2 text-slate-400">{questionFeedback.feedback}</p>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" type="button" onClick={handleEvaluate} disabled={evaluating}>
              <Send size={16} className="mr-2" />
              {evaluating ? 'Evaluating...' : 'Evaluate answers'}
            </button>
            <button className="btn-secondary" type="button" onClick={handleGenerate} disabled={generating}>
              <RefreshCcw size={16} className="mr-2" />
              Generate a fresh round
            </button>
          </div>

          {interview.status === 'completed' ? (
            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white">Overall feedback</h3>
                <p className="mt-4 text-sm text-slate-400">{interview.feedbackSummary}</p>
                <div className="mt-6">
                  <p className="font-medium text-white">Strengths</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {(interview.strengths || []).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white">Improvement plan</h3>
                <div className="mt-4">
                  <p className="font-medium text-white">Weak areas</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {(interview.weakAreas || []).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <p className="font-medium text-white">Suggestions</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {(interview.improvementSuggestions || []).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <div className="card p-10 text-center text-slate-400">
          <p>No interview session generated yet.</p>
          <button className="btn-primary mt-5" type="button" onClick={handleGenerate}>
            Generate your first interview round
          </button>
        </div>
      )}
    </div>
  );
}
