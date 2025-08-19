# Google OAuth Setup Guide for Browser Extension

This guide will help you configure Google OAuth for your browser extension with Appwrite.

## 1. Google Cloud Console Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)

### Step 2: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Add the following to **Authorized redirect URIs**:
   ```
   https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/browser-usage-tracker
   ```
   Replace `fra.cloud.appwrite.io` with your Appwrite endpoint if different.

5. Save the **Client ID** and **Client Secret**

### Step 3: Configure for Extensions (Optional)
For better extension support, you can also add:
- `chrome-extension://[YOUR-EXTENSION-ID]/oauth-callback.html`
- `moz-extension://[YOUR-EXTENSION-ID]/oauth-callback.html`

You can find your extension ID in the Chrome/Firefox extension management page when you load your extension.

## 2. Appwrite Console Setup

### Step 1: Enable Google OAuth Provider
1. Go to your Appwrite console
2. Navigate to **Auth** > **Settings**
3. Find **Google** in the OAuth providers list
4. Click to enable it

### Step 2: Configure Google Provider
Fill in the following details:
- **Google Client ID**: The Client ID from Google Cloud Console
- **Google Client Secret**: The Client Secret from Google Cloud Console

### Step 3: Set Redirect URLs
In the OAuth provider settings, ensure the redirect URL matches what you configured in Google Cloud Console:
```
https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/browser-usage-tracker
```

## 3. Extension Configuration

### Update Environment Variables
Add or update your `.env` file:
```env
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_DATABASE_ID=usage-tracker
VITE_APPWRITE_COLLECTION_ID=usage-data
```

### Extension Permissions
Ensure your `wxt.config.ts` includes the necessary permissions:
```typescript
permissions: [
  'tabs', 
  'storage', 
  'activeTab',
  'identity'  // Required for OAuth
],
host_permissions: [
  'https://cloud.appwrite.io/*',
  'https://*.cloud.appwrite.io/*',
  'https://accounts.google.com/*',
  'https://*.accounts.google.com/*'
]
```

## 4. Testing OAuth Flow

### Test Steps
1. Build and load your extension
2. Open the popup
3. Click "Continue with Google"
4. You should be redirected to Google's login page
5. After successful login, you should be redirected back to Appwrite
6. The extension should receive the authentication success message

### Debugging
- Check the browser console for error messages
- Verify that the OAuth URLs are correctly configured
- Ensure all permissions are granted
- Check Appwrite logs for authentication errors

## 5. Common Issues and Solutions

### Issue: "redirect_uri_mismatch"
**Solution**: Ensure the redirect URI in Google Cloud Console exactly matches the one configured in Appwrite.

### Issue: "invalid_client"
**Solution**: Double-check the Client ID and Client Secret in Appwrite console.

### Issue: Extension can't complete OAuth
**Solution**: 
1. Ensure the `identity` permission is included
2. Check that host_permissions include Google domains
3. Verify the OAuth callback handler is properly configured

### Issue: "Origin not allowed"
**Solution**: Add your extension's origin to the authorized origins in Google Cloud Console if needed.

## 6. Alternative: Chrome Identity API

For Chrome extensions, you can use the Chrome Identity API instead of web-based OAuth:

1. Add your extension ID to Google Cloud Console as a Chrome Extension
2. Use the `chrome.identity.launchWebAuthFlow` API
3. This provides better integration with Chrome's authentication system

The provided code includes support for both methods and will automatically use Chrome Identity API when available.

## Security Notes

- Never expose your Google Client Secret in client-side code
- The Client Secret should only be configured in your Appwrite console
- Always use HTTPS for redirect URIs
- Regularly rotate your OAuth credentials
- Monitor usage in Google Cloud Console

## Support

If you encounter issues:
1. Check Appwrite documentation: https://appwrite.io/docs/products/auth/oauth2
2. Check Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
3. Verify all URLs and credentials are correctly configured
4. Test with a simple web application first before testing with the extension
