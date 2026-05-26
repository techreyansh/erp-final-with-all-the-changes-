# Google OAuth Setup Instructions

## Error Explanation

The error you're seeing:

```
Error checking sheet PO_Master: API keys are not supported by this API. Expected OAuth2 access token or other authentication credentials that assert a principal. See https://cloud.google.com/docs/authentication
```

This error occurs because Google Sheets API requires OAuth2 authentication for certain operations, not just an API key. API keys only allow read-only access to public resources, but to read/write private Google Sheets, you need OAuth2 authentication.

## Solution Steps

1. We've updated your code to use OAuth2 authentication instead of just an API key.
2. You need to create OAuth credentials in Google Cloud Console:

### Step 1: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google Sheets API and Google Drive API
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API" and enable it
   - Search for "Google Drive API" and enable it

### Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace organization)
3. Fill in the required app information:
   - App name (e.g., "Reyansh Factory Operations")
   - User support email
   - Developer contact information
4. Add the scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
5. Add your test users (email addresses) that will use the app

### Step 3: Create OAuth Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Web application"
4. Name: "Reyansh Web Client"
5. Authorized JavaScript origins:
   - Add `http://localhost:3000` for development
   - Add your production domain if deploying
6. Click "Create"

### Step 4: Update Your Code

1. Copy your Client ID from the credentials you just created
2. Paste it in the `src/config/oauthConfig.js` file:
   ```js
   const oauthConfig = {
     clientId: "YOUR_CLIENT_ID_HERE", // Replace with your Client ID
     scope:
       "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
   };
   ```

### Step 5: Restart Your Application

1. Stop your current development server
2. Run `npm start` again
3. When you access the application, you'll be prompted to sign in with Google
4. Sign in with a Google account that has access to your Google Sheet

## Troubleshooting

- Ensure your spreadsheet ID in `config.js` is correct
- Make sure your Google account has access to the spreadsheet
- If you're getting "Unauthorized" errors, check that your OAuth client ID is configured correctly
- For CORS errors, ensure your authorized origins in the OAuth client settings include your development URL

## Additional Information

- OAuth flow requires a browser interaction (sign-in popup)
- The first time you use your application, you'll have to approve the requested scopes
- For production, you'll need to verify your app with Google if you plan to make it available to all users

If you need further assistance, refer to [Google's OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2).
