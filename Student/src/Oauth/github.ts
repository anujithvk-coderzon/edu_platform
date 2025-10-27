import { signInWithPopup, GithubAuthProvider } from 'firebase/auth';
import { auth, githubProvider } from '../config/firebase.config';

export const handleGithubRegister = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;

    // Try to get email from GitHub API if not provided by Firebase
    let email = user.email || '';
    let displayName = user.displayName || '';

    // Get GitHub access token from credential
    const credential = GithubAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (accessToken && !email) {
      try {
        // Fetch user emails from GitHub API
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (emailResponse.ok) {
          const emails = await emailResponse.json();
          const primaryEmail = emails.find((e: any) => e.primary && e.verified);
          const verifiedEmail = emails.find((e: any) => e.verified);
          const firstEmail = emails[0];
          email = (primaryEmail?.email || verifiedEmail?.email || firstEmail?.email || '');
        }

        // Fetch user profile for display name if not provided
        if (!displayName) {
          const userResponse = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `token ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            displayName = userData.name || userData.login || '';
          }
        }
      } catch (apiError) {
        // Failed to fetch from GitHub API
      }
    }

    // Get Firebase ID token
    const idToken = await user.getIdToken();

    const nameParts = (displayName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userData = {
      email: email,
      firstName,
      lastName,
      avatar: user.photoURL || '',
      idToken,
    };

    if (!userData.email) {
      return {
        success: false,
        error: 'GitHub did not provide an email address. Please make sure your GitHub email is public or verified.'
      };
    }

    return {
      success: true,
      data: userData,
    };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-up cancelled' };
    }

    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: 'Popup blocked. Please enable popups' };
    }

    if (error.code === 'auth/account-exists-with-different-credential') {
      return {
        success: false,
        error: 'This email is already linked to another account. Please sign in with your original method (Google) or use a different email.'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to sign up with GitHub',
    };
  }
};

export const handleGithubLogin = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;

    // Try to get email from GitHub API if not provided by Firebase
    let email = user.email || '';

    // Get GitHub access token from credential
    const credential = GithubAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (accessToken && !email) {
      try {
        // Fetch user emails from GitHub API
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (emailResponse.ok) {
          const emails = await emailResponse.json();
          const primaryEmail = emails.find((e: any) => e.primary && e.verified);
          const verifiedEmail = emails.find((e: any) => e.verified);
          const firstEmail = emails[0];
          email = (primaryEmail?.email || verifiedEmail?.email || firstEmail?.email || '');
        }
      } catch (apiError) {
        // Failed to fetch from GitHub API
      }
    }

    // Get Firebase ID token
    const idToken = await user.getIdToken();

    const userData = {
      email: email,
      idToken,
    };

    if (!userData.email) {
      return {
        success: false,
        error: 'GitHub did not provide an email address. Please make sure your GitHub email is public or verified.'
      };
    }

    return {
      success: true,
      data: userData,
    };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-in cancelled' };
    }

    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: 'Popup blocked. Please enable popups' };
    }

    if (error.code === 'auth/account-exists-with-different-credential') {
      return {
        success: false,
        error: 'This email is already linked to another account. Please sign in with your original method (Google) or use a different email.'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to sign in with GitHub',
    };
  }
};
