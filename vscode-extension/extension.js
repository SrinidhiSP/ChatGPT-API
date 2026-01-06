const vscode = require('vscode');

async function callChatGPTAPI(prompt) {
  try {
    const config = vscode.workspace.getConfiguration('chatgpt');
    const apiUrl = config.get('apiUrl') || 'http://localhost:3000'; 
    
    console.log(`Calling API: ${apiUrl}`);
    
    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    vscode.window.showErrorMessage(`ChatGPT Error: ${error.message}`);
    throw error;
  }
}

function activate(context) {
  console.log('ChatGPT Bridge extension activated');
  
  const askCommand = vscode.commands.registerCommand('chatgpt.ask', async () => {
    const editor = vscode.window.activeTextEditor;
    let initialText = '';
    
    if (editor) {
      const selection = editor.document.getText(editor.selection);
      if (selection.trim()) {
        initialText = selection;
      }
    }
    
    const question = await vscode.window.showInputBox({
      placeHolder: 'Ask ChatGPT...',
      value: initialText
    });
    
    if (!question) return;
    
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Asking ChatGPT...',
      cancellable: false
    }, async () => {
      try {
        const answer = await callChatGPTAPI(question);
        
        const panel = vscode.window.createWebviewPanel(
          'chatgptResponse',
          'ChatGPT Response',
          vscode.ViewColumn.Beside,
          {}
        );
        
        panel.webview.html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { padding: 20px; font-family: sans-serif; }
              pre { white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 6px; }
            </style>
          </head>
          <body>
            <h3>ChatGPT Response</h3>
            <p><strong>Question:</strong> ${question.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            <pre>${answer.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </body>
          </html>
        `;
        
      } catch (error) {
        // Error already shown by callChatGPTAPI
      }
    });
  });
  
  // Add the command to context
  context.subscriptions.push(askCommand);
}

// Required by VS Code
function deactivate() {}

// REQUIRED: Export these functions
module.exports = {
  activate,
  deactivate
};