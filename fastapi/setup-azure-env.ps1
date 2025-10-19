# Set Azure OpenAI Environment Variables in Vercel Production
# Run this script in PowerShell

Write-Host "Setting Azure OpenAI environment variables in Vercel Production..." -ForegroundColor Yellow
Write-Host ""

Set-Location "e:\Project\Website- AI law\v7\fastapi"

# Set AZURE_OPENAI_ENDPOINT
Write-Host "Setting AZURE_OPENAI_ENDPOINT..." -ForegroundColor Cyan
Write-Output "https://24f30-m9hniqrf-swedencentral.cognitiveservices.azure.com/" | vercel env add AZURE_OPENAI_ENDPOINT production
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Set AZURE_OPENAI_API_KEY
Write-Host "Setting AZURE_OPENAI_API_KEY..." -ForegroundColor Cyan
Write-Output "8Ji4NZNjDUv2GLSX12MYBRyQzKygCpjyUaGicj3Bgu8clFyCanpQJQQJ99BDACfhMk5XJ3w3AAAAACOGegj8" | vercel env add AZURE_OPENAI_API_KEY production
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Set AZURE_OPENAI_API_VERSION
Write-Host "Setting AZURE_OPENAI_API_VERSION..." -ForegroundColor Cyan
Write-Output "2024-12-01-preview" | vercel env add AZURE_OPENAI_API_VERSION production
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Set AZURE_OPENAI_ANALYSIS
Write-Host "Setting AZURE_OPENAI_ANALYSIS..." -ForegroundColor Cyan
Write-Output "gpt-5-mini" | vercel env add AZURE_OPENAI_ANALYSIS production
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Set AZURE_OPENAI_ANALYSIS_PRO
Write-Host "Setting AZURE_OPENAI_ANALYSIS_PRO..." -ForegroundColor Cyan
Write-Output "gpt-5" | vercel env add AZURE_OPENAI_ANALYSIS_PRO production
Write-Host "Done" -ForegroundColor Green
Write-Host ""

Write-Host "All variables set! Now redeploying..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host ""
Write-Host "Done! Test your assistant page now:" -ForegroundColor Green
Write-Host "https://advotac02.vercel.app/assistant" -ForegroundColor Cyan
