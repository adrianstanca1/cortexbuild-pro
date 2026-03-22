const GITHUB_CONFIG = {
  clientId: process.env.VITE_GITHUB_CLIENT_ID,
  clientSecret: '',
  redirectUri: '/auth/callback',
  appName: 'CortexBuildPro',
  appUrl: 'https://github.com/apps/cortexbuildpro-com'
};

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  company: string | null;
  location: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface AuthState {
  state: string;
  redirectUrl?: string;
  timestamp: number;
}

class GitHubAuthService {
  private readonly baseUrl: string;
  private readonly storageKey = 'github_auth_state';
  private readonly tokenKey = 'github_access_token';

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  private generateState(): string {
    const array = new Uint32Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, (x) => x.toString(16)).join('');
  }

  getAuthorizationUrl(redirectUrl?: string): string {
    const state = this.generateState();

    const authState: AuthState = {
      state,
      redirectUrl,
      timestamp: Date.now()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(authState));

    const params = new URLSearchParams({
      client_id: GITHUB_CONFIG.clientId,
      redirect_uri: `${this.baseUrl}${GITHUB_CONFIG.redirectUri}`,
      scope: 'user:email read:user',
      state,
      response_type: 'code'
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  loginWithPopup(): Promise<string> {
    return new Promise((resolve, reject) => {
      const authUrl = this.getAuthorizationUrl();
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'GitHubLogin',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no`
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for GitHub authentication.'));
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== this.baseUrl) return;
        if (event.data.type === 'github_oauth_callback') {
          window.removeEventListener('message', handleMessage);
          popup.close();
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.code);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('Authentication timed out'));
      }, 5 * 60 * 1000);
    });
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch('/api/auth/github/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data: GitHubTokenResponse = await response.json();
    localStorage.setItem(this.tokenKey, data.access_token);
    return data.access_token;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  async getCurrentUser(): Promise<GitHubUser> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem(this.tokenKey);
        throw new Error('Token expired or invalid');
      }
      throw new Error('Failed to fetch user data');
    }

    return response.json();
  }

  async getUserEmails(): Promise<string[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }

    const emails = await response.json();
    return emails
      .filter((e: { verified: boolean; primary: boolean }) => e.verified && e.primary)
      .map((e: { email: string }) => e.email);
  }

  verifyState(receivedState: string): boolean {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return false;

    try {
      const authState: AuthState = JSON.parse(stored);
      const isValid = authState.state === receivedState &&
                      Date.now() - authState.timestamp < 10 * 60 * 1000;

      localStorage.removeItem(this.storageKey);

      return isValid;
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.storageKey);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const githubAuth = new GitHubAuthService();
export default githubAuth;
