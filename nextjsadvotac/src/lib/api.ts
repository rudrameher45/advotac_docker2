// Small helper to normalize backend base URL and build API URLs without duplicate slashes
type GlobalEnvHolder = {
  process?: { env?: { NEXT_PUBLIC_FASTAPI_BASE_URL?: string } };
  env?: { NEXT_PUBLIC_FASTAPI_BASE_URL?: string };
};

const holder = (typeof globalThis !== 'undefined' ? (globalThis as unknown as GlobalEnvHolder) : undefined) ?? {};
const envBase = holder.process?.env?.NEXT_PUBLIC_FASTAPI_BASE_URL ?? holder.env?.NEXT_PUBLIC_FASTAPI_BASE_URL;
export const FASTAPI_BASE = (envBase ?? 'http://localhost:8000').replace(/\/+$/,'');

/**
 * Build a full URL for the FastAPI backend ensuring there are no duplicate slashes.
 * Example: apiUrl('/api/assistant/query-v2') or apiUrl('api/assistant/query-v2')
 */
export function apiUrl(path: string) {
  if (!path) return FASTAPI_BASE;
  // ensure path starts with a single slash
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${FASTAPI_BASE}${p}`;
}

export default apiUrl;
