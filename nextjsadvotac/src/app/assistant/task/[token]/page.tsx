'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';
import './result.css';

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AnalysisDocResult {
  token: string;
  task: string;
  query: string;
  summary: string;
  analysis: string;
  key_points: string[];
  keywords: string[];
  comparisons: string[];
  table_markdown?: string | null;
  truncated: boolean;
  input_characters: number;
  source: string;
  created_at: string;
}

interface GeneralSource {
  score: number;
  layer: string;
  collection?: string;
  doc_title?: string | null;
  section_number?: string | null;
  section_heading?: string | null;
  breadcrumbs?: string | null;
  snippet?: string | null;
  act_title?: string | null;
  context_path?: string | null;
  heading?: string | null;
  unit_id?: string | null;
}

interface GeneralTaskResponse {
  query: string;
  answer: string;
  expanded_queries: string[];
  sources: GeneralSource[];
  validation?: string | null;
}

interface GeneralTaskResult {
  type: 'general';
  token: string;
  task: string;
  query: string;
  created_at: string;
  response: GeneralTaskResponse;
}

interface FollowUpEntry {
  id: string;
  query: string;
  created_at: string;
  response: GeneralTaskResponse | null;
  isLoading: boolean;
  error?: string | null;
}

interface StoredFollowUp {
  id: string;
  query: string;
  created_at: string;
  response: GeneralTaskResponse;
}

interface SelectedAnswer {
  id: string;
  question: string;
  response: GeneralTaskResponse;
}

type SuggestionTemplate = (query: string) => string;

const FALLBACK_SUGGESTION_TEMPLATES: SuggestionTemplate[] = [
  (query) => `Summarize the key legal principles around "${query}".`,
  (query) => `What statutory provisions are most relevant to "${query}"?`,
  (query) => `Are there landmark cases interpreting "${query}"?`,
  (query) => `How does "${query}" affect compliance obligations?`,
];

const FASTAPI_BASE_URL = 'http://localhost:8000';
const GENERAL_HISTORY_API_BASE = `${FASTAPI_BASE_URL}/api/assistant/general-history`;

function FormattedAnswer({ answer }: { answer: string }) {
  const formatAnswer = (text: string) => {
    let formatted = text
      .replace(/\*\*\*\*/g, '')
      .replace(/\*\*/g, '')
      .replace(/---/g, '\n')
      .trim();

    const sections: JSX.Element[] = [];
    const lines = formatted.split(/\n+/);

    let currentSection: string[] = [];
    let sectionKey = 0;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        return;
      }

      if (trimmedLine.match(/^[A-Z\s&/]+:/) || trimmedLine.match(/^Section \d+/i)) {
        if (currentSection.length > 0) {
          sections.push(
            <div key={sectionKey++} className="answer-paragraph">
              {currentSection.join(' ')}
            </div>,
          );
          currentSection = [];
        }
        sections.push(
          <h3 key={`h-${sectionKey++}`} className="answer-heading">
            {trimmedLine}
          </h3>,
        );
      } else if (trimmedLine.match(/^[\d\-\(]+[\)\.]?\s/) || trimmedLine.startsWith('-')) {
        if (currentSection.length > 0) {
          sections.push(
            <div key={sectionKey++} className="answer-paragraph">
              {currentSection.join(' ')}
            </div>,
          );
          currentSection = [];
        }
        sections.push(
          <div key={`li-${sectionKey++}`} className="answer-list-item">
            {trimmedLine}
          </div>,
        );
      } else {
        currentSection.push(trimmedLine);
      }
    });

    if (currentSection.length > 0) {
      sections.push(
        <div key={sectionKey++} className="answer-paragraph">
          {currentSection.join(' ')}
        </div>,
      );
    }

    return sections.length > 0 ? sections : <div className="answer-paragraph">{formatted}</div>;
  };

  return <div className="formatted-answer">{formatAnswer(answer)}</div>;
}

