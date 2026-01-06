// Inject script to capture token from page
function tryGetTokenFromStorage() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('access-token') || key.includes('session')) {
        const value = localStorage.getItem(key);
        if (value && value.startsWith('eyJ')) { 
          console.log('Found token in localStorage:', key);
          chrome.runtime.sendMessage({
            type: 'TOKEN_FOUND',
            token: value,
            source: 'localStorage'
          });
          return value;
        }
      }
    }
  } catch (e) {
    console.log('Cannot access localStorage:', e);
  }
  return null;
}

const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const [resource, config] = args;
  
  if (typeof resource === 'string' && resource.includes('/backend-api/')) {
    console.log('Intercepting ChatGPT API call');
    
    if (config && config.headers) {
      const authHeader = config.headers.get ? config.headers.get('Authorization') : 
                      config.headers.Authorization || config.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        console.log('Found token in fetch headers');
        chrome.runtime.sendMessage({
          type: 'TOKEN_FOUND',
          token: token,
          source: 'fetch'
        });
      }
    }
  }
  
  return originalFetch.apply(this, args);
};

const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
  this._url = url;
  return originalXHROpen.apply(this, arguments);
};

const originalXHRSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(body) {
  if (this._url && this._url.includes('/backend-api/')) {
    console.log('Intercepting XHR to ChatGPT');
    
    const originalSetRequestHeader = this.setRequestHeader;
    this.setRequestHeader = function(name, value) {
      if (name.toLowerCase() === 'authorization' && value.startsWith('Bearer ')) {
        const token = value.replace('Bearer ', '');
        console.log('Found token in XHR headers');
        chrome.runtime.sendMessage({
          type: 'TOKEN_FOUND',
          token: token,
          source: 'xhr'
        });
      }
      return originalSetRequestHeader.apply(this, arguments);
    };
  }
  
  return originalXHRSend.apply(this, arguments);
};

setTimeout(tryGetTokenFromStorage, 2000);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TOKEN_FROM_PAGE') {
    const token = tryGetTokenFromStorage();
    sendResponse({ token: token, found: !!token });
  }
});