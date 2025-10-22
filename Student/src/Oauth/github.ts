import { signInWithPopup, GithubAuthProvider } from 'firebase/auth';
import { auth, githubProvider } from '../config/firebase.config';

export const handleGithubRegister = async () => {
  try {
    console.log('🚀 [GitHub Register] Starting GitHub OAuth flow...');

    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;

    console.log('✅ [GitHub Register] Firebase Auth successful');
    console.log('📋 [GitHub Register] Raw Firebase User Object:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      providerData: user.providerData
    });

    // Try to get email from GitHub API if not provided by Firebase
    let email = user.email || '';
    let displayName = user.displayName || '';

    // Get GitHub access token from credential using the correct method
    const credential = GithubAuthProvider.credentialFromResult(result);
    console.log('🔐 [GitHub Register] Credential object:', credential);
    console.log('🔐 [GitHub Register] Credential exists:', !!credential);

    // Extract access token
    const accessToken = credential?.accessToken;
    console.log('🔑 [GitHub Register] Access token exists:', !!accessToken);
    console.log('🔑 [GitHub Register] Access token length:', accessToken?.length);

    if (accessToken && !email) {
      console.log('⚠️ [GitHub Register] Email not provided by Firebase, fetching from GitHub API...');
      try {

        // Fetch user emails from GitHub API
        console.log('📡 [GitHub Register] Fetching emails from GitHub API...');
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        console.log('📡 [GitHub Register] Email API response status:', emailResponse.status);
        console.log('📡 [GitHub Register] Email API response OK:', emailResponse.ok);

        if (emailResponse.ok) {
          const emails = await emailResponse.json();
          console.log('📧 [GitHub Register] GitHub API emails:', emails);
          console.log('📧 [GitHub Register] Number of emails:', emails.length);

          // Find primary email or first verified email
          const primaryEmail = emails.find((e: any) => e.primary && e.verified);
          const verifiedEmail = emails.find((e: any) => e.verified);
          const firstEmail = emails[0];

          email = (primaryEmail?.email || verifiedEmail?.email || firstEmail?.email || '');
          console.log('✅ [GitHub Register] Primary email:', primaryEmail);
          console.log('✅ [GitHub Register] Verified email:', verifiedEmail);
          console.log('✅ [GitHub Register] First email:', firstEmail);
          console.log('✅ [GitHub Register] Selected email from GitHub API:', email);
        } else {
          const errorText = await emailResponse.text();
          console.error('❌ [GitHub Register] GitHub API email fetch failed:', errorText);
        }

        // Fetch user profile for display name if not provided
        if (!displayName) {
          console.log('📡 [GitHub Register] Fetching user profile from GitHub API...');
          const userResponse = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `token ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          console.log('📡 [GitHub Register] User API response status:', userResponse.status);

          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('👤 [GitHub Register] GitHub API user data:', userData);
            displayName = userData.name || userData.login || '';
            console.log('✅ [GitHub Register] Display name from GitHub API:', displayName);
          } else {
            const errorText = await userResponse.text();
            console.error('❌ [GitHub Register] GitHub API user fetch failed:', errorText);
          }
        }
      } catch (apiError) {
        console.error('❌ [GitHub Register] Failed to fetch from GitHub API:', apiError);
        console.error('❌ [GitHub Register] API Error details:', apiError);
      }
    } else {
      console.log('ℹ️ [GitHub Register] Skipping GitHub API call');
      console.log('   - Access token exists:', !!accessToken);
      console.log('   - Email already provided:', !!email);

      if (!accessToken && !email) {
        console.error('❌ [GitHub Register] No access token and no email!');
      }
    }

    // Get Firebase ID token
    const idToken = await user.getIdToken();
    console.log('🔑 [GitHub Register] ID Token obtained (length):', idToken.length);

    const nameParts = (displayName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    console.log('👤 [GitHub Register] Name parsing:');
    console.log('   - Raw displayName:', displayName);
    console.log('   - Parsed firstName:', firstName);
    console.log('   - Parsed lastName:', lastName);

    const userData = {
      email: email,
      firstName,
      lastName,
      avatar: user.photoURL || '',
      idToken,
    };

    console.log('📦 [GitHub Register] Final userData object:', userData);
    console.log('✉️ [GitHub Register] EMAIL VALUE:', userData.email);
    console.log('📧 [GitHub Register] Email exists:', !!userData.email);
    console.log('📧 [GitHub Register] Email length:', userData.email.length);

    if (!userData.email) {
      console.error('❌ [GitHub Register] No email found!');
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
    console.error('GitHub OAuth Error:', error);
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
    console.log('🚀 [GitHub Login] Starting GitHub OAuth flow...');

    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;

    console.log('✅ [GitHub Login] Firebase Auth successful');

    // Try to get email from GitHub API if not provided by Firebase
    let email = user.email || '';

    // Get GitHub access token from credential using the correct method
    const credential = GithubAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    console.log('🔐 [GitHub Login] Credential exists:', !!credential);
    console.log('🔑 [GitHub Login] Access token exists:', !!accessToken);

    if (accessToken && !email) {
      console.log('⚠️ [GitHub Login] Email not provided by Firebase, fetching from GitHub API...');
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
          console.log('📧 [GitHub Login] GitHub API emails:', emails);

          // Find primary email or first verified email
          const primaryEmail = emails.find((e: any) => e.primary && e.verified);
          const verifiedEmail = emails.find((e: any) => e.verified);
          const firstEmail = emails[0];

          email = (primaryEmail?.email || verifiedEmail?.email || firstEmail?.email || '');
          console.log('✅ [GitHub Login] Email from GitHub API:', email);
        }
      } catch (apiError) {
        console.error('❌ [GitHub Login] Failed to fetch from GitHub API:', apiError);
      }
    }

    // Get Firebase ID token
    const idToken = await user.getIdToken();

    const userData = {
      email: email,
      idToken,
    };

    console.log('📦 [GitHub Login] Final login data:', userData);
    console.log('✉️ [GitHub Login] EMAIL VALUE:', userData.email);

    if (!userData.email) {
      console.error('❌ [GitHub Login] No email found!');
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
    console.error('GitHub Login Error:', error);
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
        error: 'This email is already linked to another account. Please sign in with your original method (Google) or use a different email.'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to sign in with GitHub',
    };
  }
};
