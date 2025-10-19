# Vercel Deployment Quick Start

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FastAPI to Vercel Deployment Guide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANT: Complete these steps BEFORE deploying:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. ✓ Check vercel.json exists" -ForegroundColor Green
if (Test-Path "vercel.json") {
    Write-Host "   vercel.json found ✓" -ForegroundColor Green
} else {
    Write-Host "   vercel.json NOT FOUND! ✗" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. ✓ Check requirements.txt exists" -ForegroundColor Green
if (Test-Path "requirements.txt") {
    Write-Host "   requirements.txt found ✓" -ForegroundColor Green
} else {
    Write-Host "   requirements.txt NOT FOUND! ✗" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT STEPS:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Install Vercel CLI (if not installed)" -ForegroundColor Yellow
Write-Host "Run: npm install -g vercel" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Login to Vercel" -ForegroundColor Yellow
Write-Host "Run: vercel login" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Deploy to Vercel" -ForegroundColor Yellow
Write-Host "Run: vercel" -ForegroundColor White
Write-Host "     (for preview deployment)" -ForegroundColor Gray
Write-Host "Or:  vercel --prod" -ForegroundColor White
Write-Host "     (for production deployment)" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 4: Copy Your Vercel URL" -ForegroundColor Yellow
Write-Host "After deployment, Vercel will show:" -ForegroundColor White
Write-Host "✅ https://your-project-abc123.vercel.app" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Update Google OAuth Console" -ForegroundColor Yellow
Write-Host "Go to: https://console.cloud.google.com/" -ForegroundColor White
Write-Host "Navigate: APIs & Services → Credentials → OAuth 2.0 Client ID" -ForegroundColor White
Write-Host ""
Write-Host "Add to Authorized JavaScript origins:" -ForegroundColor Cyan
Write-Host "  https://your-project-abc123.vercel.app" -ForegroundColor White
Write-Host ""
Write-Host "Add to Authorized redirect URIs:" -ForegroundColor Cyan
Write-Host "  https://your-project-abc123.vercel.app/auth/google/callback" -ForegroundColor White
Write-Host ""
Write-Host "CLICK SAVE and wait 5-10 minutes!" -ForegroundColor Red
Write-Host ""

Write-Host "Step 6: Set Environment Variables in Vercel" -ForegroundColor Yellow
Write-Host "Go to: Vercel Dashboard → Your Project → Settings → Environment Variables" -ForegroundColor White
Write-Host ""
Write-Host "Required Variables:" -ForegroundColor Cyan
Write-Host "  PGUSER=rudra45" -ForegroundColor White
Write-Host "  PGPASSWORD=Rohit()Ritika()" -ForegroundColor White
Write-Host "  PGHOST=openapitest1.postgres.database.azure.com" -ForegroundColor White
Write-Host "  PGDATABASE=fastapi_oauth_db" -ForegroundColor White
Write-Host "  PGPORT=5432" -ForegroundColor White
Write-Host ""
Write-Host "  GOOGLE_CLIENT_ID=your_client_id" -ForegroundColor White
Write-Host "  GOOGLE_CLIENT_SECRET=your_client_secret" -ForegroundColor White
Write-Host "  GOOGLE_REDIRECT_URI=https://your-project.vercel.app/auth/google/callback" -ForegroundColor White
Write-Host ""
Write-Host "  SECRET_KEY=generate-a-secure-32-character-key" -ForegroundColor White
Write-Host "  ALGORITHM=HS256" -ForegroundColor White
Write-Host "  ACCESS_TOKEN_EXPIRE_MINUTES=30" -ForegroundColor White
Write-Host ""

Write-Host "Step 7: Redeploy After Setting Variables" -ForegroundColor Yellow
Write-Host "Run: vercel --prod" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Visit: https://your-project.vercel.app/docs" -ForegroundColor White
Write-Host "Test OAuth: https://your-project.vercel.app/auth/google/login" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📚 For detailed guide, read:" -ForegroundColor Cyan
Write-Host "   - VERCEL_DEPLOYMENT.md" -ForegroundColor White
Write-Host "   - GOOGLE_CONSOLE_UPDATE.md" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ready to deploy? (Press Enter to continue, Ctrl+C to cancel)" -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "Great! Run these commands:" -ForegroundColor Green
Write-Host ""
Write-Host "1. vercel login" -ForegroundColor Cyan
Write-Host "2. vercel" -ForegroundColor Cyan
Write-Host ""
Write-Host "Good luck! 🚀" -ForegroundColor Green
