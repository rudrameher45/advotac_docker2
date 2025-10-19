# Add all environment variables to Vercel
# Run this script to add all required environment variables to your Vercel project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vercel Environment Variables Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Vercel CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "Setting up environment variables for Production..." -ForegroundColor Green
Write-Host ""

# Define all environment variables
$envVars = @{
    "GOOGLE_CLIENT_ID" = "689080202868-gb798ciq06j3shni4527bigr2igrko39.apps.googleusercontent.com"
    "GOOGLE_CLIENT_SECRET" = "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"
    "GOOGLE_REDIRECT_URI" = "https://fastapi-mj6yjgdy1-rudrameher45s-projects.vercel.app/auth/google/callback"
    "SECRET_KEY" = "your-secret-key-here-change-this-in-production"
    "ALGORITHM" = "HS256"
    "ACCESS_TOKEN_EXPIRE_MINUTES" = "30"
    "FRONTEND_URL" = "https://advotac02.vercel.app"
    "BACKEND_URL" = "https://fastapi-mj6yjgdy1-rudrameher45s-projects.vercel.app"
    "PGUSER" = "rudra45"
    "PGPASSWORD" = "Rohit()Ritika()"
    "PGHOST" = "openapitest1.postgres.database.azure.com"
    "PGPORT" = "5432"
    "PGDATABASE" = "fastapi_oauth_db"
    "DATABASE_URL" = "postgresql://rudra45:Rohit()Ritika()@openapitest1.postgres.database.azure.com:5432/fastapi_oauth_db?sslmode=require"
}

Write-Host "This script will add/update these variables:" -ForegroundColor Yellow
foreach ($key in $envVars.Keys) {
    if ($key -like "*SECRET*" -or $key -like "*PASSWORD*") {
        Write-Host "  - $key = ********" -ForegroundColor Gray
    } else {
        Write-Host "  - $key = $($envVars[$key])" -ForegroundColor Gray
    }
}
Write-Host ""

$confirm = Read-Host "Do you want to continue? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Adding environment variables to Vercel..." -ForegroundColor Green
Write-Host ""

# Note: Vercel CLI requires interactive input for env vars
# We'll create a temporary .env file and provide instructions

$tempEnvFile = ".env.vercel.temp"
$output = @()

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    $output += "$key=$value"
}

$output | Out-File -FilePath $tempEnvFile -Encoding UTF8

Write-Host "Created temporary file: $tempEnvFile" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MANUAL STEPS REQUIRED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Unfortunately, Vercel CLI doesn't support bulk import easily." -ForegroundColor Yellow
Write-Host "Please follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to Vercel Dashboard:" -ForegroundColor White
Write-Host "   https://vercel.com/rudrameher45s-projects/fastapi/settings/environment-variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. For each variable below, click 'Add New' and enter:" -ForegroundColor White
Write-Host ""

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "   Variable: $key" -ForegroundColor Green
    if ($key -like "*SECRET*" -or $key -like "*PASSWORD*") {
        Write-Host "   Value: ******** (see $tempEnvFile)" -ForegroundColor Gray
    } else {
        Write-Host "   Value: $value" -ForegroundColor Gray
    }
    Write-Host "   Environment: Production" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "3. After adding all variables, run:" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "The temp file '$tempEnvFile' has been created for your reference." -ForegroundColor Green
Write-Host "You can delete it after adding variables to Vercel." -ForegroundColor Green
