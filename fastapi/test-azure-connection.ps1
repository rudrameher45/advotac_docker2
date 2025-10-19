# Test Azure PostgreSQL Connection
# Run this to verify your connection to Azure PostgreSQL

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Azure PostgreSQL Connection Test" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if psycopg2 is installed
Write-Host "[1/5] Checking Python dependencies..." -ForegroundColor Yellow
try {
    python -c "import psycopg2; print('✓ psycopg2 installed')"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ psycopg2 not found. Installing..." -ForegroundColor Red
        pip install psycopg2-binary
    }
} catch {
    Write-Host "❌ Error checking dependencies" -ForegroundColor Red
}

Write-Host ""

# Step 2: Check DNS resolution
Write-Host "[2/5] Checking DNS resolution..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name "openapitest1.postgres.database.azure.com" -ErrorAction Stop
    Write-Host "✓ DNS resolved to: $($dnsResult.IPAddress)" -ForegroundColor Green
} catch {
    Write-Host "❌ DNS resolution failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""

# Step 3: Check network connectivity (port 5432)
Write-Host "[3/5] Checking network connectivity..." -ForegroundColor Yellow
try {
    $tcpConnection = Test-NetConnection -ComputerName "openapitest1.postgres.database.azure.com" -Port 5432 -WarningAction SilentlyContinue
    if ($tcpConnection.TcpTestSucceeded) {
        Write-Host "✓ Port 5432 is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Port 5432 is blocked (Firewall issue)" -ForegroundColor Red
        Write-Host "   → Your IP address may not be whitelisted in Azure" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Network test failed: $_" -ForegroundColor Red
}

Write-Host ""

# Step 4: Get your public IP
Write-Host "[4/5] Getting your public IP address..." -ForegroundColor Yellow
try {
    $myIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
    Write-Host "✓ Your public IP: $myIP" -ForegroundColor Green
    Write-Host "   → Add this IP to Azure PostgreSQL firewall rules" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Could not get public IP" -ForegroundColor Red
}

Write-Host ""

# Step 5: Test database connection
Write-Host "[5/5] Testing database connection..." -ForegroundColor Yellow

# Set environment variable
$env:DATABASE_URL = "postgresql://rudra45:Rohit`(`)Ritika`(`)@openapitest1.postgres.database.azure.com:5432/fastapi_oauth_db?sslmode=require"

# Run database test
cd "e:\Project\Website- AI law\v7\fastapi"
python test_database.py

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Provide guidance based on results
if ($tcpConnection.TcpTestSucceeded) {
    Write-Host "✅ Network connection is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "If database test failed, check:" -ForegroundColor Yellow
    Write-Host "  1. Username/password are correct" -ForegroundColor White
    Write-Host "  2. Database name exists" -ForegroundColor White
    Write-Host "  3. SSL is properly configured" -ForegroundColor White
} else {
    Write-Host "❌ FIREWALL ISSUE DETECTED" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix this issue:" -ForegroundColor Yellow
    Write-Host "  1. Go to Azure Portal: https://portal.azure.com" -ForegroundColor White
    Write-Host "  2. Navigate to PostgreSQL server: openapitest1" -ForegroundColor White
    Write-Host "  3. Click 'Connection security' in left menu" -ForegroundColor White
    Write-Host "  4. Add firewall rule:" -ForegroundColor White
    Write-Host "     - Rule name: my-local-ip" -ForegroundColor Cyan
    Write-Host "     - Start IP: $myIP" -ForegroundColor Cyan
    Write-Host "     - End IP: $myIP" -ForegroundColor Cyan
    Write-Host "  5. Click 'Save'" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Enable 'Allow access to Azure services'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For detailed instructions, see: AZURE_POSTGRESQL_FIX.md" -ForegroundColor Cyan
