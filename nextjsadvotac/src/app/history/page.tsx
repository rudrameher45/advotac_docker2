'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import './history.css';

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface HistoryEntry {
  id: number;
  entry_type: 'analysis' | 'general';
  user_id: string;
  task_name: string;
  question: string;
  answer: string;
  created_at: string;
  response_time_ms?: number | null;
  token?: string | null;
}

import { apiUrl } from '../../lib/api';

function formatDate(isoString: string) {
  try {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function createAnswerSnippet(answer: string, length = 140) {
  if (!answer) return '';
  const clean = answer.replace(/\s+/g, ' ').trim();
  if (clean.length <= length) {
    return clean;
  }
  return `${clean.slice(0, length)}…`;
}

export default function HistoryPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (token: string, userId: string, email?: string | null) => {
      setHistoryLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (userId) params.append('user_id', userId);
        if (email) params.append('user_email', email);
        params.append('limit', '50');

  const response = await fetch(apiUrl(`/api/assistant/history?${params.toString()}`), {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.status === 404) {
          setHistory([]);
          setError('No assistant history found for this account yet. Ask a question to see it here.');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const detail =
            errorData && typeof errorData === 'object' && 'detail' in errorData
              ? (errorData.detail as string)
              : 'Failed to load assistant history';
          throw new Error(detail);
        }

        const items: HistoryEntry[] = await response.json();
        setHistory(items);
      } catch (err) {
        console.error('[HISTORY] Failed to fetch history:', err);
        setHistory([]);
        setError(err instanceof Error ? err.message : 'Failed to load assistant history');
      } finally {
        setHistoryLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const initialise = async () => {
      const token = localStorage.getItem('authToken');
      const rawUser = localStorage.getItem('userData');

      if (!token || !rawUser) {
        router.push('/auth');
        return;
      }

      try {
        const parsed = JSON.parse(rawUser) as Partial<UserData> & Record<string, unknown>;
        const canonicalId = (parsed.id as string | undefined) || (parsed.email as string | undefined);

        if (!canonicalId || !parsed.email || !parsed.name) {
          throw new Error('Missing user profile data');
        }

        const normalizedUser: UserData = {
          id: canonicalId,
          name: parsed.name,
          email: parsed.email,
          image: parsed.image as string | undefined,
        };

        setUserData(normalizedUser);
        setLoading(false);

        await fetchHistory(token, canonicalId, parsed.email);
      } catch (err) {
        console.error('[HISTORY] Failed to initialise user session:', err);
        localStorage.clear();
        router.push('/auth');
      }
    };

    initialise();
  }, [fetchHistory, router]);

  const handleRefresh = async () => {
    const token = localStorage.getItem('authToken');
    if (!token || !userData) {
      router.push('/auth');
      return;
    }
    await fetchHistory(token, userData.id, userData.email);
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.location.replace('/auth');
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#f7f9fc',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '24px',
              marginBottom: '16px',
              color: '#0E8587',
            }}
          >
            Loading...
          </div>
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
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            Overview
          </a>

          <a href="/assistant" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            Assistant
          </a>

          <a href="/research" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Research
          </a>

          <a href="/drafting" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Drafting
          </a>

          <a href="/workflow" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Workflow
          </a>

          <a href="/history" className="nav-item active">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            History
          </a>
        </nav>

        <div className="sidebar-footer">
          <a href="/settings" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            Settings
          </a>

          <button onClick={handleSignOut} className="nav-item logout-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                clipRule="evenodd"
              />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <h1>History</h1>
          <div className="header-actions">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              <input type="text" placeholder="Search history..." disabled />
            </div>
            <button className="icon-button" onClick={handleRefresh} title="Refresh history">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4v4h.01L4 4zm12.243.757A8 8 0 104.757 15.243l1.414-1.414A6 6 0 1116 10h-3l4 4 4-4h-3a8 8 0 00-1.757-5.243z" />
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
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="history-content">
          {historyLoading ? (
            <div className="history-loading">
              <div className="spinner"></div>
              <p>Fetching assistant history…</p>
            </div>
          ) : error ? (
            <div className="history-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0E8587" strokeWidth="1.5">
                <path d="M5 4h14a2 2 0 012 2v10l-4 4H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                <path d="M15 2v4" />
                <path d="M9 2v4" />
                <path d="M3 10h18" />
              </svg>
              <h2>No history yet</h2>
              <p>Run your first assistant query to see it logged here automatically.</p>
              <button className="primary-button" onClick={() => router.push('/assistant')}>
                Ask a question
              </button>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Task</th>
                    <th>Question</th>
                    <th>Answer</th>
                    <th>Response Time</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDate(entry.created_at)}</td>
                      <td>
                        <span className="history-task">{entry.task_name}</span>
                      </td>
                      <td>
                        <div className="history-question">{entry.question}</div>
                      </td>
                      <td>
                        <details className="history-answer-details">
                          <summary>{createAnswerSnippet(entry.answer)}</summary>
                          <pre className="history-answer-full">{entry.answer}</pre>
                        </details>
                      </td>
                      <td>
                        {entry.entry_type === 'analysis' && entry.response_time_ms != null
                          ? `${entry.response_time_ms} ms`
                          : '—'}
                      </td>
                      <td>
                        {entry.entry_type === 'general' && entry.token ? (
                          <button
                            type="button"
                            className="history-view-button"
                            onClick={() => router.push(`/assistant/task/${entry.token}`)}
                          >
                            Open
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
