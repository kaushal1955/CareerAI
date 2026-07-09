import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Upload, FileText, Brain, RefreshCcw, Download, ExternalLink, History, FilePenLine } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useCurrentUserData from '../../hooks/useCurrentUserData';
import {
  getLatestResume,
  getResumeDownloadBlob,
  getResumePreviewBlob,
  reanalyzeResume,
  uploadResume,
} from '../../services/resumeService';

function ListChips({ items = [] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No items available yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function AnalysisList({ title, items }) {
  return (
    <section className="card p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {(items || []).length ? (
          items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="text-slate-500">No insights available yet.</li>
        )}
      </ul>
    </section>
  );
}

export default function ResumePage() {
  const { getToken } = useAuth();
  const { profile, loading: profileLoading } = useCurrentUserData();
  const [selectedFile, setSelectedFile] = useState(null);
  const [latestResume, setLatestResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadLatestResume = async () => {
    try {
      setLoading(true);
      const response = await getLatestResume(getToken);
      setLatestResume(response.resume || null);
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load resume data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestResume();
  }, []);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    const loadPreview = async () => {
      if (!latestResume?._id) {
        setPreviewUrl('');
        setPreviewError('');
        return;
      }

      try {
        setPreviewLoading(true);
        setPreviewError('');
        const blob = await getResumePreviewBlob(getToken, latestResume._id);
        objectUrl = URL.createObjectURL(blob);

        if (active) {
          setPreviewUrl((previousUrl) => {
            if (previousUrl) {
              URL.revokeObjectURL(previousUrl);
            }
            return objectUrl;
          });
        }
      } catch (previewLoadError) {
        if (active) {
          setPreviewError(
            previewLoadError?.response?.data?.message || 'Unable to load resume preview.',
          );
          setPreviewUrl((previousUrl) => {
            if (previousUrl) {
              URL.revokeObjectURL(previousUrl);
            }
            return '';
          });
        }
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [getToken, latestResume?._id]);

  const handleUpload = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!selectedFile) {
      setError('Please choose a PDF resume first.');
      return;
    }

    try {
      setUploading(true);
      const response = await uploadResume(getToken, selectedFile, profile?.preferredCareer || '');
      setLatestResume(response.resume);
      setMessage('Resume uploaded and analyzed successfully.');
      setSelectedFile(null);
      event.target.reset();
    } catch (uploadError) {
      setError(uploadError?.response?.data?.message || 'Resume upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!latestResume?._id) return;

    try {
      setReanalyzing(true);
      setMessage('');
      setError('');
      const response = await reanalyzeResume(
        getToken,
        latestResume._id,
        profile?.preferredCareer || latestResume.preferredCareerAtUpload || '',
      );
      setLatestResume(response.resume);
      setMessage('Resume reanalyzed successfully.');
    } catch (reanalyzeError) {
      setError(reanalyzeError?.response?.data?.message || 'Unable to reanalyze resume.');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleDownload = async () => {
    if (!latestResume?._id) return;

    try {
      setDownloading(true);
      setError('');
      const blob = await getResumeDownloadBlob(getToken, latestResume._id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = latestResume.originalFileName || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(downloadError?.response?.data?.message || 'Unable to download resume.');
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenPreview = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (profileLoading || loading) {
    return <LoadingSpinner label="Loading resume workspace..." />;
  }

  const analysis = latestResume?.analysis;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Resume workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Upload, review, and improve your resume</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Manage your latest resume analysis, open the resume history, build a custom resume,
            and continue toward career recommendations.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn-secondary" to="/resume/history">
            <History size={16} className="mr-2" />
            Resume history
          </Link>
          <Link className="btn-secondary" to="/resume/builder">
            <FilePenLine size={16} className="mr-2" />
            Resume builder
          </Link>
          <Link className="btn-primary" to="/career-recommendation">
            Career recommendations
          </Link>
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

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
              <Upload size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Upload PDF resume</h2>
              <p className="text-sm text-slate-400">Max file size: 5MB</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleUpload}>
            <div>
              <label className="label">Choose file</label>
              <input
                className="input file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-500"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
              <p>
                Preferred career for analysis:{' '}
                <span className="text-slate-200">{profile?.preferredCareer || 'Not set in profile'}</span>
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Tip: update your preferred career in the profile page to get more targeted keyword suggestions.
              </p>
            </div>

            <button className="btn-primary w-full" type="submit" disabled={uploading}>
              {uploading ? 'Uploading and analyzing...' : 'Upload and analyze'}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-300">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Latest resume snapshot</h2>
              <p className="text-sm text-slate-400">
                {latestResume ? 'Your most recently uploaded resume.' : 'No resume uploaded yet.'}
              </p>
            </div>
          </div>

          {latestResume ? (
            <>
              <dl className="mt-6 space-y-4 text-sm text-slate-300">
                <div className="flex justify-between gap-4 border-b border-slate-800 pb-4">
                  <dt>File name</dt>
                  <dd className="max-w-[60%] text-right text-slate-400">{latestResume.originalFileName}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-800 pb-4">
                  <dt>Uploaded</dt>
                  <dd className="text-right text-slate-400">
                    {new Date(latestResume.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-800 pb-4">
                  <dt>Preferred career</dt>
                  <dd className="text-right text-slate-400">
                    {latestResume.preferredCareerAtUpload || 'Not specified'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Storage</dt>
                  <dd className="capitalize text-right text-slate-400">
                    {latestResume.storage?.provider || 'local'}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="btn-primary" type="button" onClick={handleDownload} disabled={downloading}>
                  <Download size={16} className="mr-2" />
                  {downloading ? 'Preparing download...' : 'Download PDF'}
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={handleOpenPreview}
                  disabled={!previewUrl || previewLoading}
                >
                  <ExternalLink size={16} className="mr-2" />
                  Open preview
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={handleReanalyze}
                  disabled={reanalyzing}
                >
                  <RefreshCcw size={16} className="mr-2" />
                  {reanalyzing ? 'Reanalyzing...' : 'Reanalyze'}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
              Upload your first resume to see AI-generated analysis here.
            </div>
          )}
        </div>
      </section>

      {latestResume ? (
        <section className="card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Resume preview</h2>
              <p className="mt-1 text-sm text-slate-400">
                Secure in-app preview of your latest uploaded PDF resume.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              {previewLoading ? 'Loading preview...' : 'Preview updates automatically after a new upload.'}
            </div>
          </div>

          {previewError ? (
            <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {previewError}
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            {previewLoading ? (
              <div className="flex min-h-[600px] items-center justify-center text-sm text-slate-400">
                Loading PDF preview...
              </div>
            ) : previewUrl ? (
              <iframe
                title="Resume PDF preview"
                src={previewUrl}
                className="min-h-[600px] w-full bg-white"
              />
            ) : (
              <div className="flex min-h-[600px] items-center justify-center px-6 text-center text-sm text-slate-500">
                Preview is not available right now. You can still download the resume PDF.
              </div>
            )}
          </div>
        </section>
      ) : null}

      {analysis ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="card p-6">
              <p className="text-sm text-slate-400">ATS score</p>
              <h2 className="mt-2 text-4xl font-bold text-white">{analysis.atsScore ?? 0}</h2>
              <p className="mt-3 text-sm text-slate-500">Estimated ATS compatibility based on extracted content and structure.</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-slate-400">Recommended roles</p>
              <div className="mt-4">
                <ListChips items={analysis.recommendedRoles || []} />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-2 text-brand-300">
                <Brain size={18} />
                <p className="text-sm font-medium">AI summary</p>
              </div>
              <p className="mt-4 text-sm text-slate-300">{analysis.summary}</p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <AnalysisList title="Strengths" items={analysis.strengths} />
            <AnalysisList title="Areas to improve" items={analysis.improvements} />
            <section className="card p-5">
              <h3 className="text-base font-semibold text-white">Extracted skills</h3>
              <div className="mt-4">
                <ListChips items={analysis.extractedSkills || []} />
              </div>
            </section>
            <section className="card p-5">
              <h3 className="text-base font-semibold text-white">Missing keywords</h3>
              <div className="mt-4">
                <ListChips items={analysis.missingKeywords || []} />
              </div>
            </section>
            <AnalysisList title="Project suggestions" items={analysis.projectSuggestions} />
            <AnalysisList title="Course suggestions" items={analysis.courseSuggestions} />
          </section>
        </>
      ) : null}
    </div>
  );
}
