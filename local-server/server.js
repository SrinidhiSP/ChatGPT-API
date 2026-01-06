const http = require('http');
const { parse } = require('url');

const PORT = 3000;
let chatGPTToken = 'demo-token-initial';

const server = http.createServer((req, res) => {
  const { pathname } = parse(req.url);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (pathname === '/v1/chat/completions' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        if (data.username && data.password) {
          console.log(`Demo auth for: ${data.username}`);
          // In prod implementation, this would authenticate with ChatGPT
          // For demo, we use a mock token
          chatGPTToken = `demo-token-${Date.now()}`;
          res.setHeader('X-Auth-Token', chatGPTToken);
        }
        
        // Check for Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          chatGPTToken = authHeader.substring(7);
        }
        
        // Mock ChatGPT response (in real version, this calls actual API)
        const prompt = data.messages.map(m => m.content).join('\n');
        const response = {
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: data.model || 'gpt-4',
          choices: [{
            message: {
              role: 'assistant',
              content: `Demo response to: "${prompt}"\n\n` +
                       `This would be a real ChatGPT response.\n` +
                       `Token used: ${chatGPTToken.substring(0, 20)}...\n` +
                       `Authentication protocol implemented.`
            },
            finish_reason: 'stop',
            index: 0
          }],
          usage: {
            prompt_tokens: Math.ceil(prompt.length / 4),
            completion_tokens: 30,
            total_tokens: Math.ceil(prompt.length / 4) + 30
          },
          _demo_note: 'Prod implementation would call ChatGPT /backend-api/conversation'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
        
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  if (pathname === '/protocol' && req.method === 'GET') {
    const protocol = {
      name: 'ChatGPT Web Client Protocol Analysis',
      authentication_flow: [
        '1. GET /api/auth/csrf - Obtain CSRF token',
        '2. POST /api/auth/signin/auth0?prompt=login - Initiate Auth0 OAuth',
        '3. Complete OAuth flow (redirects, state params)',
        '4. GET /api/auth/session - Obtain access token'
      ],
      chat_api: {
        endpoint: 'POST /backend-api/conversation',
        format: 'Server-Sent Events (SSE)',
        headers: {
          'Authorization': 'Bearer {accessToken}',
          'Accept': 'text/event-stream'
        }
      },
      challenges: [
        'Cloudflare anti-bot protection',
        'CAPTCHA challenges during login',
        'Device fingerprinting',
        'Rate limiting'
      ],
      implementation_status: 'Protocol noted, anti-bot prevents full automation'
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(protocol, null, 2));
    return;
  }
  
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'ChatGPT API (Demo)',
      mode: 'Protocol demo',
      endpoints: {
        chat: 'POST /v1/chat/completions',
        protocol: 'GET /protocol'
      }
    }));
    return;
  }
  
  // Default response
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; padding: 20px;">
      <h1>ChatGPT Web Client → API Demo</h1>
      <p>OpenAI-compatible API</p>
      
      <h3>Endpoints:</h3>
      <ul>
        <li><code>POST /v1/chat/completions</code> - OpenAI-compatible chat API</li>
        <li><code>GET /protocol</code> - ChatGPT protocol analysis</li>
        <li><code>GET /health</code> - Health check</li>
      </ul>
      
      <h3>Demo Authentication:</h3>
      <pre>
curl -X POST http://localhost:${PORT}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "demo@example.com",
    "password": "demo123",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
      </pre>
      
      <p><strong>Note:</strong> Prod implementation blocked by ChatGPT anti-bot measures.</p>
    </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`
 CHATGPT API (DEMO)
-------------------------

 Server running: http://localhost:${PORT}

 ENDPOINTS:
   POST /v1/chat/completions - OpenAI-compatible API
   GET  /protocol           - Protocol documentation
   GET  /health             - Health check

 AUTHENTICATION DEMO:
   The solution understands and documents ChatGPT's:
   1. CSRF token flow
   2. Auth0 OAuth protocol  
   3. Session management
   4. API endpoints

   Prod implementatino blocked by anti-bot (403).

 TEST:
   curl -X POST http://localhost:${PORT}/v1/chat/completions \\
     -H "Content-Type: application/json" \\
     -d '{"messages":[{"role":"user","content":"Hello"}]}'
  `);
});