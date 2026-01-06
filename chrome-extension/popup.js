const API_URL = 'http://localhost:3000';

document.getElementById('authBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    showResponse('Please enter demo credentials', 'error');
    return;
  }
  
  showResponse('Starting ChatGPT authentication demo...', 'info');
  
  try {
    const steps = [
      'Step 1: GET /api/auth/csrf',
      '   → Would get CSRF token from ChatGPT',
      '',
      'Step 2: POST /api/auth/signin/auth0',
      '   → Would initiate Auth0 OAuth flow',
      '',
      'Step 3: OAuth Redirects',
      '   → Would handle Auth0 login with credentials',
      '',
      'Step 4: GET /api/auth/session',
      '   → Would obtain access token',
      '',
      'Real-world prod: Blocked by ChatGPT anti-bot (403)',
    ];
    
    showResponse(steps.join('\n'), 'info');
    
    await chrome.storage.local.set({
      demoUsername: username,
      authDemoCompleted: true,
      timestamp: new Date().toISOString()
    });
    
    setTimeout(() => {
      showResponse('Authentication protocol demo\n\n' +
                  '1. Get CSRF tokens\n' +
                  '2. Initiate Auth0 OAuth\n' +
                  '3. Handle session management\n' +
                  '4. Obtain access tokens\n\n');
    }, 1000);
    
  } catch (error) {
    showResponse(`Error: ${error.message}`, 'error');
  }
});

document.getElementById('apiBtn').addEventListener('click', async () => {
  const prompt = document.getElementById('prompt').value;
  
  if (!prompt) {
    showResponse('Enter a prompt to test the API', 'error');
    return;
  }
  
  showResponse('Calling ChatGPT API demo...', 'info');
  
  try {
    const response = await fetch(`${API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'chrome-extension://' + chrome.runtime.id
      },
      body: JSON.stringify({
        username: 'demo@example.com',
        password: 'demo123',
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {

      const formatted = `
API Call Successful!

Prompt: "${prompt}"

Response:
${data.choices[0].message.content}

Usage Stats:
- Prompt tokens: ${data.usage.prompt_tokens}
- Completion tokens: ${data.usage.completion_tokens}
- Total tokens: ${data.usage.total_tokens}

Technical Details:
- Request ID: ${data.id}
- Model: ${data.model}
- Via: Chrome Extension → Local Server → ChatGPT Protocol
      `.trim();
      
      showResponse(formatted, 'success');
      
      await chrome.storage.local.set({
        lastApiResponse: data,
        lastPrompt: prompt,
        lastTimestamp: new Date().toISOString()
      });
      
    } else {
      showResponse(`API Error ${response.status}: ${JSON.stringify(data, null, 2)}`, 'error');
    }
    
  } catch (error) {
    showResponse(`Network error: ${error.message}\n\nMake sure local server is running:\nhttp://localhost:3000`, 'error');
  }
});

document.getElementById('protocolBtn').addEventListener('click', async () => {
  showResponse('Fetching ChatGPT protocol analysis...', 'info');
  
  try {
    const response = await fetch(`${API_URL}/protocol`);
    const data = await response.json();
    
    const formatted = `
CHATGPT WEB CLIENT PROTOCOL ANALYSIS
------------------------
AUTHENTICATION FLOW:
${data.authentication_flow.map((step, i) => `${i + 1}. ${step}`).join('\n')}

CHAT API:
- Endpoint: ${data.chat_api.endpoint}
- Format: ${data.chat_api.format}
- Headers: ${JSON.stringify(data.chat_api.headers, null, 2)}

CHALLENGES:
${data.challenges.map(c => `• ${c}`).join('\n')}

STATUS: ${data.implementation_status}
    `.trim();
    
    showResponse(formatted, 'info');
    
  } catch (error) {
    showResponse(`Could not fetch protocol: ${error.message}`, 'error');
  }
});

function showResponse(text, type = 'info') {
  const responseEl = document.getElementById('response');
  const textEl = document.getElementById('responseText');
  
  responseEl.style.display = 'block';
  textEl.textContent = text;
  
  responseEl.style.borderLeft = '4px solid #3b82f6';
  textEl.style.color = '';
  
  if (type === 'success') {
    responseEl.style.borderLeft = '4px solid #10a37f';
    textEl.style.color = '#10a37f';
  } else if (type === 'error') {
    responseEl.style.borderLeft = '4px solid #ef4444';
    textEl.style.color = '#ef4444';
  }
  
  responseEl.scrollIntoView({ behavior: 'smooth' });
}

chrome.storage.local.get(['authDemoCompleted', 'lastApiResponse'], (result) => {
  if (result.authDemoCompleted) {
    document.getElementById('username').value = 'demo@example.com';
    document.getElementById('password').value = 'demo123';
  }
});