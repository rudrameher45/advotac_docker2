# Set Azure OpenAI Environment Variables in Vercel Production
# Run this script in PowerShell

$env_vars = @{
    "AZURE_OPENAI_ENDPOINT" = "https://24f30-m9hniqrf-swedencentral.cognitiveservices.azure.com/"
    "AZURE_OPENAI_API_KEY" = "8Ji4NZNjDUv2GLSX12MYBRyQzKygCpjyUaGicj3Bgu8clFyCanpQJQQJ99BDACfhMk5XJ3w3AAAAACOGegj8"
    "AZURE_OPENAI_API_VERSION" = "2024-12-01-preview"
    "AZURE_OPENAI_ANALYSIS" = "gpt-5-mini"
    "AZURE_OPENAI_ANALYSIS_PRO" = "gpt-5"
}

Write-Host "Setting Azure OpenAI environment variables in Vercel Production..." -ForegroundColor Yellow
Write-Host ""

cd "e:\Project\Website- AI law\v7\fastapi"

foreach ($key in $env_vars.Keys) {
    $value = $env_vars[$key]
    Write-Host "Setting $key..." -ForegroundColor Cyan
    
    # Remove if exists
    echo "y" | vercel env rm $key production 2>$null
    
    # Add new value
    echo $value | vercel env add $key production
    
    Write-Host "✓ $key set" -ForegroundColor Green
    Write-Host ""
}

Write-Host "All variables set! Now redeploying..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host ""
Write-Host "Done! Test your assistant page now:" -ForegroundColor Green
Write-Host "   https://advotac02.vercel.app/assistant"
