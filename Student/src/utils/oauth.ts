import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebase.config';

interface OAuthResult {
  success: boolean;
  data?: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    idToken: string;
  };
  error?: string;
}

/**
 * Split display name into first and last name
 */
const splitDisplayName = (displayName: string): { firstName: string; lastName: string } => {
  const nameParts = displayName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  return { firstName, lastName };
};

/**
 * Handle Google OAuth Authentication
 */
export const signInWithGoogle = async (): Promise<OAuthResult> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Get ID token
    const idToken = await user.getIdToken();

    // Extract and split name
    const { firstName, lastName } = splitDisplayName(user.displayName || '');

    return {
      success: true,
      data: {
        email: user.email || '',
        firstName,
        lastName,
        avatar: user.photoURL || undefined,
        idToken,
      },
    };
  } catch (error: any) {
    console.error('Google sign-in error:', error);

    // Handle specific error codes
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-in cancelled' };
    }
    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: 'Popup blocked. Please enable popups' };
    }
    if (error.code === 'auth/account-exists-with-different-credential') {
      return { success: false, error: 'Account exists with different sign-in method' };
    }

    return {
      success: false,
      error: error.message || 'Failed to sign in with Google',
    };
  }
};

/**
 * Handle GitHub OAuth Authentication
 */
export const signInWithGithub = async (): Promise<OAuthResult> => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;

    // Get ID token
    const idToken = await user.getIdToken();

    // Extract and split name
    const { firstName, lastName } = splitDisplayName(user.displayName || '');

    return {
      success: true,
      data: {
        email: user.email || '',
        firstName,
        lastName,
        avatar: user.photoURL || undefined,
        idToken,
      },
    };
  } catch (error: any) {
    console.error('GitHub sign-in error:', error);

    // Handle specific error codes
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-in cancelled' };
    }
    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: 'Popup blocked. Please enable popups' };
    }
    if (error.code === 'auth/account-exists-with-different-credential') {
      return { success: false, error: 'Account exists with different sign-in method' };
    }

    return {
      success: false,
      error: error.message || 'Failed to sign in with GitHub',
    };
  }
};

/**
 * Send OAuth data to backend for login
 */
export const oauthLogin = async (provider: 'google' | 'github', idToken: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/student/auth/oauth-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ provider, idToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OAuth login failed');
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Send OAuth data to backend for registration
 */
export const oauthRegister = async (
  provider: 'google' | 'github',
  oauthData: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    idToken: string;
  },
  additionalData: {
    phone: string;
    dateOfBirth: string;
    gender: string;
    country: string;
    city: string;
    education: string;
    institution?: string;
    occupation?: string;
    company?: string;
  }
) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/student/auth/oauth-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        provider,
        idToken: oauthData.idToken,
        email: oauthData.email,
        firstName: oauthData.firstName,
        lastName: oauthData.lastName,
        avatar: oauthData.avatar,
        ...additionalData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OAuth registration failed');
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
