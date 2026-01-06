const https = require('https');

class ChatGPTClient {
  constructor() {
    this.baseURL = 'chat.openai.com';
    this.accessToken = null;
  }

  async getAccessToken() {
    return new Promise((resolve) => {
      const token = process.env.CHATGPT_TOKEN;
      if (token) {
        this.accessToken = token;
        resolve(token);
      } else {
        resolve(null);
      }
    });
  }

  async createChatCompletion(messages, options = {}) {
    const { model = 'gpt-4', stream = false } = options;
    
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const payload = {
      action: 'next',
      messages: messages.map(msg => ({
        id: this.generateId(),
        author: { role: msg.role },
        content: {
          content_type: 'text',
          parts: [msg.content]
        }
      })),
      parent_message_id: this.generateId(),
      model: 'text-davinci-002-render-sha',
      timezone_offset_min: new Date().getTimezoneOffset()
    };

    console.log('Sending to ChatGPT web API...');

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseURL,
        path: '/backend-api/conversation',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://chat.openai.com/chat'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk.toString();
        });
        
        res.on('end', () => {
          try {
            const response = this.parseSSEResponse(data);
            resolve(this.formatOpenAIResponse(response));
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  parseSSEResponse(data) {
    const lines = data.split('\n');
    let fullResponse = '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        if (jsonStr === '[DONE]') break;
        
        try {
          const json = JSON.parse(jsonStr);
          if (json.message?.content?.parts) {
            fullResponse += json.message.content.parts.join('');
          }
        } catch (e) {
        }
      }
    }
    
    return fullResponse;
  }

  formatOpenAIResponse(content) {
    return {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4',
      choices: [{
        message: {
          role: 'assistant',
          content: content
        },
        finish_reason: 'stop',
        index: 0
      }],
      usage: {
        prompt_tokens: Math.ceil(content.length / 4),
        completion_tokens: Math.ceil(content.length / 4),
        total_tokens: Math.ceil(content.length / 2)
      }
    };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = ChatGPTClient;