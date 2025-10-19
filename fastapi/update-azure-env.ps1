# Update Azure OpenAI Environment Variables in Vercel Production
# This script REMOVES old values and adds new ones

Write-Host "Updating Azure OpenAI environment variables in Vercel Production..." -ForegroundColor Yellow
Write-Host ""

Set-Location "e:\Project\Website- AI law\v7\fastapi"

$variables = @{
    "AZURE_OPENAI_ENDPOINT" = "https://24f30-m9hniqrf-swedencentral.cognitiveservices.azure.com/"
    "AZURE_OPENAI_API_KEY" = "8Ji4NZNjDUv2GLSX12MYBRyQzKygCpjyUaGicj3Bgu8clFyCanpQJQQJ99BDACfhMk5XJ3w3AAAAACOGegj8"
    "AZURE_OPENAI_API_VERSION" = "2024-12-01-preview"
    "AZURE_OPENAI_ANALYSIS" = "gpt-5-mini"
    "AZURE_OPENAI_ANALYSIS_PRO" = "gpt-5"
}

foreach ($varName in $variables.Keys) {
    Write-Host "Updating $varName..." -ForegroundColor Cyan
    
    # Remove existing variable (suppress errors if it doesn't exist)
    $removeOutput = vercel env rm $varName production 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  - Removed old value" -ForegroundColor Gray
    }
    
    # Add new value
    $value = $variables[$varName]
    Write-Output $value | vercel env add $varName production 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  - Set new value" -ForegroundColor Green
    } else {
        Write-Host "  - Failed to set!" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "All variables updated! Now redeploying..." -ForegroundColor Yellow
Write-Host ""
vercel --prod --yes

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""
Write-Host "Test your assistant page now:" -ForegroundColor Cyan
Write-Host "https://advotac02.vercel.app/assistant" -ForegroundColor White
Write-Host ""
Write-Host "If you still see errors, wait 30-60 seconds for changes to propagate." -ForegroundColor Yellow
