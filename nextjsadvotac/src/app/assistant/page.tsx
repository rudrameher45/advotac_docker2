'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import './assistant.css';

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Source {
  score: number;
  layer: string;
  doc_title: string | null;
  section_number: string | null;
  section_heading: string | null;
  breadcrumbs: string | null;
  snippet: string | null;
}

interface AssistantResponse {
  query: string;
  answer: string;
  expanded_queries: string[];
  sources: Source[];
  validation: string | null;
}

interface AnalysisApiResponse {
  source: string;
  summary: string;
  analysis: string;
  key_points: string[];
  keywords: string[];
  comparisons: string[];
  table_markdown?: string | null;
  truncated: boolean;
  input_characters: number;
}

const DEFAULT_TASK = 'General';
const TASK_OPTIONS = [
  { value: 'General', label: 'General' },
  { value: 'Analysis Docs', label: 'Analysis Docs' },
  { value: 'Summary', label: 'Summary' },
  { value: 'Deeper Insights', label: 'Deeper Insights' },
  { value: 'Citation Check', label: 'Citation Check' },
];

import { apiUrl } from '../../lib/api';

export default function Assistant() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [taskOption, setTaskOption] = useState<string>(DEFAULT_TASK);
  const [inputText, setInputText] = useState<string>('');
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('userData');

    if (!token || !user) {
      console.log('❌ [ASSISTANT] No auth found, redirecting to login');
      router.push('/auth');
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      setUserData(parsedUser);
      setLoading(false);
    } catch (error) {
      console.error('❌ [ASSISTANT] Error parsing user data:', error);
      localStorage.clear();
      router.push('/auth');
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.clear();
    window.location.replace('/auth');
  };

  const handleFileAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'application/pdf';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
      }
    };
    input.click();
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Unable to read file content.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read the selected file.'));
      reader.readAsDataURL(file);
    });

  const handleGetAnswer = async () => {
    if (!inputText.trim()) {
      const hasPdf = attachedFiles.some((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
      if (!hasPdf) {
        setError('Please enter a query or attach a PDF document.');
        return;
      }
    }

    const userId = userData?.id || userData?.email || null;
    if (!userId || !userData?.email) {
      setError('Unable to identify the current user. Please sign in again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (!['General', 'Analysis Docs'].includes(taskOption)) {
        alert(
          `Task "${taskOption}" is coming soon! Currently only the "General" and "Analysis Docs" tasks are available.`,
        );
        return;
      }

      if (taskOption === 'Analysis Docs') {
        const pdfFile = attachedFiles.find(
          (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
        );

        if (!inputText.trim() && !pdfFile) {
          setError('Please provide either text or attach a PDF document for analysis.');
          return;
        }

        let pdfBase64: string | null = null;
        if (pdfFile) {
          try {
            const dataUrl = await fileToBase64(pdfFile);
            pdfBase64 = dataUrl.split(',').pop() || dataUrl;
          } catch (readError) {
            console.error('[ASSISTANT] Failed to read PDF:', readError);
            setError(readError instanceof Error ? readError.message : 'Unable to read the selected PDF file.');
            return;
          }
        }

        const trimmedInstructions = inputText.trim();
        const payload: Record<string, unknown> = { top_points: 5 };
        if (pdfBase64) {
          payload.pdf_base64 = pdfBase64;
          if (trimmedInstructions) {
            payload.instructions = trimmedInstructions;
          }
        } else if (trimmedInstructions) {
          payload.text = trimmedInstructions;
        }

  const response = await fetch(apiUrl('/api/assistant/analysis'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const detail =
            errorData && typeof errorData === 'object' && 'detail' in errorData
              ? (errorData.detail as string)
              : 'Failed to analyse the document.';
          throw new Error(detail);
        }

        const data: AnalysisApiResponse = await response.json();
        const rawToken =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const token = `ana-${rawToken}`;
        const createdAt = new Date().toISOString();

        const analysisPayload = {
          token,
          task: taskOption,
          query: inputText,
          created_at: createdAt,
          summary: data.summary ?? '',
          analysis: data.analysis ?? data.summary ?? '',
          key_points: Array.isArray(data.key_points) ? data.key_points : [],
          keywords: Array.isArray(data.keywords) ? data.keywords : [],
          comparisons: Array.isArray(data.comparisons) ? data.comparisons : [],
          table_markdown: typeof data.table_markdown === 'string' ? data.table_markdown : null,
          truncated: Boolean(data.truncated),
          input_characters: typeof data.input_characters === 'number' ? data.input_characters : 0,
          source: data.source ?? 'text',
        };

        try {
          sessionStorage.setItem(`analysisTask:${token}`, JSON.stringify(analysisPayload));
          sessionStorage.setItem('latestAnalysis', JSON.stringify(analysisPayload));
        } catch (storageError) {
          console.warn('[ASSISTANT] Failed to persist analysis response to sessionStorage:', storageError);
        }

        router.push(`/assistant/task/${token}`);
        setAttachedFiles([]);
        setInputText('');
        return;
      }

  const response = await fetch(apiUrl('/api/assistant/query-v2'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: inputText,
          top_k: 5,
          threshold: 0.7,
          validate: true,
          task_name: taskOption,
          user_id: userId,
          user_email: userData.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const detail =
          errorData && typeof errorData === 'object' && 'detail' in errorData
            ? (errorData.detail as string)
            : 'Failed to fetch answer';
        throw new Error(detail);
      }

      const data: AssistantResponse = await response.json();
      const rawToken =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const token = `gen-${rawToken}`;

      const payload = {
        token,
        task: taskOption,
        type: 'general',
        query: inputText,
        created_at: new Date().toISOString(),
        response: data,
      };

      try {
        sessionStorage.setItem(`assistantTask:${token}`, JSON.stringify(payload));
      } catch (storageError) {
        console.warn('[ASSISTANT] Failed to persist response to sessionStorage:', storageError);
      }

      try {
  await fetch(apiUrl('/api/assistant/general-history'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            task_name: taskOption,
            query: inputText,
            response: data,
            user_id: userId,
            user_email: userData.email,
            created_at: payload.created_at,
          }),
        });
      } catch (persistError) {
        console.warn('[ASSISTANT] Failed to persist general history:', persistError);
      }

      router.push(`/assistant/task/${token}`);
    } catch (err) {
      console.error('Error fetching answer:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while processing your request');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f7f9fc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '24px', 
            marginBottom: '16px',
            color: '#0E8587'
          }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/advotac_logo.png" alt="Advotac Logo" className="logo-image" />
            <div>
              <h2>Advotac</h2>
              <p>Legal AI Workspace</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            Overview
          </a>

          <a href="/assistant" className="nav-item active">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
            Assistant
          </a>

          <a href="/research" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
            Research
          </a>

          <a href="/drafting" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
            Drafting
          </a>

          <a href="/workflow" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            Workflow
          </a>

          <a href="/history" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            History
          </a>
        </nav>

        <div className="sidebar-footer">
          <a href="/settings" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
            Settings
          </a>

          <button onClick={handleSignOut} className="nav-item logout-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <h1>Assistant</h1>
          <div className="header-actions">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
              </svg>
              <input type="text" placeholder="Search conversations..." />
            </div>
            <button className="icon-button">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
              </svg>
            </button>
            <button 
              className="icon-button profile-button" 
              onClick={() => window.location.href = '/settings'}
              title="Go to Settings"
            >
              {userData?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userData.image} alt={userData.name} className="user-avatar-small" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="assistant-content">
          <div className="assistant-wrapper">
            {/* Top Icon */}
            <div className="assistant-icon">
              <div className="icon-square">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <circle cx="9" cy="10" r="1" fill="white"/>
                  <circle cx="12" cy="10" r="1" fill="white"/>
                  <circle cx="15" cy="10" r="1" fill="white"/>
                </svg>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="assistant-heading">How can I assist you today?</h1>
            <p className="assistant-subheading">Ask me anything and attach documents for deeper analysis.</p>

            {/* Input Area */}
            <div className="input-container">
              <div className="textarea-wrapper">
                <textarea 
                  className="assistant-textarea"
                  placeholder='Type your request or question here. E.g "What are the key elements required to establish a claim of promissory estoppel in contract law?"'
                  rows={4}
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                />
                <button
                  className="attach-file-btn"
                  title="Attach File"
                  onClick={handleFileAttach}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
              </div>

              {/* Selected Task and Attached Files Display */}
              {attachedFiles.length > 0 && (
                <div className="attached-items">
                  {attachedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="file-tag">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                        <polyline points="13 2 13 9 20 9"/>
                      </svg>
                      <span>{file.name}</span>
                      <button className="remove-file-btn" onClick={() => removeFile(index)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="input-actions">
                <div className="task-select">
                  <label htmlFor="assistantTask">Select a task</label>
                  <select
                    id="assistantTask"
                    value={taskOption}
                    onChange={(event) => setTaskOption(event.target.value)}
                  >
                    {TASK_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="advanced-mode">
                  <span>Advanced Mode</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      id="advancedToggle"
                      checked={advancedMode}
                      onChange={() => setAdvancedMode((prev) => !prev)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button 
                    className="help-btn" 
                    title="Click for info"
                    onClick={() => alert('Standard Mode: 2 credits per request\nAdvanced Mode: 5 credits per request')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="submit-button get-result-button"
                onClick={handleGetAnswer}
                disabled={isProcessing || !inputText.trim()}
              >
                {isProcessing ? (
                  <>
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Get Answer'
                )}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="error-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

