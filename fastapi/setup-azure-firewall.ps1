# Azure PostgreSQL Firewall Configuration Script
# This script helps you configure Azure PostgreSQL firewall for Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Azure PostgreSQL Firewall Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
Write-Host "Checking Azure CLI installation..." -ForegroundColor Yellow
$azInstalled = Get-Command az -ErrorAction SilentlyContinue

if (-not $azInstalled) {
    Write-Host "❌ Azure CLI is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Azure CLI from:" -ForegroundColor Yellow
    Write-Host "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use the Azure Portal method:" -ForegroundColor Yellow
    Write-Host "1. Go to https://portal.azure.com" -ForegroundColor White
    Write-Host "2. Search for 'openapitest1'" -ForegroundColor White
    Write-Host "3. Click 'Networking' or 'Connection security'" -ForegroundColor White
    Write-Host "4. Add firewall rule: 0.0.0.0 - 255.255.255.255" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✓ Azure CLI is installed" -ForegroundColor Green
Write-Host ""

# Login to Azure
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
$loginStatus = az account show 2>$null

if (-not $loginStatus) {
    Write-Host "Please login to Azure..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure login failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Logged in to Azure" -ForegroundColor Green
Write-Host ""

# Get resource group
Write-Host "Finding resource group for openapitest1..." -ForegroundColor Yellow
$resourceGroup = az postgres server list --query "[?name=='openapitest1'].resourceGroup" -o tsv 2>$null

if (-not $resourceGroup) {
    Write-Host "❌ Could not find resource group for openapitest1" -ForegroundColor Red
    Write-Host "Please specify it manually in the script or use Azure Portal" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual method:" -ForegroundColor Yellow
    Write-Host "1. Go to https://portal.azure.com" -ForegroundColor White
    Write-Host "2. Search for 'openapitest1'" -ForegroundColor White
    Write-Host "3. The resource group name is shown below the server name" -ForegroundColor White
    Write-Host ""
    
    # Ask user for resource group
    $resourceGroup = Read-Host "Enter resource group name"
    if (-not $resourceGroup) {
        exit 1
    }
}

Write-Host "✓ Resource group: $resourceGroup" -ForegroundColor Green
Write-Host ""

# List current firewall rules
Write-Host "Current firewall rules:" -ForegroundColor Yellow
az postgres server firewall-rule list `
    --resource-group $resourceGroup `
    --server-name openapitest1 `
    --output table

Write-Host ""

# Ask for confirmation
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "This will add a firewall rule to allow" -ForegroundColor Yellow
Write-Host "connections from ANY IP address" -ForegroundColor Yellow
Write-Host "Rule: 0.0.0.0 - 255.255.255.255" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Continue? (Y/N)"

if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Operation cancelled" -ForegroundColor Yellow
    exit 0
}

# Add firewall rule
Write-Host ""
Write-Host "Adding firewall rule 'AllowVercel'..." -ForegroundColor Yellow

az postgres server firewall-rule create `
    --resource-group $resourceGroup `
    --server-name openapitest1 `
    --name AllowVercel `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 255.255.255.255

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Wait 30 seconds for changes to propagate..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then test your application:" -ForegroundColor Cyan
    Write-Host "1. Health check: https://fastapi-ir9tkeewk-rudrameher45s-projects.vercel.app/health" -ForegroundColor White
    Write-Host "2. OAuth login: https://fastapi-ir9tkeewk-rudrameher45s-projects.vercel.app/auth/google" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to add firewall rule" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try adding it manually via Azure Portal:" -ForegroundColor Yellow
    Write-Host "1. Go to https://portal.azure.com" -ForegroundColor White
    Write-Host "2. Search for 'openapitest1'" -ForegroundColor White
    Write-Host "3. Click 'Networking' or 'Connection security'" -ForegroundColor White
    Write-Host "4. Add rule: AllowVercel (0.0.0.0 - 255.255.255.255)" -ForegroundColor White
    Write-Host "5. Toggle 'Allow Azure services' to ON" -ForegroundColor White
    Write-Host "6. Click Save" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "Current firewall rules after update:" -ForegroundColor Yellow
az postgres server firewall-rule list `
    --resource-group $resourceGroup `
    --server-name openapitest1 `
    --output table

Write-Host ""
Write-Host "Script completed!" -ForegroundColor Green
