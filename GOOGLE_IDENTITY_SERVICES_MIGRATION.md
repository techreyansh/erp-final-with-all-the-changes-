# Migrating to Google Identity Services

## The Error

You're seeing this error:

```
"idpiframe_initialization_failed": "You have created a new client application that uses libraries for user authentication or authorization that are deprecated. New clients must use the new libraries instead. See the Migration Guide for more information."
```

## What Happened

Google has deprecated the old OAuth authentication method (gapi.auth2) that this application was using. Google now requires the use of their new Google Identity Services library.

## Changes Made

We've updated the application to use the new Google Identity Services:

1. Updated `public/index.html` to load the Google Identity Services library
2. Updated `src/components/auth/Login.js` to use the new authentication flow
3. Created a new OAuth configuration in `src/config/oauthConfig.js`
4. Updated `src/services/authService.js` to handle the new token format
5. Updated `src/services/sheetService.js` to work with the new authentication method
6. Added an updated OAuth test page at `public/oauth-test.html`

## Authentication Flow

The new authentication flow works like this:

1. Google Identity Services renders a sign-in button
2. User clicks the button and authenticates with Google
3. Google returns a JWT (JSON Web Token) credential
4. We decode this token to get user information
5. We use this token for authenticated API calls

## How to Test

1. Visit `http://localhost:3000/oauth-test.html` to test if your OAuth credentials work
2. If it works, try signing in to the main application

## Common Issues

### 1. Invalid Origin

Make sure your OAuth client ID in Google Cloud Console has the correct JavaScript origins:

- http://localhost:3000
- http://127.0.0.1:3000

### 2. API Enablement

Ensure you have enabled the required APIs in Google Cloud Console:

- Google Sheets API
- Google Drive API
- Google Identity Services API

### 3. OAuth Consent Screen

Check that your OAuth consent screen is properly configured with:

- Appropriate app name
- User support email
- Developer contact information
- Required scopes:
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.file`

## Temporary Workaround

While configuring OAuth, we've temporarily enabled `useLocalStorage: true` in the config to use local storage instead of Google Sheets. This allows the application to function without valid OAuth credentials.

## References

- [Google Identity Services Migration Guide](https://developers.google.com/identity/gsi/web/guides/gis-migration)
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