export default function AssistantAnalysisResult() {
  const router = useRouter();
  const params = useParams();
  const tokenParam = params.token as string;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisDocResult | null>(null);
  const [generalResult, setGeneralResult] = useState<GeneralTaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpEntry[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, SelectedAnswer>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, { value: string; error: string | null }>>({});
  const [analysisFollowUps, setAnalysisFollowUps] = useState<FollowUpEntry[]>([]);
  const [analysisCustomQuestion, setAnalysisCustomQuestion] = useState('');
  const [analysisCustomError, setAnalysisCustomError] = useState<string | null>(null);

  const generateFollowUpId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `fu-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const buildSuggestions = (response: GeneralTaskResponse | null, baseQuery: string) => {
    const suggestions: string[] = [];
    const normalizedBase = baseQuery?.trim() || 'this topic';

    const addSuggestion = (text: string | undefined | null) => {
      const trimmed = text?.trim();
      if (!trimmed) return;
      if (suggestions.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        return;
      }
      suggestions.push(trimmed);
    };

    response?.expanded_queries?.forEach((query) => addSuggestion(query));

    if (suggestions.length < 4) {
      FALLBACK_SUGGESTION_TEMPLATES.forEach((template) => {
        if (suggestions.length >= 4) return;
        addSuggestion(template(normalizedBase));
      });
    }

    return suggestions.slice(0, 4);
  };

  const isSuggestionPending = (suggestion: string) =>
    followUps.some(
      (entry) => entry.query.toLowerCase() === suggestion.toLowerCase() && entry.isLoading,
    );

  const anyFollowUpLoading = followUps.some((entry) => entry.isLoading);
  const isAnalysisSuggestionPending = (suggestion: string) =>
    analysisFollowUps.some(
      (entry) => entry.query.toLowerCase() === suggestion.toLowerCase() && entry.isLoading,
    );
  const anyAnalysisFollowUpLoading = analysisFollowUps.some((entry) => entry.isLoading);
  const selectedAnswerList = Object.values(selectedAnswers);
  const selectedAnswerCount = selectedAnswerList.length;

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const buildAnalysisExport = (payload: AnalysisDocResult) => {
    const lines: string[] = [];
    lines.push(`Task: ${payload.task}`);
    lines.push(`Original Query: ${payload.query}`);
    lines.push(`Source: ${payload.source}`);
    lines.push('');
    lines.push('Summary:');
    lines.push(payload.summary || 'No summary generated.');
    lines.push('');
    lines.push('Detailed Analysis:');
    lines.push(payload.analysis || 'No detailed analysis available.');
    lines.push('');
    if (payload.key_points.length > 0) {
      lines.push('Key Points:');
      payload.key_points.forEach((point, index) => {
        lines.push(`${index + 1}. ${point}`);
      });
      lines.push('');
    }
    if (payload.keywords.length > 0) {
      lines.push(`Keywords: ${payload.keywords.join(', ')}`);
      lines.push('');
    }
    if (payload.comparisons.length > 0) {
      lines.push('Comparative Insights:');
      payload.comparisons.forEach((entry, index) => {
        lines.push(`${index + 1}. ${entry}`);
      });
      lines.push('');
    }
    if (payload.table_markdown) {
      lines.push('Structured Comparison Table (Markdown):');
      lines.push(payload.table_markdown);
      lines.push('');
    }
    lines.push(`Input characters analyzed: ${payload.input_characters}`);
    if (payload.truncated) {
      lines.push('Note: Input was truncated to fit the token budget.');
    }
    return lines.join('\n');
  };

  const normalizeAnalysisResult = (raw: unknown, fallbackToken: string): AnalysisDocResult | null => {
    if (!raw || typeof raw !== 'object' || raw === null) {
      return null;
    }
    const record = raw as Record<string, unknown>;
    const token = typeof record.token === 'string' ? record.token : fallbackToken;
    const task = typeof record.task === 'string' ? record.task : 'Analysis Docs';
    const query = typeof record.query === 'string' ? record.query : '';
    const summary = typeof record.summary === 'string' ? record.summary : '';
    const analysis =
      typeof record.analysis === 'string'
        ? record.analysis
        : summary || (typeof record.analysis === 'number' ? String(record.analysis) : '');
    const keyPoints = Array.isArray(record.key_points)
      ? record.key_points.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    const keywords = Array.isArray(record.keywords)
      ? record.keywords.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    const comparisons = Array.isArray(record.comparisons)
      ? record.comparisons.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    const tableMarkdown =
      typeof record.table_markdown === 'string' && record.table_markdown.trim().length > 0
        ? record.table_markdown
        : null;

    return {
      token,
      task,
      query,
      summary,
      analysis,
      key_points: keyPoints,
      keywords,
      comparisons,
      table_markdown: tableMarkdown,
      truncated: Boolean(record.truncated),
      input_characters: typeof record.input_characters === 'number' ? record.input_characters : 0,
      source: typeof record.source === 'string' ? record.source : 'text',
      created_at: typeof record.created_at === 'string' ? record.created_at : new Date().toISOString(),
    };
  };

  const buildAnalysisSuggestions = (payload: AnalysisDocResult | null): string[] => {
    if (!payload) {
      return [];
    }

    const suggestions: string[] = [];
    const seen = new Set<string>();
    const baseQuery = payload.query?.trim() || 'this matter';

    const addSuggestion = (text: string | undefined | null) => {
      const cleaned = text?.trim();
      if (!cleaned) return;
      const normalized = cleaned.toLowerCase();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      suggestions.push(cleaned);
    };

    payload.keywords.slice(0, 4).forEach((keyword) => {
      addSuggestion(`How does ${keyword} apply under Indian law in this context?`);
      addSuggestion(`What statutory defences could counter ${keyword}?`);
    });

    if (suggestions.length < 6) {
      addSuggestion(`Which Indian precedents align with "${baseQuery}"?`);
      addSuggestion(`What compliance steps arise from "${baseQuery}" under Indian law?`);
      addSuggestion(`Identify emerging risks related to "${baseQuery}" in India.`);
      addSuggestion(`What remedies are available in India for disputes similar to "${baseQuery}"?`);
      addSuggestion(`How would courts balance equities in "${baseQuery}" situations?`);
      addSuggestion(`Does "${baseQuery}" trigger procedural obligations under the CrPC or CPC?`);
    }

    return suggestions.slice(0, 6);
  };

  const isQuestionInContext = (question: string, baseQuery: string) => {
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .match(/\b[a-z0-9]{3,}\b/g)
        ?.filter(Boolean) ?? [];

    const baseTokens = normalize(baseQuery);
    if (baseTokens.length === 0) {
      return true;
    }

    const questionTokens = normalize(question);
    if (questionTokens.length === 0) {
      return false;
    }

    return questionTokens.some((token) => baseTokens.includes(token));
  };

  useEffect(() => {
    if (!tokenParam.startsWith('gen-') || !generalResult) {
      setCustomInputs((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }

    setCustomInputs((prev) => {
      const ids = [generalResult.token, ...followUps.map((entry) => entry.id)];
      const next: Record<string, { value: string; error: string | null }> = {};
      let changed = false;

      ids.forEach((id) => {
        if (prev[id]) {
          next[id] = prev[id];
        } else {
          next[id] = { value: '', error: null };
          changed = true;
        }
      });

      if (Object.keys(prev).length !== ids.length) {
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [followUps, generalResult, tokenParam]);

  useEffect(() => {
    if (!analysis || !tokenParam.startsWith('ana-')) {
      setAnalysisFollowUps([]);
      setAnalysisCustomQuestion('');
      setAnalysisCustomError(null);
      return;
    }
    setAnalysisFollowUps([]);
    setAnalysisCustomQuestion('');
    setAnalysisCustomError(null);
  }, [analysis?.token, tokenParam]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('userData');

    if (!token || !user) {
      router.push('/auth');
      return;
    }

    try {
      const parsed = JSON.parse(user) as UserData;
      setUserData(parsed);
      setAuthLoading(false);
    } catch (err) {
      console.error('[ASSISTANT RESULT] Failed to parse user data:', err);
      localStorage.clear();
      router.push('/auth');
    }
  }, [router]);

  useEffect(() => {
    if (authLoading || !tokenParam || !userData) {
      return;
    }

    setError(null);
    setSelectedAnswers({});
    setCustomInputs({});
    setPdfError(null);

    if (tokenParam.startsWith('gen-')) {
      setAnalysisLoading(true);
      setGeneralResult(null);
      setAnalysis(null);
      setFollowUps([]);

      const restoreFromSession = () => {
        try {
          const stored = sessionStorage.getItem(`assistantTask:${tokenParam}`);
          if (stored) {
            const parsed = JSON.parse(stored) as
              | GeneralTaskResult
              | { general?: GeneralTaskResult; followUps?: StoredFollowUp[] };

            let storedGeneral: GeneralTaskResult | null = null;
            let storedFollowUps: StoredFollowUp[] = [];

            if (parsed && typeof parsed === 'object' && 'general' in parsed && parsed.general) {
              storedGeneral = parsed.general;
              if (Array.isArray(parsed.followUps)) {
                storedFollowUps = parsed.followUps;
              }
            } else if (
              parsed &&
              typeof parsed === 'object' &&
              (parsed as GeneralTaskResult).type === 'general'
            ) {
              storedGeneral = parsed as GeneralTaskResult;
            }

            if (storedGeneral && storedGeneral.token === tokenParam) {
              setGeneralResult(storedGeneral);
              if (storedFollowUps.length > 0) {
                setFollowUps(
                  storedFollowUps.map((entry) => ({
                    id: entry.id,
                    query: entry.query,
                    created_at: entry.created_at,
                    response: entry.response,
                    isLoading: false,
                    error: null,
                  })),
                );
              }
              setAnalysisLoading(false);
              return true;
            }
          }
        } catch (storageError) {
          console.warn('[ASSISTANT RESULT] Failed to read general result:', storageError);
        }
        return false;
      };

      if (restoreFromSession()) {
        return;
      }

      const fetchGeneralResult = async () => {
        try {
          const params = new URLSearchParams();
          if (userData.id) params.append('user_id', userData.id);
          if (userData.email) params.append('user_email', userData.email);

          const authToken = localStorage.getItem('authToken');
          const queryString = params.toString();
          const url = queryString
            ? `${GENERAL_HISTORY_API_BASE}/${tokenParam}?${queryString}`
            : `${GENERAL_HISTORY_API_BASE}/${tokenParam}`;
          const response = await fetch(url, {
            headers: {
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
          });

          if (!response.ok) {
            const body = await response.json().catch(() => null);
            const detail =
              body && typeof body === 'object' && 'detail' in body
                ? (body.detail as string)
                : 'Unable to load the saved response for this task.';
            throw new Error(detail);
          }

          const payload = await response.json();
          if (!payload || typeof payload !== 'object') {
            throw new Error('Received malformed general task response.');
          }

          const normalized: GeneralTaskResult = {
            type: 'general',
            token: payload.token ?? tokenParam,
            task: payload.task_name ?? 'General',
            query: payload.query ?? '',
            created_at: payload.created_at ?? new Date().toISOString(),
            response: {
              query: payload.response?.query ?? payload.query ?? '',
              answer: payload.response?.answer ?? '',
              expanded_queries: Array.isArray(payload.response?.expanded_queries)
                ? payload.response.expanded_queries
                : [],
              sources: Array.isArray(payload.response?.sources) ? payload.response.sources : [],
              validation: payload.response?.validation ?? null,
            },
          };

          setGeneralResult(normalized);
          setAnalysisLoading(false);

          try {
            const storagePayload = {
              general: normalized,
              followUps: [],
            };
            sessionStorage.setItem(`assistantTask:${tokenParam}`, JSON.stringify(storagePayload));
          } catch (storageError) {
            console.warn('[ASSISTANT RESULT] Failed to cache general result:', storageError);
          }
        } catch (fetchError) {
          console.error('[ASSISTANT RESULT] General fetch failed:', fetchError);
          const message =
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load the saved response for this task.';
          setError(message);
          setAnalysisLoading(false);
        }
      };

      fetchGeneralResult();
      return;
    }

    setGeneralResult(null);
    setAnalysis(null);
    setAnalysisLoading(true);

    const restoreAnalysis = () => {
      try {
        const stored = sessionStorage.getItem(`analysisTask:${tokenParam}`);
        if (stored) {
          const parsed = JSON.parse(stored) as unknown;
          const normalized = normalizeAnalysisResult(parsed, tokenParam);
          if (normalized && normalized.token === tokenParam) {
            setAnalysis(normalized);
            setAnalysisLoading(false);
            return true;
          }
        }
      } catch (storageError) {
        console.warn('[ASSISTANT RESULT] Failed to read analysis result:', storageError);
      }

      try {
        const cachedItem = sessionStorage.getItem('latestAnalysis');
        if (cachedItem) {
          const parsed = JSON.parse(cachedItem) as unknown;
          const normalized = normalizeAnalysisResult(parsed, tokenParam);
          if (normalized && normalized.token === tokenParam) {
            setAnalysis(normalized);
            setAnalysisLoading(false);
            return true;
          }
        }
      } catch (cacheError) {
        console.warn('[ASSISTANT RESULT] Failed to read cached analysis:', cacheError);
      }

      return false;
    };

    if (restoreAnalysis()) {
      return;
    }

    setAnalysisLoading(false);
    setError('Unable to locate the saved analysis result for this task.');
  }, [authLoading, tokenParam, userData]);

  useEffect(() => {
    if (!generalResult || !tokenParam.startsWith('gen-')) {
      return;
    }

    const persistableFollowUps = followUps
      .filter((entry) => entry.response && !entry.isLoading && !entry.error)
      .map((entry) => ({
        id: entry.id,
        query: entry.query,
        created_at: entry.created_at,
        response: entry.response as GeneralTaskResponse,
      }));

    const storagePayload = {
      general: generalResult,
      followUps: persistableFollowUps,
    };

    try {
      sessionStorage.setItem(`assistantTask:${tokenParam}`, JSON.stringify(storagePayload));
    } catch (storageError) {
      console.warn('[ASSISTANT RESULT] Failed to persist session state:', storageError);
    }
  }, [followUps, generalResult, tokenParam]);

  const handleSuggestionClick = async (suggestion: string) => {
    const trimmed = suggestion.trim();
    if (!trimmed) {
      return;
    }

    if (!generalResult) {
      alert('Please wait for the task result to load before requesting follow-ups.');
      return;
    }

    if (isGeneratingPdf || isGeneratingDoc) {
      return;
    }

    if (!userData) {
      alert('Please sign in to continue.');
      return;
    }

    if (
      followUps.some(
        (entry) => entry.query.toLowerCase() === trimmed.toLowerCase() && entry.isLoading,
      )
    ) {
      return;
    }

    const userId = userData.id || userData.email || null;
    if (!userId || !userData.email) {
      alert('Unable to identify the current user. Please sign in again.');
      return;
    }

    const entryId = generateFollowUpId();
    const createdAt = new Date().toISOString();
    const taskNameForApi = generalResult.task ?? 'General';

    setFollowUps((prev) => [
      ...prev,
      {
        id: entryId,
        query: trimmed,
        created_at: createdAt,
        response: null,
        isLoading: true,
        error: null,
      },
    ]);

    try {
      const response = await fetch(`${FASTAPI_BASE_URL}/api/assistant/query-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: trimmed,
          top_k: 5,
          threshold: 0.7,
          validate: true,
          task_name: taskNameForApi,
          user_id: userId,
          user_email: userData.email,
        }),
      });

      const rawBody = await response.text();
      let payload: unknown = null;
      if (rawBody) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          payload = null;
        }
      }

      if (!response.ok) {
        const detail =
          payload && typeof payload === 'object' && 'detail' in payload
            ? (payload as { detail?: string }).detail
            : rawBody?.trim() || undefined;
        throw new Error(detail ?? 'Unable to generate a follow-up answer.');
      }

      const normalizedPayload = (payload ?? {}) as Partial<GeneralTaskResponse>;
      const normalizedResponse: GeneralTaskResponse = {
        query: normalizedPayload.query ?? trimmed,
        answer: normalizedPayload.answer ?? '',
        expanded_queries: Array.isArray(normalizedPayload.expanded_queries)
          ? normalizedPayload.expanded_queries
          : [],
        sources: Array.isArray(normalizedPayload.sources)
          ? (normalizedPayload.sources as GeneralTaskResponse['sources'])
          : [],
        validation: normalizedPayload.validation ?? null,
      };

      setFollowUps((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? { ...entry, response: normalizedResponse, isLoading: false, error: null }
            : entry,
        ),
      );
      void persistFollowUpHistory(entryId, trimmed, normalizedResponse, createdAt);
    } catch (followUpError) {
      console.error('[ASSISTANT RESULT] Follow-up generation failed:', followUpError);
      const message =
        followUpError instanceof Error
          ? followUpError.message
          : 'Unable to generate the follow-up answer.';
      setFollowUps((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, isLoading: false, error: message } : entry,
        ),
      );
    }
  };

  const runAnalysisFollowUp = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }

    if (isGeneratingPdf || isGeneratingDoc) {
      return;
    }

    if (!userData) {
      alert('Please sign in to continue.');
      return;
    }

    if (!analysis) {
      setAnalysisCustomError('Analysis result is unavailable. Please reload the task.');
      return;
    }

    if (
      analysisFollowUps.some(
        (entry) => entry.query.toLowerCase() === trimmed.toLowerCase() && entry.isLoading,
      )
    ) {
      return;
    }

    const userId = userData.id || userData.email || null;
    if (!userId || !userData.email) {
      alert('Unable to identify the current user. Please sign in again.');
      return;
    }

    const entryId = generateFollowUpId();
    const createdAt = new Date().toISOString();

    setAnalysisFollowUps((prev) => [
      ...prev,
      {
        id: entryId,
        query: trimmed,
        created_at: createdAt,
        response: null,
        isLoading: true,
        error: null,
      },
    ]);

    try {
      const response = await fetch(`${FASTAPI_BASE_URL}/api/assistant/query-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: trimmed,
          top_k: 5,
          threshold: 0.7,
          validate: true,
          task_name: 'Analysis Docs Follow-up',
          user_id: userId,
          user_email: userData.email,
        }),
      });

      const rawBody = await response.text();
      let payload: unknown = null;
      if (rawBody) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          payload = null;
        }
      }

      if (!response.ok) {
        const detail =
          payload && typeof payload === 'object' && 'detail' in payload
            ? (payload as { detail?: string }).detail
            : rawBody?.trim() || undefined;
        throw new Error(detail ?? 'Unable to generate an analysis follow-up answer.');
      }

      const normalizedPayload = (payload ?? {}) as Partial<GeneralTaskResponse>;
      const normalizedResponse: GeneralTaskResponse = {
        query: normalizedPayload.query ?? trimmed,
        answer: normalizedPayload.answer ?? '',
        expanded_queries: Array.isArray(normalizedPayload.expanded_queries)
          ? normalizedPayload.expanded_queries
          : [],
        sources: Array.isArray(normalizedPayload.sources)
          ? (normalizedPayload.sources as GeneralTaskResponse['sources'])
          : [],
        validation: normalizedPayload.validation ?? null,
      };

      setAnalysisFollowUps((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? { ...entry, response: normalizedResponse, isLoading: false, error: null }
            : entry,
        ),
      );
      setAnalysisCustomError(null);
    } catch (followUpError) {
      console.error('[ASSISTANT RESULT] Analysis follow-up failed:', followUpError);
      const message =
        followUpError instanceof Error
          ? followUpError.message
          : 'Unable to generate the follow-up answer.';
      setAnalysisFollowUps((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, isLoading: false, error: message } : entry,
        ),
      );
      setAnalysisCustomError(message);
    }
  };

  const handleAnalysisSuggestionClick = (suggestion: string) => {
    void runAnalysisFollowUp(suggestion);
  };

  const handleAnalysisCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!analysis) {
      setAnalysisCustomError('Analysis result is unavailable. Please reload the task.');
      return;
    }

    const trimmed = analysisCustomQuestion.trim();
    if (!trimmed) {
      setAnalysisCustomError('Please enter a follow-up question.');
      return;
    }

    if (!isQuestionInContext(trimmed, analysis.query)) {
      setAnalysisCustomError('Please keep your follow-up related to the original analysis.');
      return;
    }

    setAnalysisCustomQuestion('');
    setAnalysisCustomError(null);
    void runAnalysisFollowUp(trimmed);
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.location.replace('/auth');
  };

  const handleDownload = () => {
    if (generalResult) {
      const taskSlug = (generalResult.task || 'General').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const blob = new Blob([generalResult.response.answer], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `advotac-${taskSlug}-${generalResult.token}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
  };

  const handleCopy = async () => {
    try {
      if (generalResult) {
        await navigator.clipboard.writeText(generalResult.response.answer);
        alert('Answer copied to clipboard.');
        return;
      }

      if (!analysis) return;

      await navigator.clipboard.writeText(buildAnalysisExport(analysis));
      alert('Analysis copied to clipboard.');
    } catch (err) {
      console.error('[ASSISTANT RESULT] Copy failed:', err);
      alert('Unable to copy content. Please copy manually.');
    }
  };

  const handleRetry = () => {
    if (tokenParam.startsWith('gen-')) {
      router.push('/assistant');
      return;
    }

    setAnalysisLoading(true);
    setError(null);
    sessionStorage.removeItem('latestAnalysis');
    window.location.reload();
  };

  const handleCustomQuestionSubmit = (
    event: FormEvent<HTMLFormElement>,
    cardId: string,
    baseQuery: string,
  ) => {
    event.preventDefault();

    const currentValue = customInputs[cardId]?.value ?? '';
    const trimmed = currentValue.trim();
    if (!trimmed) {
      setCustomInputs((prev) => ({
        ...prev,
        [cardId]: {
          value: currentValue,
          error: 'Please enter a follow-up question.',
        },
      }));
      return;
    }

    if (!generalResult) {
      setCustomInputs((prev) => ({
        ...prev,
        [cardId]: {
          value: currentValue,
          error: 'Follow-up questions are only available for saved task results.',
        },
      }));
      return;
    }

    if (!isQuestionInContext(trimmed, baseQuery)) {
      setCustomInputs((prev) => ({
        ...prev,
        [cardId]: {
          value: currentValue,
          error: 'Please keep your follow-up related to the original request.',
        },
      }));
      return;
    }

    setCustomInputs((prev) => ({
      ...prev,
      [cardId]: {
        value: '',
        error: null,
      },
    }));

    void handleSuggestionClick(trimmed);
  };

  const toggleAnswerSelection = (
    id: string,
    question: string,
    response: GeneralTaskResponse | null,
  ) => {
    if (!response) {
      alert('Answer is still generating. Please try again once it is ready.');
      return;
    }

    setSelectedAnswers((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { id, question, response };
      }
      return next;
    });
    setPdfError(null);
  };

  const loadJsPdf = async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const globalWindow = window as unknown as {
      jsPDF?: unknown;
      jspdf?: { jsPDF?: unknown };
    };

    if (globalWindow.jspdf?.jsPDF) {
      return globalWindow.jspdf.jsPDF as new (...args: any[]) => {
        [key: string]: any;
      };
    }

    if (globalWindow.jsPDF) {
      return globalWindow.jsPDF as new (...args: any[]) => {
        [key: string]: any;
      };
    }

    const existingScript = document.getElementById('jspdf-script') as HTMLScriptElement | null;
    if (existingScript) {
      return new Promise<new (...args: any[]) => { [key: string]: any }>((resolve, reject) => {
        existingScript.addEventListener('load', () => {
          const ctor = globalWindow.jspdf?.jsPDF || globalWindow.jsPDF;
          if (ctor) {
            resolve(ctor as new (...args: any[]) => { [key: string]: any });
          } else {
            reject(new Error('PDF generator unavailable.'));
          }
        });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load PDF script.')));
      });
    }

    return new Promise<new (...args: any[]) => { [key: string]: any }>((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'jspdf-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async = true;
      script.onload = () => {
        const ctor = globalWindow.jspdf?.jsPDF || globalWindow.jsPDF;
        if (ctor) {
          resolve(ctor as new (...args: any[]) => { [key: string]: any });
        } else {
          reject(new Error('PDF generator unavailable.'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF generator.'));
      document.body.appendChild(script);
    });
  };

  const handleGeneratePdf = async () => {
    if (!generalResult && analysis) {
      setPdfError(null);
      setIsGeneratingPdf(true);

      try {
        const JsPdfConstructor = await loadJsPdf();
        if (!JsPdfConstructor) {
          throw new Error('PDF generator unavailable.');
        }

        const doc = new JsPdfConstructor({ unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 48;
        const contentWidth = pageWidth - margin * 2;
        const lineHeight = 16;
        const userName = userData?.name || userData?.email || 'Advotac User';
        const generatedAt = new Date().toLocaleString();
        let cursorY = margin;

        const ensureSpace = (requiredSpace: number) => {
          if (cursorY + requiredSpace > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }
        };

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Advotac Analysis Report', margin, cursorY);
        cursorY += 28;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Name of User: ${userName}`, margin, cursorY);
        cursorY += 18;
        doc.text(`Generated At: ${generatedAt}`, margin, cursorY);
        cursorY += 24;
        doc.text(`Source: ${analysis.source}`, margin, cursorY);
        cursorY += 24;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(14, 133, 135);
        doc.text('Summary', margin, cursorY);
        cursorY += 18;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.splitTextToSize(analysis.summary, contentWidth).forEach((line: string) => {
          ensureSpace(lineHeight);
          doc.text(line, margin, cursorY);
          cursorY += lineHeight;
        });
        cursorY += 12;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(14, 133, 135);
        doc.text('Detailed Analysis', margin, cursorY);
        cursorY += 18;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.splitTextToSize(analysis.analysis, contentWidth).forEach((line: string) => {
          ensureSpace(lineHeight);
          doc.text(line, margin, cursorY);
          cursorY += lineHeight;
        });
        cursorY += 12;

        if (analysis.key_points.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(14, 133, 135);
          doc.text('Key Points', margin, cursorY);
          cursorY += 18;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          analysis.key_points.forEach((point, index) => {
            ensureSpace(lineHeight);
            const text = `${index + 1}. ${point}`;
            doc.text(doc.splitTextToSize(text, contentWidth), margin, cursorY);
            cursorY += lineHeight;
          });
          cursorY += 12;
        }

        if (analysis.keywords.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(14, 133, 135);
          doc.text('Keywords', margin, cursorY);
          cursorY += 18;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          const keywordLine = analysis.keywords.join(', ');
          doc.splitTextToSize(keywordLine, contentWidth).forEach((line: string) => {
            ensureSpace(lineHeight);
            doc.text(line, margin, cursorY);
            cursorY += lineHeight;
          });
          cursorY += 12;
        }

        if (analysis.comparisons.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(14, 133, 135);
          doc.text('Comparative Insights', margin, cursorY);
          cursorY += 18;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          analysis.comparisons.forEach((item, index) => {
            ensureSpace(lineHeight);
            doc.text(doc.splitTextToSize(`${index + 1}. ${item}`, contentWidth), margin, cursorY);
            cursorY += lineHeight;
          });
          cursorY += 12;
        }

        if (analysis.table_markdown) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(14, 133, 135);
          doc.text('Structured Comparison (Markdown)', margin, cursorY);
          cursorY += 18;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.splitTextToSize(analysis.table_markdown, contentWidth).forEach((line: string) => {
            ensureSpace(lineHeight);
            doc.text(line, margin, cursorY);
            cursorY += lineHeight;
          });
          cursorY += 12;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(14, 133, 135);
        doc.text('Metadata', margin, cursorY);
        cursorY += 16;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const metadataLines = [
          `Original Query: ${analysis.query}`,
          `Input Characters: ${analysis.input_characters}`,
          analysis.truncated ? 'Note: Input was truncated to fit the token budget.' : null,
        ].filter(Boolean) as string[];
        metadataLines.forEach((line) => {
          ensureSpace(lineHeight);
          doc.text(doc.splitTextToSize(line, contentWidth), margin, cursorY);
          cursorY += lineHeight;
        });
        const totalPages = doc.getNumberOfPages();
        for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
          doc.setPage(pageIndex);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(120, 120, 120);
          doc.text('Generated by Advotac', margin, pageHeight - margin / 2);
        }

        doc.save(`advotac-analysis-${analysis.token}.pdf`);
      } catch (pdfGenerationError) {
        console.error('[ASSISTANT RESULT] Analysis PDF generation failed:', pdfGenerationError);
        const message =
          pdfGenerationError instanceof Error
            ? pdfGenerationError.message
            : 'Unable to generate PDF. Please try again later.';
        setPdfError(message);
      } finally {
        setIsGeneratingPdf(false);
      }
      return;
    }

    if (selectedAnswerCount === 0) {
      setPdfError('Please add at least one answer to the result before generating a PDF.');
      return;
    }

    if (!userData) {
      setPdfError('Please sign in to generate a PDF.');
      return;
    }

    setPdfError(null);
    setIsGeneratingPdf(true);

    try {
      const JsPdfConstructor = await loadJsPdf();
      if (!JsPdfConstructor) {
        throw new Error('PDF generator unavailable.');
      }

      const doc = new JsPdfConstructor({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      const lineHeight = 16;
      const userName = userData.name || userData.email || 'Advotac User';
      const generatedAt = new Date().toLocaleString();
      let cursorY = margin;

      const ensureSpace = (requiredSpace: number) => {
        if (cursorY + requiredSpace > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Advotac Result Bundle', margin, cursorY);
      cursorY += 28;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Name of User: ${userName}`, margin, cursorY);
      cursorY += 18;
      doc.text(`Generated At: ${generatedAt}`, margin, cursorY);
      cursorY += 24;

      selectedAnswerList.forEach((entry, index) => {
        const answer = entry.response.answer || 'No answer available.';
        const questionHeader = `Question ${index + 1}`;

        ensureSpace(lineHeight * 4);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(14, 133, 135);
        doc.text(questionHeader, margin, cursorY);
        cursorY += 18;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const questionLines = doc.splitTextToSize(entry.question, contentWidth);
        questionLines.forEach((line: string) => {
          ensureSpace(lineHeight);
          doc.text(line, margin, cursorY);
          cursorY += lineHeight;
        });

        ensureSpace(lineHeight * 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const answerLines = doc.splitTextToSize(answer, contentWidth);
        answerLines.forEach((line: string) => {
          ensureSpace(lineHeight);
          doc.text(line, margin, cursorY);
          cursorY += lineHeight;
        });

        if (entry.response.sources && entry.response.sources.length > 0) {
          ensureSpace(lineHeight * 2);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text('Sources:', margin, cursorY);
          cursorY += lineHeight;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          entry.response.sources.forEach((source, sourceIndex) => {
            const labelParts = [
              source.layer ? `Layer ${source.layer}` : null,
              source.collection || null,
              source.doc_title || source.act_title || source.section_heading || source.heading || null,
            ]
              .filter(Boolean)
              .join(' • ');
            const snippet = source.snippet ? `Snippet: ${source.snippet}` : null;
            const sourceLines = doc.splitTextToSize(
              `${sourceIndex + 1}. ${labelParts}${snippet ? `\n${snippet}` : ''}`,
              contentWidth,
            );
            sourceLines.forEach((line: string) => {
              ensureSpace(lineHeight);
              doc.text(line, margin + 12, cursorY);
              cursorY += lineHeight;
            });
            cursorY += 4;
          });
        }

        cursorY += 12;
      });

      ensureSpace(40);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const generatedByText = 'Generated by Advotac';
      const totalPages = doc.getNumberOfPages();
      for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
        doc.setPage(pageIndex);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(generatedByText, margin, pageHeight - margin / 2);
      }

      doc.save(`advotac-results-${Date.now()}.pdf`);
    } catch (pdfGenerationError) {
      console.error('[ASSISTANT RESULT] PDF generation failed:', pdfGenerationError);
      const message =
        pdfGenerationError instanceof Error
          ? pdfGenerationError.message
          : 'Unable to generate PDF. Please try again later.';
      setPdfError(message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateDoc = async () => {
    if (!generalResult && analysis) {
      setPdfError(null);
      setIsGeneratingDoc(true);

      try {
        const userName = userData?.name || userData?.email || 'Advotac User';
        const generatedAt = new Date().toLocaleString();
        const htmlParts: string[] = [
          '<html><head><meta charset="utf-8" />',
          '<style>body{font-family:Arial, sans-serif;line-height:1.6;font-size:12pt;color:#111827;}h1{color:#0E8587;}h2{color:#0E8587;margin-top:24px;}p{margin:8px 0;}ul{margin:8px 0 8px 20px;}li{margin:4px 0;}strong{color:#0E8587;} .divider{margin:24px 0;border-top:1px solid #e5e7eb;} .meta{color:#374151;} .disclaimer{font-size:10px;color:#6b7280;margin-top:24px;} .pill{display:inline-block;margin:4px 8px 0 0;padding:4px 10px;border-radius:999px;background:#e6f7f8;color:#0E8587;font-size:11pt;font-weight:600;} pre{background:#f9fafb;padding:16px;border-radius:12px;overflow-x:auto;}</style>',
          '</head><body>',
          '<h1>Advotac Analysis Report</h1>',
          `<p class="meta"><strong>Name of User:</strong> ${escapeHtml(userName)}</p>`,
          `<p class="meta"><strong>Generated At:</strong> ${escapeHtml(generatedAt)}</p>`,
          `<p class="meta"><strong>Source:</strong> ${escapeHtml(analysis.source)}</p>`,
          '<div class="divider"></div>',
          '<h2>Summary</h2>',
          `<p>${escapeHtml(analysis.summary || 'No summary available.')}</p>`,
          '<h2>Detailed Analysis</h2>',
          `<p>${escapeHtml(analysis.analysis || 'No detailed analysis available.')}</p>`,
        ];

        if (analysis.key_points.length > 0) {
          htmlParts.push('<h2>Key Points</h2>');
          htmlParts.push('<ul>');
          analysis.key_points.forEach((point) => {
            htmlParts.push(`<li>${escapeHtml(point)}</li>`);
          });
          htmlParts.push('</ul>');
        }

        if (analysis.keywords.length > 0) {
          htmlParts.push('<h2>Keywords</h2>');
          htmlParts.push('<div>');
          analysis.keywords.forEach((keyword) => {
            htmlParts.push(`<span class="pill">${escapeHtml(keyword)}</span>`);
          });
          htmlParts.push('</div>');
        }

        if (analysis.comparisons.length > 0) {
          htmlParts.push('<h2>Comparative Insights</h2>');
          htmlParts.push('<ul>');
          analysis.comparisons.forEach((item) => {
            htmlParts.push(`<li>${escapeHtml(item)}</li>`);
          });
          htmlParts.push('</ul>');
        }

        if (analysis.table_markdown) {
          htmlParts.push('<h2>Structured Comparison (Markdown)</h2>');
          htmlParts.push(`<pre>${escapeHtml(analysis.table_markdown)}</pre>`);
        }

        htmlParts.push('<h2>Metadata</h2>');
        htmlParts.push('<ul>');
        htmlParts.push(`<li><strong>Original Query:</strong> ${escapeHtml(analysis.query)}</li>`);
        htmlParts.push(`<li><strong>Input Characters:</strong> ${analysis.input_characters}</li>`);
        if (analysis.truncated) {
          htmlParts.push('<li><strong>Note:</strong> Input was truncated to fit the token budget.</li>');
        }
        htmlParts.push('</ul>');

        htmlParts.push('</body></html>');

        const blob = new Blob([htmlParts.join('')], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `advotac-analysis-${analysis.token}.docx`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (docError) {
        console.error('[ASSISTANT RESULT] Analysis DOC generation failed:', docError);
        const message =
          docError instanceof Error
            ? docError.message
            : 'Unable to download document. Please try again later.';
        setPdfError(message);
      } finally {
        setIsGeneratingDoc(false);
      }
      return;
    }

    if (selectedAnswerCount === 0) {
      setPdfError('Please add at least one answer to the result before downloading a document.');
      return;
    }

    setPdfError(null);
    setIsGeneratingDoc(true);

    try {
      const userName = userData?.name || userData?.email || 'Advotac User';
      const generatedAt = new Date().toLocaleString();
      const htmlParts: string[] = [
        '<html><head><meta charset="utf-8" />',
        '<style>body{font-family:Arial, sans-serif;line-height:1.6;font-size:12pt;color:#111827;}h1{color:#0E8587;}h2{color:#0E8587;margin-top:24px;}p{margin:8px 0;}ul{margin:8px 0 8px 20px;}li{margin:4px 0;}strong{color:#0E8587;} .divider{margin:24px 0;border-top:1px solid #e5e7eb;} .meta{color:#374151;} .disclaimer{font-size:10px;color:#6b7280;margin-top:24px;}</style>',
        '</head><body>',
        '<h1>Advotac Result Bundle</h1>',
        `<p class="meta"><strong>Name of User:</strong> ${escapeHtml(userName)}</p>`,
        `<p class="meta"><strong>Generated At:</strong> ${escapeHtml(generatedAt)}</p>`,
      ];

      selectedAnswerList.forEach((entry, index) => {
        htmlParts.push('<div class="divider"></div>');
        htmlParts.push(`<h2>Question ${index + 1}</h2>`);
        htmlParts.push(`<p><strong>Prompt:</strong> ${escapeHtml(entry.question)}</p>`);
        htmlParts.push('<p><strong>Answer:</strong></p>');

        const answerSegments = (entry.response.answer || 'No answer available.')
          .split(/\n+/)
          .map((segment) => segment.trim())
          .filter((segment) => segment.length > 0);

        if (answerSegments.length === 0) {
          htmlParts.push('<p>No answer available.</p>');
        } else {
          answerSegments.forEach((segment) => {
            htmlParts.push(`<p>${escapeHtml(segment)}</p>`);
          });
        }

        if (entry.response.sources && entry.response.sources.length > 0) {
          htmlParts.push('<p><strong>Sources:</strong></p>');
          htmlParts.push('<ul>');
          entry.response.sources.forEach((source, sourceIndex) => {
            const labels = [
              source.layer ? `Layer ${source.layer}` : null,
              source.collection || null,
              source.doc_title || source.act_title || source.section_heading || source.heading || null,
            ]
              .filter(Boolean)
              .join(' • ');
            const labelText = labels ? `${sourceIndex + 1}. ${labels}` : `${sourceIndex + 1}. Source`;
            const snippetText = source.snippet
              ? `<br/><em>Snippet:</em> ${escapeHtml(source.snippet)}`
              : '';
            htmlParts.push(`<li>${escapeHtml(labelText)}${snippetText}</li>`);
          });
          htmlParts.push('</ul>');
        }

        if (entry.response.validation) {
          htmlParts.push('<p><strong>Validation:</strong></p>');
          htmlParts.push(`<p>${escapeHtml(entry.response.validation)}</p>`);
        }
      });

      htmlParts.push('</body></html>');

      const blob = new Blob([htmlParts.join('')], {
        type: 'application/msword',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `advotac-results-${Date.now()}.doc`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (docError) {
      console.error('[ASSISTANT RESULT] DOC generation failed:', docError);
      const message =
        docError instanceof Error
          ? docError.message
          : 'Unable to download document. Please try again later.';
      setPdfError(message);
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const persistFollowUpHistory = async (
    entryId: string,
    query: string,
    response: GeneralTaskResponse,
    createdAt: string,
  ) => {
    if (!generalResult || !userData) {
      return;
    }

    const parentTaskName = generalResult.task || 'General';
    const followUpTaskName = `${parentTaskName} Follow-up`;

    try {
      await fetch(`${FASTAPI_BASE_URL}/api/assistant/general-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: entryId,
          parent_token: generalResult.token,
          task_name: followUpTaskName,
          query,
          response,
          user_id: userData.id || userData.email,
          user_email: userData.email,
          created_at: createdAt,
        }),
      });
    } catch (historyError) {
      console.warn('[ASSISTANT RESULT] Failed to persist follow-up history:', historyError);
    }
  };

  const renderGeneralResponse = (
    response: GeneralTaskResponse | null,
    query: string,
    options: {
      id: string;
      isPrimary: boolean;
      isLoading?: boolean;
      errorMessage?: string | null;
      isSelected: boolean;
      onToggleSelection: () => void;
    },
  ) => {
    const suggestions = response ? buildSuggestions(response, query) : [];
    const containerClass = options.isPrimary ? 'general-result' : 'general-result general-follow-up';
    const canSelect = Boolean(response && !options.isLoading && !options.errorMessage);
    const exportsInProgress = isGeneratingPdf || isGeneratingDoc;
    const customInput = customInputs[options.id] ?? { value: '', error: null };

    return (
      <div key={options.id} className={containerClass}>
        <div className="general-section">
          <h3>Prompt</h3>
          <p className="general-query">{query}</p>
        </div>

        <div className="general-section">
          <h3>Answer</h3>
          <div className="general-answer">
            {options.isLoading ? (
              <div className="follow-up-loading">Generating follow-up answer...</div>
            ) : options.errorMessage ? (
              <div className="assistant-error">{options.errorMessage}</div>
            ) : response ? (
              <FormattedAnswer answer={response.answer} />
            ) : (
              <div className="follow-up-loading">No answer available yet.</div>
            )}
          </div>
        </div>

        <div className="general-section answer-actions">
          <div className="answer-actions-row">
            <button
              type="button"
              className={`answer-action-button ${options.isSelected ? 'selected' : ''}`}
              onClick={options.onToggleSelection}
              disabled={!canSelect || exportsInProgress}
            >
              {options.isSelected ? 'Remove from Result' : 'Add to Result'}
            </button>
            <button
              type="button"
              className="answer-action-button primary"
              onClick={handleGeneratePdf}
              disabled={exportsInProgress || selectedAnswerCount === 0}
            >
              {isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF'}
            </button>
            <button
              type="button"
              className="answer-action-button primary secondary"
              onClick={handleGenerateDoc}
              disabled={exportsInProgress || selectedAnswerCount === 0}
            >
              {isGeneratingDoc ? 'Preparing Doc...' : 'Download Doc'}
            </button>
          </div>
          <p className="answer-actions-hint">
            {selectedAnswerCount > 0
              ? `${selectedAnswerCount} answer${selectedAnswerCount > 1 ? 's' : ''} selected for export.`
              : 'Select at least one answer to include it in the export.'}
          </p>
          {options.isPrimary && pdfError && <div className="assistant-error pdf-error">{pdfError}</div>}
        </div>

        {response && suggestions.length > 0 && (
          <div className="general-section general-suggestions">
            <h3>Suggested Follow-up Questions</h3>
            <p className="general-suggestions-hint">Select a question to generate a fresh response.</p>
            <div className="suggestion-buttons">
              {suggestions.map((text) => {
                const pending = isSuggestionPending(text);
                const disabled =
                  pending || Boolean(options.isLoading) || anyFollowUpLoading || exportsInProgress;
                return (
                  <button
                    key={`${options.id}-suggestion-${text}`}
                    className="suggestion-button"
                    onClick={() => void handleSuggestionClick(text)}
                    disabled={disabled}
                    type="button"
                  >
                    {pending ? 'Generating...' : disabled ? 'Please wait...' : text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {response && (
          <div className="general-section general-custom-question">
            <h3>Ask Your Own Follow-up</h3>
            <p className="general-suggestions-hint">
              Keep the question focused on this matter and we&apos;ll respond in the same structured format.
            </p>
            <form
              className="custom-question-form"
              onSubmit={(event) => handleCustomQuestionSubmit(event, options.id, query)}
            >
              <textarea
                className="custom-question-textarea"
                placeholder="Type your follow-up question here..."
                value={customInput.value}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setCustomInputs((prev) => ({
                    ...prev,
                    [options.id]: {
                      value: nextValue,
                      error: null,
                    },
                  }));
                }}
                rows={3}
                disabled={anyFollowUpLoading || exportsInProgress}
              />
              {customInput.error && (
                <div className="assistant-error custom-question-error">{customInput.error}</div>
              )}
              <div className="custom-question-actions">
                <button
                  type="submit"
                  className="suggestion-button custom-question-submit"
                  disabled={
                    anyFollowUpLoading ||
                    exportsInProgress ||
                    !(customInput.value && customInput.value.trim().length > 0)
                  }
                >
                  {anyFollowUpLoading ? 'Please wait...' : 'Generate Follow-up Answer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {response && response.sources.length > 0 && (
          <div className="general-section">
            <h3>Sources</h3>
            <div className="general-sources">
              {response.sources.map((source, index) => (
                <div key={`${options.id}-source-${index}`} className="general-source-card">
                  <div className="general-source-header">
                    {source.layer && <span className="general-source-badge">{source.layer}</span>}
                    {typeof source.score === 'number' && !Number.isNaN(source.score) && (
                      <span className="general-source-score">
                        Score {(source.score * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {source.collection && (
                    <p className="general-source-collection">{source.collection}</p>
                  )}
                  {(source.doc_title || source.act_title || source.section_heading || source.heading) && (
                    <h4 className="general-source-title">
                      {source.doc_title ?? source.act_title ?? source.section_heading ?? source.heading}
                    </h4>
                  )}
                  {(source.section_number || source.context_path || source.breadcrumbs) && (
                    <p className="general-source-meta">
                      {[source.section_number, source.context_path, source.breadcrumbs]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  )}
                  {source.snippet && <p className="general-source-snippet">{source.snippet}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {response?.validation && (
          <div className="general-section general-validation">
            <h3>Validation</h3>
            <p>{response.validation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderAnalysisFollowUpCard = (entry: FollowUpEntry) => {
    const response = entry.response;

    return (
      <div key={entry.id} className="general-result general-follow-up">
        <div className="general-section">
          <h3>Follow-up Question</h3>
          <p className="general-query">{entry.query}</p>
        </div>

        <div className="general-section">
          <h3>Answer</h3>
          <div className="general-answer">
            {entry.isLoading ? (
              <div className="follow-up-loading">Generating follow-up answer...</div>
            ) : entry.error ? (
              <div className="assistant-error">{entry.error}</div>
            ) : response ? (
              <FormattedAnswer answer={response.answer} />
            ) : (
              <div className="follow-up-loading">No answer available yet.</div>
            )}
          </div>
        </div>

        {response?.sources && response.sources.length > 0 && (
          <div className="general-section">
            <h3>Sources</h3>
            <div className="general-sources">
              {response.sources.map((source, index) => (
                <div key={`${entry.id}-source-${index}`} className="general-source-card">
                  <div className="general-source-header">
                    {source.layer && <span className="general-source-badge">{source.layer}</span>}
                    {typeof source.score === 'number' && !Number.isNaN(source.score) && (
                      <span className="general-source-score">Score {(source.score * 100).toFixed(1)}%</span>
                    )}
                  </div>
                  {source.collection && <p className="general-source-collection">{source.collection}</p>}
                  {(source.doc_title || source.act_title || source.section_heading || source.heading) && (
                    <h4 className="general-source-title">
                      {source.doc_title ?? source.act_title ?? source.section_heading ?? source.heading}
                    </h4>
                  )}
                  {(source.section_number || source.context_path || source.breadcrumbs) && (
                    <p className="general-source-meta">
                      {[source.section_number, source.context_path, source.breadcrumbs].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {source.snippet && <p className="general-source-snippet">{source.snippet}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {response?.validation && (
          <div className="general-section general-validation">
            <h3>Validation</h3>
            <p>{response.validation}</p>
          </div>
        )}
      </div>
    );
  };

  if (authLoading) {
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

  const hasResult = Boolean(generalResult || analysis);
  const activeTaskName = generalResult?.task ?? analysis?.task ?? 'Analysis';
  const statusClass = hasResult ? 'status-icon success' : 'status-icon processing';
  const statusHeading = generalResult
    ? `${activeTaskName} Task Complete`
    : analysis
    ? 'Analysis Complete'
    : analysisLoading
    ? 'Processing Your Request'
    : 'Result Unavailable';
  const statusDescription = generalResult
    ? `Your assistant finished processing the ${activeTaskName.toLowerCase()} request.`
    : analysis
    ? 'Your assistant finished processing the request.'
    : analysisLoading
    ? 'Your assistant is analyzing your request...'
    : error ?? 'Unable to load the requested result.';
  const statusLabel = hasResult ? 'Completed' : analysisLoading ? 'Processing' : 'Unavailable';
  const createdAt = generalResult
    ? new Date(generalResult.created_at).toLocaleString()
    : analysis
    ? new Date(analysis.created_at).toLocaleString()
    : '—';
  const analysisSuggestions = buildAnalysisSuggestions(analysis);

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

          <a href="/assistant" className="nav-item active">
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

          <a href="/history" className="nav-item">
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
          <div className="header-left">
            <button className="back-button" onClick={() => router.push('/assistant')} title="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1>Assistant Result</h1>
              <span className="output-type-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7h18" />
                  <path d="M3 12h18" />
                  <path d="M3 17h18" />
                </svg>
                {activeTaskName}
              </span>
            </div>
          </div>
        </header>

        <div className="result-content">
          <div className="result-wrapper">
            <section className="result-status">
              <div className={statusClass}>
                {hasResult ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                )}
              </div>
              <div className="status-content">
                <h2>{statusHeading}</h2>
                <p>{statusDescription}</p>

                {!hasResult && error && (
                  <div className="assistant-error" style={{ marginTop: '12px' }}>
                    {error}
                  </div>
                )}

                {!hasResult && (
                  <button className="retry-button" onClick={handleRetry}>
                    {tokenParam.startsWith('gen-') ? 'Start New Request' : 'Retry Fetch'}
                  </button>
                )}
              </div>
            </section>

            <section className="info-cards">
              <div className="info-card">
                <div className="info-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l1.09 3.36L16 6l-2.5 1.82L14 11l-2-1.45L10 11l.5-3.18L8 6l2.91-.64L12 2z" />
                  </svg>
                </div>
                <div>
                  <h3>Status</h3>
                  <p>{statusLabel}</p>
                  <small>Latest update</small>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 5h18M3 12h18M3 19h18" />
                  </svg>
                </div>
                <div>
                  <h3>Task</h3>
                  <p>{activeTaskName}</p>
                  <small>Requested action</small>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <div>
                  <h3>Created</h3>
                  <p>{createdAt}</p>
                  <small>Submission time</small>
                </div>
              </div>
            </section>

            <section className="result-preview">
              <div className="preview-header">
                <h2>{generalResult ? `${activeTaskName} Output` : 'Analysis Output'}</h2>
                {hasResult && (
                  <div className="preview-actions">
                    <button onClick={handleCopy}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy
                    </button>
                    {generalResult ? (
                      <button onClick={handleDownload}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </button>
                    ) : (
                      <>
                        <button onClick={() => void handleGeneratePdf()} disabled={isGeneratingPdf}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          {isGeneratingPdf ? 'Preparing PDF...' : 'Download PDF'}
                        </button>
                        <button onClick={() => void handleGenerateDoc()} disabled={isGeneratingDoc}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          {isGeneratingDoc ? 'Preparing Docx...' : 'Download Docx'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {generalResult ? (
                <>
                  {renderGeneralResponse(generalResult.response, generalResult.query, {
                    id: generalResult.token,
                    isPrimary: true,
                    isSelected: Boolean(selectedAnswers[generalResult.token]),
                    onToggleSelection: () =>
                      toggleAnswerSelection(generalResult.token, generalResult.query, generalResult.response),
                  })}

                  {followUps.length > 0 && (
                    <div className="follow-up-list">
                      {followUps.map((entry) =>
                        renderGeneralResponse(entry.response, entry.query, {
                          id: entry.id,
                          isPrimary: false,
                          isLoading: entry.isLoading,
                          errorMessage: entry.error ?? null,
                          isSelected: Boolean(selectedAnswers[entry.id]),
                          onToggleSelection: () => toggleAnswerSelection(entry.id, entry.query, entry.response),
                        }),
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="result-box">
                  {analysis ? (
                    <>
                      <div className="general-section general-result">
                        <h3>Summary</h3>
                        <p>{analysis.summary || 'No summary available.'}</p>
                        <div className="general-section general-analysis">
                          <h3>Detailed Analysis</h3>
                          <p>{analysis.analysis || 'No detailed analysis available.'}</p>
                      </div>
                      {analysis.key_points.length > 0 && (
                        <div className="general-section general-suggestions">
                          <h3>Key Points</h3>
                          <ul className="general-analysis-points">
                            {analysis.key_points.map((point, idx) => (
                              <li key={`${analysis.token}-point-${idx}`}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.keywords.length > 0 && (
                        <div className="general-section general-keywords">
                          <h3>Keywords</h3>
                          <div className="general-analysis-keywords">
                            {analysis.keywords.map((keyword, idx) => (
                              <span key={`${analysis.token}-keyword-${idx}`} className="general-keyword-pill">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.comparisons.length > 0 && (
                        <div className="general-section general-comparisons">
                          <h3>Comparative Insights</h3>
                          <ul className="general-analysis-points">
                            {analysis.comparisons.map((item, idx) => (
                              <li key={`${analysis.token}-comparison-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.table_markdown && (
                        <div className="general-section general-table">
                          <h3>Structured Comparison</h3>
                          <pre className="general-analysis-table">{analysis.table_markdown}</pre>
                        </div>
                      )}
                      {analysisSuggestions.length > 0 && (
                        <div className="general-section general-suggestions">
                          <h3>Suggested Follow-up Questions</h3>
                          <p className="general-suggestions-hint">
                            Select a question to run it through the RAG pipeline.
                          </p>
                          <div className="suggestion-buttons">
                            {analysisSuggestions.map((text) => {
                              const pending = isAnalysisSuggestionPending(text);
                              const disabled =
                                pending || anyAnalysisFollowUpLoading || isGeneratingPdf || isGeneratingDoc;
                              return (
                                <button
                                  key={`analysis-suggestion-${text}`}
                                  className="suggestion-button"
                                  onClick={() => handleAnalysisSuggestionClick(text)}
                                  disabled={disabled}
                                  type="button"
                                >
                                  {pending ? 'Generating...' : disabled ? 'Please wait...' : text}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="general-section general-custom-question">
                        <h3>Ask Your Own Follow-up</h3>
                        <p className="general-suggestions-hint">
                          Keep the question focused on this matter and we&apos;ll respond with sources using RAG.
                        </p>
                        <form className="custom-question-form" onSubmit={handleAnalysisCustomSubmit}>
                          <textarea
                            className="custom-question-textarea"
                            placeholder="Type your follow-up question here..."
                            value={analysisCustomQuestion}
                            onChange={(event) => {
                              setAnalysisCustomQuestion(event.target.value);
                              setAnalysisCustomError(null);
                            }}
                            rows={3}
                            disabled={anyAnalysisFollowUpLoading || isGeneratingPdf || isGeneratingDoc}
                          />
                          {analysisCustomError && (
                            <div className="assistant-error custom-question-error">{analysisCustomError}</div>
                          )}
                          <div className="custom-question-actions">
                            <button
                              type="submit"
                              className="suggestion-button custom-question-submit"
                              disabled={
                                anyAnalysisFollowUpLoading ||
                                isGeneratingPdf ||
                                isGeneratingDoc ||
                                !(analysisCustomQuestion && analysisCustomQuestion.trim().length > 0)
                              }
                            >
                              {anyAnalysisFollowUpLoading ? 'Please wait...' : 'Generate Follow-up Answer'}
                            </button>
                          </div>
                        </form>
                      </div>
                      <div className="general-section general-meta">
                        <h3>Analysis Details</h3>
                        <ul className="general-analysis-meta">
                          <li>
                            <strong>Original Query:</strong> {analysis.query}
                          </li>
                          <li>
                            <strong>Source:</strong> {analysis.source}
                          </li>
                          <li>
                            <strong>Input Characters:</strong> {analysis.input_characters}
                          </li>
                          {analysis.truncated && (
                            <li>
                              <strong>Note:</strong> Input was truncated to fit the token budget.
                            </li>
                          )}
                        </ul>
                      </div>
                      </div>
                      {analysisFollowUps.length > 0 && (
                        <div className="follow-up-list">
                          {analysisFollowUps.map((entry) => renderAnalysisFollowUpCard(entry))}
                        </div>
                      )}
                    </>
                  ) : analysisLoading ? (
                    <div className="loading-placeholder">Waiting for analysis result...</div>
                  ) : (
                    <div className="loading-placeholder">
                      Unable to load analysis result. Please retry or contact support.
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
