const fetch = require('node-fetch');

async function testAzureConfig() {
    // You'll need to replace this with your actual auth token
    const token = 'YOUR_AUTH_TOKEN_HERE';
    
    try {
        const response = await fetch('https://fastapi-eight-zeta.vercel.app/test-azure-config', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('Azure Config Status:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.service_initialized) {
            console.log('\n✅ Azure OpenAI is configured correctly!');
        } else {
            console.log('\n❌ Configuration Issue:', data.service_error);
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAzureConfig();
