import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.config';

export const handleGoogleRegister = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Debug: Log the entire user object
    console.log('🔍 Firebase User Object:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      providerId: user.providerId,
      providerData: user.providerData
    });

    // Get Firebase ID token
    const idToken = await user.getIdToken();

    const nameParts = (user.displayName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userData = {
      email: user.email || '',
      firstName,
      lastName,
      avatar: user.photoURL || '',
      idToken,
    };

    console.log('Google OAuth Data:', userData);

    return {
      success: true,
      data: userData,
    };
  } catch (error: any) {
    console.error('Google OAuth Error:', error);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);

    if (error.code === 'auth/popup-closed-by-user') {
      console.log('User closed the popup');
      return { success: false, error: 'Sign-up cancelled' };
    }

    if (error.code === 'auth/popup-blocked') {
      console.log('Popup was blocked by browser');
      return { success: false, error: 'Popup blocked. Please enable popups' };
    }

    if (error.code === 'auth/account-exists-with-different-credential') {
      console.log('Account exists with different credential');
      return {
        success: false,
        error: 'This email is already linked to another account. Please sign in with your original method (GitHub) or use a different email.'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to sign up with Google',
    };
  }
};

export const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Get Firebase ID token
    const idToken = await user.getIdToken();

    const userData = {
      email: user.email || '',
      idToken,
    };

    console.log('Google Login Data:', userData);

    return {
      success: true,
      data: userData,
    };
  } catch (error: any) {
    console.error('Google Login Error:', error);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);

    if (error.code === 'auth/popup-closed-by-user') {
      console.log('User closed the popup');
      return { success: false, error: 'Sign-in cancelled' };
    }

    if (error.code === 'auth/popup-blocked') {
      console.log('Popup was blocked by browser');
      return { success: false, error: 'Popup blocked. Please enable popups' };
    }

    if (error.code === 'auth/account-exists-with-different-credential') {
      console.log('Account exists with different credential');
      return {
        success: false,
        error: 'This email is already linked to another account. Please sign in with your original method (GitHub) or use a different email.'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to sign in with Google',
    };
  }
};
