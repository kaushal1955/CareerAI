import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, RefreshCcw, Replace, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useCurrentUserData from '../../hooks/useCurrentUserData';
import {
  deleteResume,
  getMyResumes,
  getResumeDownloadBlob,
  getResumePreviewBlob,
  reanalyzeResume,
  replaceResume,
} from '../../services/resumeService';

export default function ResumeHistoryPage() {
  const { getToken } = useAuth();
  const { profile } = useCurrentUserData();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');
  const [replaceFiles, setReplaceFiles] = useState({});

  const loadResumes = async () => {
    try {
      setLoading(true);
      const response = await getMyResumes(getToken);
      setResumes(response.resumes || []);
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load resume history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const openPreview = async (resumeId) => {
    try {
      setActionId(`preview-${resumeId}`);
      const blob = await getResumePreviewBlob(getToken, resumeId);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch (previewError) {
      setError(previewError?.response?.data?.message || 'Unable to open resume preview.');
    } finally {
      setActionId('');
    }
  };

  const downloadFile = async (resume) => {
    try {
      setActionId(`download-${resume._id}`);
      const blob = await getResumeDownloadBlob(getToken, resume._id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = resume.originalFileName || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(downloadError?.response?.data?.message || 'Unable to download resume.');
    } finally {
      setActionId('');
    }
  };

  const handleReanalyze = async (resume) => {
    try {
      setActionId(`reanalyze-${resume._id}`);
      setMessage('');
      setError('');
      await reanalyzeResume(
        getToken,
        resume._id,
        profile?.preferredCareer || resume.preferredCareerAtUpload || '',
      );
      setMessage('Resume reanalyzed successfully.');
      await loadResumes();
    } catch (reanalyzeError) {
      setError(reanalyzeError?.response?.data?.message || 'Unable to reanalyze this resume.');
    } finally {
      setActionId('');
    }
  };

  const handleDelete = async (resume) => {
    const confirmed = window.confirm(`Delete ${resume.originalFileName}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setActionId(`delete-${resume._id}`);
      setMessage('');
      setError('');
      await deleteResume(getToken, resume._id);
      setMessage('Resume deleted successfully.');
      await loadResumes();
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || 'Unable to delete this resume.');
    } finally {
      setActionId('');
    }
  };

  const handleReplace = async (resume) => {
    const selectedFile = replaceFiles[resume._id];

    if (!selectedFile) {
      setError('Please choose a replacement PDF file first.');
      return;
    }

    try {
      setActionId(`replace-${resume._id}`);
      setMessage('');
      setError('');
      await replaceResume(
        getToken,
        resume._id,
        selectedFile,
        profile?.preferredCareer || resume.preferredCareerAtUpload || '',
      );
      setReplaceFiles((prev) => ({ ...prev, [resume._id]: null }));
      setMessage('Resume replaced successfully.');
      await loadResumes();
    } catch (replaceError) {
      setError(replaceError?.response?.data?.message || 'Unable to replace this resume.');
    } finally {
      setActionId('');
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading resume history..." />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/resume" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
            <ArrowLeft size={16} />
            Back to resume workspace
          </Link>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Resume history</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Manage all uploaded resumes</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Reanalyze older resumes, replace files, download copies, or remove resumes you no longer need.
          </p>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!resumes.length ? (
        <div className="card p-10 text-center text-slate-400">
          <p>No resumes found yet.</p>
          <Link to="/resume" className="btn-primary mt-5">
            Upload your first resume
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {resumes.map((resume, index) => (
            <section key={resume._id} className="card p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-200">
                      Resume #{resumes.length - index}
                    </span>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                      ATS {resume.analysis?.atsScore ?? 0}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-white">{resume.originalFileName}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Uploaded on {new Date(resume.createdAt).toLocaleString()} · Preferred career:{' '}
                    <span className="text-slate-200">{resume.preferredCareerAtUpload || 'Not specified'}</span>
                  </p>
                  <p className="mt-4 max-w-3xl text-sm text-slate-300">
                    {resume.analysis?.summary || 'No summary available yet for this resume.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 xl:max-w-md xl:justify-end">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => openPreview(resume._id)}
                    disabled={actionId === `preview-${resume._id}`}
                  >
                    <ExternalLink size={16} className="mr-2" />
                    Preview
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => downloadFile(resume)}
                    disabled={actionId === `download-${resume._id}`}
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => handleReanalyze(resume)}
                    disabled={actionId === `reanalyze-${resume._id}`}
                  >
                    <RefreshCcw size={16} className="mr-2" />
                    {actionId === `reanalyze-${resume._id}` ? 'Reanalyzing...' : 'Reanalyze'}
                  </button>
                  <button
                    className="btn-secondary border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
                    type="button"
                    onClick={() => handleDelete(resume)}
                    disabled={actionId === `delete-${resume._id}`}
                  >
                    <Trash2 size={16} className="mr-2" />
                    {actionId === `delete-${resume._id}` ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-300">Extracted skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(resume.analysis?.extractedSkills || []).length ? (
                      (resume.analysis?.extractedSkills || []).map((skill) => (
                        <span key={skill} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No extracted skills for this resume yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-300">Replace this resume</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      className="input file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-500"
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(event) =>
                        setReplaceFiles((prev) => ({
                          ...prev,
                          [resume._id]: event.target.files?.[0] || null,
                        }))
                      }
                    />
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => handleReplace(resume)}
                      disabled={actionId === `replace-${resume._id}`}
                    >
                      <Replace size={16} className="mr-2" />
                      {actionId === `replace-${resume._id}` ? 'Replacing...' : 'Replace PDF'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
