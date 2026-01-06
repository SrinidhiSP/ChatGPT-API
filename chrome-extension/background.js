// Background service for Chrome Extension
chrome.runtime.onMessage.addListener((message, sendResponse) => {
  
  if (message.type === 'GET_API_STATUS') {
    chrome.storage.local.get(['authDemoCompleted', 'lastApiResponse'], (result) => {
      sendResponse({
        authenticated: !!result.authDemoCompleted,
        lastResponse: result.lastApiResponse,
        service: 'ChatGPT Protocol Bridge',
        endpoints: {
          demoAuth: 'POST /v1/chat/completions with credentials',
          protocol: 'GET /protocol'
        }
      });
    });
    return true; 
  }
  
  if (message.type === 'SEND_TO_CHATGPT') {
    fetch('http://localhost:3000/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message.prompt }],
        model: 'gpt-4'
      })
    })
    .then(response => response.json())
    .then(data => {
      chrome.storage.local.set({
        lastApiResponse: data,
        lastPrompt: message.prompt
      });
      sendResponse({ success: true, response: data });
    })
    .catch(error => {
      sendResponse({ error: error.message });
    });
    
    return true; 
  }
});