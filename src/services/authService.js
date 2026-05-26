import * as db from '../lib/db';
import config from '../config/config';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = null;

    // Try to load user from session storage
    const storedUser = sessionStorage.getItem('currentUser');
    const storedToken = sessionStorage.getItem('googleToken');

    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.token = storedToken || null;
      } catch (e) {
        console.error('Error parsing stored user data:', e);
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('googleToken');
      }
    }
  }

  /**
   * Sign in using OAuth 2.0 access token
   */
  async signIn(accessToken) {
    try {
      const isLocalDev =
        typeof window !== 'undefined' && window.location.hostname === 'localhost';

      if (!accessToken) {
        throw new Error('No access token provided');
      }

      // Save token
      this.token = accessToken;
      sessionStorage.setItem('googleToken', accessToken);

      // Step 1: Validate token and fetch user profile from Google
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (profileRes.status === 401) {
        // Token is invalid or expired
        sessionStorage.removeItem('googleToken');
        this.token = null;
        throw new Error('Access token is invalid or expired. Please sign in again.');
      }
      
      if (profileRes.status === 403) {
        // Token doesn't have required scopes
        throw new Error('Access token does not have required permissions. Please grant all requested permissions.');
      }
      
      if (!profileRes.ok) {
        throw new Error(`Failed to fetch user profile from Google: ${profileRes.status} ${profileRes.statusText}`);
      }

      const profile = await profileRes.json();
      const email = profile.email;

      if (!email) {
        throw new Error('No email found in Google profile');
      }
      // Step 2: Domain restriction
      if (
        !email.endsWith('@reyanshelectronics.com') &&
        !config.useLocalStorage &&
        !isLocalDev
      ) {
        throw new Error('Only @reyanshelectronics.com users are allowed');
      }

      // Step 4: Local development / LocalStorage mode – mock user from Google profile
      if (config.useLocalStorage || isLocalDev) {
        this.currentUser = {
          email,
          name: profile.name,
          role: 'Customer Relations Manager',
          permissions: 'CRUD',
          imageUrl: profile.picture
        };
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        return this.currentUser;
      }

      // Step 5: Production – look up user from users table
      try {
        const tableName = db.getTableName(config.sheets.users) || 'users';
        const users = await db.getTableRows(tableName);
        const user = users.find(u => (u.Email || u.email) === email);

        if (!user) {
          throw new Error('User not found in the system. Please contact your administrator.');
        }

        this.currentUser = {
          email,
          name: profile.name || user.Name || 'Unknown User',
          role: user.Role || 'User',
          permissions: user.Permissions || 'READ',
          imageUrl: profile.picture
        };

        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        return this.currentUser;
      } catch (userError) {
        console.error('Error getting user data from sheet:', userError);
        throw new Error(`Error getting user data: ${userError.message}`);
      }

    } catch (error) {
      console.error('Error during sign in:', error);
      // Clean up on error
      sessionStorage.removeItem('googleToken');
      this.token = null;
      throw error;
    }
  }

  /**
   * Sign out - Enhanced to properly revoke Google OAuth token and force re-authentication
   */
  async signOut() {
    try {
      // Step 1: Revoke the Google OAuth token if we have one
      if (this.token) {
        try {
          await this.revokeGoogleToken(this.token);
        } catch (revokeError) {
          console.warn('Failed to revoke Google token:', revokeError);
          // Continue with sign out even if token revocation fails
        }
      }

      // Step 2: Clear Google OAuth state and disable auto-select
      if (window.google && window.google.accounts) {
        try {
          // Disable auto-select to prevent automatic re-authentication
          window.google.accounts.id.disableAutoSelect();
          
          // Clear any cached OAuth state
          if (window.google.accounts.oauth2) {
            // Revoke any cached tokens in the browser
            window.google.accounts.oauth2.revoke(this.token, () => {
            });
          }
        } catch (googleError) {
          console.warn('Error clearing Google OAuth state:', googleError);
        }
      }

      // Step 3: Clear all local storage and session data
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('googleToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('googleToken');
      
      // Clear any other potential auth-related storage
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('google') || key.includes('oauth') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));

      // Step 4: Reset service state
      this.currentUser = null;
      this.token = null;

      // Step 5: Clear any cached token client
      if (window.tokenClient) {
        window.tokenClient = null;
      }
      return true;
    } catch (error) {
      console.error('Error during enhanced sign out:', error);
      
      // Force clear everything even if there's an error
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('googleToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('googleToken');
      this.currentUser = null;
      this.token = null;
      
      return true;
    }
  }

  /**
   * Revoke Google OAuth token
   */
  async revokeGoogleToken(accessToken) {
    if (!accessToken) {
      return;
    }

    try {
      const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.ok) {
        return true;
      } else {
        console.warn('Failed to revoke Google OAuth token:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error revoking Google OAuth token:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get stored token
   */
  getToken() {
    return this.token || sessionStorage.getItem('googleToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Validate current token with Google
   */
  async validateToken() {
    const token = this.getToken();
    
    // If no token, user is not authenticated
    if (!token) {
      return false;
    }

    // For mock/development tokens, always return true
    if (token === 'mock-token' || config.useLocalStorage) {
      return true;
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        return true;
      } else if (response.status === 401) {
        // Token is invalid or expired
        console.warn('Token validation failed: Token expired or invalid (401)');
        sessionStorage.removeItem('googleToken');
        sessionStorage.removeItem('currentUser');
        this.token = null;
        this.currentUser = null;
        return false;
      } else {
        console.warn('Token validation failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error validating token:', error);
      // On network errors, assume token is still valid to avoid unnecessary logouts
      // Only clear on explicit 401 responses
      return true;
    }
  }

  /**
   * Check if user has specific role (CEO check is case-insensitive for robustness)
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;
    const r = (user.role || '').trim();
    const roleNorm = (role || '').trim();
    if (roleNorm.toUpperCase() === 'CEO') {
      return r.toUpperCase() === 'CEO';
    }
    return r === roleNorm;
  }

  /**
   * Mock login for development
   */
  mockLogin(role) {
    const mockUser = {
      email: `mock.${role.toLowerCase()}@reyanshelectronics.com`, // ✅ FIXED: Backticks for string interpolation
      name: `Mock ${role}`, // ✅ FIXED
      role,
      permissions: 'CRUD',
      imageUrl: ''
    };

    this.currentUser = mockUser;
    sessionStorage.setItem('currentUser', JSON.stringify(mockUser));

    return mockUser;
  }

  /**
   * Direct login for specific email (useful for testing CEO access)
   */
  directLogin(email, role = 'CEO') {
    const user = {
      email,
      name: role,
      role,
      permissions: 'CRUD',
      imageUrl: ''
    };

    this.currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem('googleToken', 'mock-token');

    return user;
  }

  /**
   * Debug OAuth configuration and token
   */
  debugOAuth() {
    const debugInfo = {
      hasGoogle: !!window.google,
      hasGoogleAccounts: !!(window.google && window.google.accounts),
      hasTokenClient: !!window.tokenClient,
      currentToken: this.token,
      storedToken: sessionStorage.getItem('googleToken'),
      currentUser: this.currentUser,
      storedUser: sessionStorage.getItem('currentUser'),
      oauthScopes: [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ]
    };
    return debugInfo;
  }
}

export default new AuthService();
