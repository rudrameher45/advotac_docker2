import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_BACKEND_BASE =
  process.env.FASTAPI_BASE_URL ??
  process.env.NEXT_PUBLIC_FASTAPI_URL ??
  'http://localhost:8000';

const backendBase = DEFAULT_BACKEND_BASE.replace(/\/+$/, '');

export const runtime = 'nodejs';

function buildBackendUrl(path: string): string {
  return `${backendBase}${path}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ detail: 'Missing Authorization header' }, { status: 401 });
  }

  const resolvedParams = await context.params;
  const token = resolvedParams?.token;
  if (!token) {
    return NextResponse.json({ detail: 'Token parameter missing.' }, { status: 400 });
  }

  try {
    const response = await fetch(buildBackendUrl(`/assistant/analysis/${token}`), {
      headers: {
        Authorization: authHeader,
      },
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'content-type': contentType || 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reach backend service.';
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
