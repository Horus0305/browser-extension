// OAuth callback handler for browser extensions
export default defineUnlistedScript(() => `
(function(){
  try {
    console.log('OAuth callback handler started');
    
    var search = (typeof window !== 'undefined' && window.location && window.location.search) ? window.location.search : '';
    var urlParams = new URLSearchParams(search);
    var hasError = urlParams.has('error');
    var errorParam = urlParams.get('error');
    
    var runtime = (typeof chrome !== 'undefined' && chrome.runtime) || (typeof browser !== 'undefined' && browser.runtime) || null;
    var tabs = (typeof chrome !== 'undefined' && chrome.tabs) || (typeof browser !== 'undefined' && browser.tabs) || null;

    console.log('OAuth callback URL params:', search);
    console.log('Has error:', hasError, 'Error:', errorParam);

    if (hasError) {
      var err = errorParam || 'Authentication failed';
      console.error('OAuth failed with error:', err);
      
      // Send error message to background script
      if (runtime && runtime.sendMessage) {
        runtime.sendMessage({ 
          type: 'OAUTH_ERROR', 
          error: err, 
          timestamp: Date.now() 
        });
      }
    } else {
      console.log('OAuth appeared successful, notifying background script');
      
      // Send success message to background script
      if (runtime && runtime.sendMessage) {
        runtime.sendMessage({ 
          type: 'OAUTH_SUCCESS', 
          timestamp: Date.now() 
        });
      }
    }

    // Close the tab after a short delay to allow message processing
    setTimeout(function(){
      console.log('Attempting to close OAuth callback tab');
      if (tabs && tabs.getCurrent) {
        tabs.getCurrent(function(tab){ 
          if (tab && tab.id && tabs.remove) {
            tabs.remove(tab.id, function() {
              if (chrome.runtime.lastError) {
                console.log('Tab close error (expected):', chrome.runtime.lastError.message);
              }
            });
          }
        });
      } else if (typeof window !== 'undefined' && window.close) {
        window.close();
      }
    }, 1000); // Increased delay to ensure message is sent
    
  } catch (e) {
    console.error('OAuth callback handler error:', e);
    var runtime2 = (typeof chrome !== 'undefined' && chrome.runtime) || (typeof browser !== 'undefined' && browser.runtime) || null;
    if (runtime2 && runtime2.sendMessage) {
      runtime2.sendMessage({ 
        type: 'OAUTH_ERROR', 
        error: (e && e.message) || 'OAuth callback handler failed', 
        timestamp: Date.now() 
      });
    }
  }
})();
`);
