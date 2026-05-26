# Google OAuth Origin Issue Troubleshooting

## The Error

You're seeing this error:

```
"Not a valid origin for the client: http://localhost:3000 has not been registered for client ID 476258971954-k11l81qo4ug6k7ka8vtcm8i0um8htd27.apps.googleusercontent.com. Please go to https://console.developers.google.com/ and register this origin for your project's client ID."
```

This error occurs when the domain/origin you're running your application from doesn't match any of the authorized JavaScript origins in your Google Cloud Console OAuth configuration.

## Troubleshooting Steps

### 1. Check Authorized JavaScript Origins in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Find and click on your OAuth 2.0 Client ID
5. Under "Authorized JavaScript origins", make sure you have **exactly** `http://localhost:3000` (no trailing slash)
6. Also add `http://127.0.0.1:3000` as an alternative

### 2. Verify No Typos or Trailing Slashes

Make sure there are no typos or trailing slashes in your origins:

- ✅ `http://localhost:3000`
- ❌ `http://localhost:3000/` (trailing slash)
- ❌ `https://localhost:3000` (https instead of http)
- ❌ `http://localhost:8000` (wrong port)

### 3. Wait for Propagation

After making changes to your OAuth configuration in Google Cloud Console, it can take up to 5-10 minutes for changes to propagate through Google's systems.

### 4. Try the Simple OAuth Test Page

We've created a simple test page to verify your OAuth configuration:

1. Stop your React application (if running)
2. Open `http://localhost:3000/oauth-test.html` in your browser
3. Click "Sign In with Google"
4. Check the result:
   - If successful, your OAuth configuration is working correctly
   - If you get the same error, there's still an issue with your OAuth configuration

### 5. Clear Browser Cache and Cookies

Sometimes browser caching can cause issues:

1. Open your browser's settings
2. Clear cookies and cache for localhost
3. Try again in a fresh browser session
4. Alternatively, try using an incognito/private window

### 6. Check Developer Console

Open your browser's developer console (F12 or Ctrl+Shift+I) before accessing your app to check for additional error details that might be helpful.

### 7. Verify Client ID

Make sure the client ID in your application matches exactly with the one in Google Cloud Console:

The client ID in your error message is:

```
476258971954-k11l81qo4ug6k7ka8vtcm8i0um8htd27.apps.googleusercontent.com
```

Check that this exact ID is:

- In your `src/config/oauthConfig.js` file
- In your Login.js component
- Matches the client ID in Google Cloud Console

### 8. Create a New OAuth Credential

If all else fails, try creating a completely new OAuth client ID:

1. Go to Google Cloud Console > "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS" > "OAuth client ID"
3. Select "Web application"
4. Enter a name
5. Add `http://localhost:3000` and `http://127.0.0.1:3000` under "Authorized JavaScript origins"
6. Click "CREATE"
7. Copy the new client ID and update it in your application

### 9. Ensure Your Google Cloud Project Has the Right APIs Enabled

Make sure both the Google Sheets API and Google Drive API are enabled:

1. Go to Google Cloud Console > "APIs & Services" > "Library"
2. Search for and enable both APIs

### 10. Temporarily Try API Key Mode

For testing, you can temporarily change your config to use API key mode:

```js
// In src/config/config.js
useLocalStorage: true;
```

This will use only the API key for read-only operations while you troubleshoot the OAuth issue.

## Testing Specific Parts

### Test Google Sign-In Outside Your Application

1. Visit `http://localhost:3000/oauth-test.html`
2. Try signing in there
3. If it works, the issue is in your application code, not your OAuth configuration

### Inspect Network Requests

During the OAuth process, inspect the network requests to see specific errors:

1. Open the Developer Console in your browser
2. Go to the "Network" tab
3. Try to sign in
4. Look for requests to `accounts.google.com` domains
5. Examine the responses for detailed error messages

## Need More Help?

If you're still having issues, check out these resources:

- [Official Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google OAuth for Web Apps Guide](https://developers.google.com/identity/sign-in/web/sign-in)
- [Google Cloud Console Help](https://support.google.com/cloud)
