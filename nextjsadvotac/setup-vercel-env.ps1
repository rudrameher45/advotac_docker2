# Vercel Environment Variables Setup Script
# Run this in PowerShell to add all environment variables to Vercel

Write-Host "🚀 Adding Environment Variables to Vercel..." -ForegroundColor Green
Write-Host ""

# You'll need to paste these values when prompted
$envVars = @{
    "POSTGRES_HOST" = "openapitest1.postgres.database.azure.com"
    "POSTGRES_PORT" = "5432"
    "POSTGRES_USER" = "rudra45"
    "POSTGRES_PASSWORD" = "Rohit()Ritika()"
    "POSTGRES_DATABASE" = "advotac_db"
    "POSTGRES_SSL" = "true"
    "DATABASE_URL" = "postgresql://rudra45:Rohit%28%29Ritika%28%29@openapitest1.postgres.database.azure.com:5432/advotac_db?sslmode=require"
    "NEXTAUTH_URL" = "https://advotac02-4ef5wdwph-rudrameher45s-projects.vercel.app"
    "NEXTAUTH_SECRET" = "JrT84RSO2ElaVh8FAG49GqyBNEpgtLMex0FUOCfUwOU="
    "GOOGLE_CLIENT_ID" = "689080202868-gb798ciq06j3shni4527bigr2igrko39.apps.googleusercontent.com"
    "GOOGLE_CLIENT_SECRET" = "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"
    "NODE_ENV" = "production"
}

Write-Host "Environment Variables to Add:" -ForegroundColor Cyan
Write-Host ""
foreach ($key in $envVars.Keys) {
    Write-Host "  $key" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "⚠️  EASIER METHOD: Add via Vercel Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://vercel.com/rudrameher45s-projects/advotac02/settings/environment-variables" -ForegroundColor White
Write-Host ""
Write-Host "2. Click 'Add New' and paste each variable:" -ForegroundColor White
Write-Host ""

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "   Name:  $key" -ForegroundColor Green
    Write-Host "   Value: $value" -ForegroundColor Gray
    Write-Host "   Environments: ✅ Production, ✅ Preview, ✅ Development" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "3. After adding ALL variables, click 'Redeploy' in the Deployments tab" -ForegroundColor White
Write-Host ""
Write-Host "4. Also update Google OAuth authorized redirect URIs:" -ForegroundColor White
Write-Host "   Add: https://advotac02-4ef5wdwph-rudrameher45s-projects.vercel.app/api/auth/callback/google" -ForegroundColor Gray
Write-Host "   Go to: https://console.cloud.google.com/apis/credentials" -ForegroundColor Gray
Write-Host ""
