import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  
  // Extract subdomain from hostname
  const subdomain = hostname.split(':')[0].split('.')[0];

  // If the request is already targeting the /app path on the same host, don't rewrite
  if (url.pathname.startsWith('/app')) {
    return NextResponse.next();
  }

  // Match requests coming to the app subdomain, e.g. app.localhost, app.example.com
  // For local dev the host contains "localhost"; in prod on Vercel it will be app.<your-domain>
  const isAppSubdomain = subdomain === 'app' || hostname.startsWith('app.');

  if (isAppSubdomain) {
    // Prefix the pathname with /app so Next serves pages from src/app/app
    url.pathname = '/app' + (url.pathname === '/' ? '' : url.pathname);
    return NextResponse.rewrite(url);
  }
  
  // Continue with normal routing for main domain
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
