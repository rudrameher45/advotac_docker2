import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    hasPostgresHost: !!process.env.POSTGRES_HOST,
    hasPostgresDatabase: !!process.env.POSTGRES_DATABASE,
    hasPostgresUser: !!process.env.POSTGRES_USER,
    hasPostgresPassword: !!process.env.POSTGRES_PASSWORD,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    allEnvVarsPresent: false,
  };

  envCheck.allEnvVarsPresent = Object.values(envCheck).every(v => v === true);

  return NextResponse.json({
    status: envCheck.allEnvVarsPresent ? 'OK' : 'MISSING_ENV_VARS',
    environment: process.env.NODE_ENV || 'development',
    envCheck,
    missingVars: Object.entries(envCheck)
      .filter(([key, value]) => value === false && key !== 'allEnvVarsPresent')
      .map(([key]) => key.replace('has', '')),
  });
}
