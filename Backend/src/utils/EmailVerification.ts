
import axios from 'axios';
import { timeStamp } from 'console';


const otpStorage = new Map();

// Clean up old OTPs every 10 minutes
setInterval(() => {
    const currentTime = Date.now();

    // Check each stored OTP
    for (const [email, data] of otpStorage.entries()) {
        const otpAge = currentTime - data.timestamp;
        const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
        // If OTP is older than 10 minutes, delete it
        if (otpAge > tenMinutes) {
            otpStorage.delete(email);
        }
    }
}, 10 * 60 * 1000); // Run cleanup every 10 minutes

// Generate a random 6-digit OTP
export const generateOTP = () => {
    // Generate random number between 100000 and 999999
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
};

// Save OTP for a user
export const storeOTP = (email, otp, userData) => {
    otpStorage.set(email, {
        otp: otp,                    // The 6-digit code
        timestamp: Date.now(),       // When it was created
        userData: userData           // User's registration data
    });
};

// Check if OTP is correct
export const verifyOTP = (email, userEnteredOTP) => {
    // Step 1: Check if we have an OTP for this email
    const storedData = otpStorage.get(email);

    if (!storedData) {
        return {
            valid: false,
            message: "No OTP found. Please request a new one."
        };
    }

    // Step 2: Check if OTP is not expired (10 minutes limit)
    const currentTime = Date.now();
    const otpAge = currentTime - storedData.timestamp;
    const tenMinutes = 10 * 60 * 1000;

    if (otpAge > tenMinutes) {
        otpStorage.delete(email); // Remove expired OTP
        return {
            valid: false,
            message: "OTP has expired. Please request a new one."
        };
    }

    // Step 3: Check if the OTP matches
    if (storedData.otp === userEnteredOTP) {
        // Success! OTP is correct
        const userData = storedData.userData; // Get the user's registration data
        otpStorage.delete(email); // Remove used OTP

        return {
            valid: true,
            userData: userData,
            message: "OTP verified successfully!"
        };
    }

    return {
        valid: false,
        message: "Invalid OTP. Please try again."
    };
};

// Send email with OTP
export const sendVerificationEmail = async (email, otp) => {
    try {
        const apiKey = process.env.API_KEY;


        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';

        const emailData = {
            sender: {
                name: 'Codiin',
                email: 'anujith.vk@coderzon.com'
            },
            to: [
                {
                    email: email
                }
            ],
            subject: 'Email Verification - Your OTP Code',
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Email Verification</h1>
                        </div>
                        <div class="content">
                            <h2>Welcome to Codiin!</h2>
                            <p>Thank you for registering with us. Please use the following OTP code to verify your email address:</p>

                            <div class="otp-box">
                                <div class="otp-code">${otp}</div>
                            </div>

                            <p><strong>This code will expire in 10 minutes.</strong></p>
                            <p>If you didn't request this verification, please ignore this email.</p>

                            <div class="footer">
                                <p>© 2024 Codiin. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        console.log('Making request to Brevo with:', {
            url,
            headers: {
                'accept': 'application/json',
                'api-key': apiKey.substring(0, 20) + '...',
                'content-type': 'application/json'
            }
        });

        const response = await axios.post(url, emailData, {
            headers: {
                'Accept': 'application/json',
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('Email sent successfully:', response.data);
        return { success: true };
    } catch (error) {
        console.error('Email sending error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send email. Please try again.'
        };
    }
};





export const sendTutorVerificationEmail = async (email, otp) => {
    try {
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';

        const emailData = {
            sender: {
                name: 'Codiin',
                email: 'anujith.vk@coderzon.com'
            },
            to: [
                {
                    email: email
                }
            ],
            subject: 'Tutor Registration - Email Verification',
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px solid #4F46E5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                        .note { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎓 Tutor Registration</h1>
                        </div>
                        <div class="content">
                            <h2>Welcome to Codiin!</h2>
                            <p>Thank you for your interest in becoming a tutor on our platform. Please use the following OTP code to verify your email address:</p>

                            <div class="otp-box">
                                <div class="otp-code">${otp}</div>
                            </div>

                            <p><strong>This code will expire in 10 minutes.</strong></p>

                            <div class="note">
                                <strong>📋 Next Steps:</strong>
                                <p>After email verification, your registration request will be sent to our admin team for review. You'll receive a welcome email once your account is approved and activated.</p>
                            </div>

                            <p>If you didn't request this registration, please ignore this email.</p>

                            <div class="footer">
                                <p>© 2024 Codiin. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const response = await axios.post(url, emailData, {
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('Tutor verification email sent successfully:', response.data);
        return { success: true };
    } catch (error) {
        console.error('Tutor verification email error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send email. Please try again.'
        };
    }
};

export const sendTutorWelcomeEmail = async (email, firstname) => {
    try {
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';

        const emailData = {
            sender: {
                name: 'Codiin',
                email: 'anujith.vk@coderzon.com'
            },
            to: [
                {
                    email: email
                }
            ],
            subject: 'Welcome to Codiin - Your Tutor Account is Active!',
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .welcome-box { background: white; border: 2px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0; }
                        .btn { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                        .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .feature-item { padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Welcome to Codiin!</h1>
                        </div>
                        <div class="content">
                            <div class="welcome-box">
                                <h2>Congratulations, ${firstname}!</h2>
                                <p>Your tutor account has been approved and activated. You can now login to your dashboard and start creating amazing courses!</p>
                            </div>

                            <div class="features">
                                <h3>What you can do now:</h3>
                                <div class="feature-item">✅ Create and publish courses</div>
                                <div class="feature-item">✅ Upload course materials (videos, PDFs, etc.)</div>
                                <div class="feature-item">✅ Manage your students</div>
                                <div class="feature-item">✅ Track student progress</div>
                                <div class="feature-item">✅ Create assignments and grade submissions</div>
                            </div>

                            <div style="text-align: center;">
                                <a href="${process.env.ADMIN_URL || 'http://localhost:3001'}/login" class="btn">Login to Dashboard</a>
                            </div>

                            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>

                            <div class="footer">
                                <p>© 2024 Codiin. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const response = await axios.post(url, emailData, {
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('Tutor welcome email sent successfully:', response.data);
        return { success: true };
    } catch (error) {
        console.error('Tutor welcome email error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send email. Please try again.'
        };
    }
};

export const WelcomeEmail = async (email, firstname) => {
    console.log('📧 WelcomeEmail function called with:', { email, firstname });

    try {
        const apiKey = process.env.API_KEY;


        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';

        const emailData = {
            sender: {
                name: 'Codiin',
                email: 'anujith.vk@coderzon.com'
            },
            to: [
                {
                    email: email
                }
            ],
            subject: 'Welcome to Codiin',
            htmlContent: `<!DOCTYPE html>
  <html>
  <head>
      <style>
          body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 0;
              background: #ffffff;
          }
          .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              border-radius: 0;
          }
          .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
          }
          .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
          }
          .content {
              padding: 40px 30px;
              background: #ffffff;
          }
          .welcome-message {
              text-align: center;
              margin-bottom: 30px;
          }
          .welcome-message h2 {
              color: #667eea;
              font-size: 24px;
              margin: 0 0 15px 0;
          }
          .cta-button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
          }
          .cta-button:hover {
              background: #5a67d8;
          }
          .support-box {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              margin: 30px 0;
          }
          .support-box h4 {
              color: #856404;
              margin: 0 0 10px 0;
          }
          .support-box p {
              color: #856404;
              margin: 0;
          }
          .footer {
              background: #2d3748;
              color: #a0aec0;
              padding: 30px;
              text-align: center;
              font-size: 14px;
          }
          .footer a {
              color: #667eea;
              text-decoration: none;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <!-- Header -->
          <div class="header">
              <h1>Welcome to Codiin</h1>
              <p>Your Professional Learning Platform</p>
          </div>

          <!-- Main Content -->
          <div class="content">
              <div class="welcome-message">
                  <h2>Dear ${firstname},</h2>
                  <p>Thank you for joining Codiin. Your account has been successfully created and you now have access to our comprehensive learning resources.</p>
              </div>

              <div style="text-align: center;">
                  <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="cta-button">
                      Start Learning Now →
                  </a>
              </div>

              <div class="support-box">
                  <h4>Learning Resources</h4>
                  <p>Explore our comprehensive documentation and learning materials available in your dashboard to maximize your learning experience.</p>
              </div>
          </div>

          <!-- Footer -->
          <div class="footer">
              <p>© 2024 Codiin. All rights reserved.</p>
              <p>
                  <a href="#">Privacy Policy</a> •
                  <a href="#">Terms of Service</a> •
                  <a href="#">Unsubscribe</a>
              </p>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                  This email was sent to ${email}. If you didn't create an account with us, please ignore this email.
              </p>
          </div>
      </div>
  </body>
  </html>
            `
        };
         const response = await axios.post(url, emailData, {
            headers: {
                'Accept': 'application/json',
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        console.log('📧 Welcome email sent successfully:', response.data);
        return { success: true };
    } catch (error) {
        console.error('📧 Welcome email sending error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send welcome email.'
        };
    }
};


const ForgetStore=new Map()

export const StoreForgetOtp = (email: string, otp: string) => {
  ForgetStore.set(email, {
    otp: otp,
    timestamp: Date.now()
  });
};

setInterval(() => {
    const currentTime = Date.now();
    for (const [email, data] of ForgetStore.entries()) {
        const otpAge = currentTime - data.timestamp;
        const tenMinutes = 10 * 60 * 1000; 
        if (otpAge > tenMinutes) {
            ForgetStore.delete(email);
        }
    }
}, 10 * 60 * 1000); 


export const VerifyForgetOtp = (email: string, userEnteredOTP: string) => {
    // Step 1: Check if we have an OTP for this email
    const storedData = ForgetStore.get(email);

    if (!storedData) {
        return {
            valid: false,
            message: "No OTP found. Please request a new password reset."
        };
    }

    // Step 2: Check if OTP is not expired (10 minutes limit)
    const currentTime = Date.now();
    const otpAge = currentTime - storedData.timestamp;
    const tenMinutes = 10 * 60 * 1000;

    if (otpAge > tenMinutes) {
        ForgetStore.delete(email); // Remove expired OTP
        return {
            valid: false,
            message: "OTP has expired. Please request a new password reset."
        };
    }

    // Step 3: Check if the OTP matches
    if (storedData.otp === userEnteredOTP) {
        // Success! OTP is correct - don't delete yet, will delete after password reset
        return {
            valid: true,
            email: email,
            message: "OTP verified successfully! You can now reset your password."
        };
    }

    return {
        valid: false,
        message: "Invalid OTP. Please try again."
    };
};

export const ClearForgetOtp = (email: string) => {
    ForgetStore.delete(email);
};

export const ForgetPasswordMail = async function(email: string, otp: string) {
    try {
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';

        const emailData = {
            sender: {
                name: 'Codiin',
                email: 'anujith.vk@coderzon.com'
            },
            to: [
                {
                    email: email
                }
            ],
            subject: 'Password Reset - Your OTP Code',
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
                        .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <h2>Reset Your Password</h2>
                            <p>We received a request to reset the password for your account associated with this email address.</p>

                            <p>Please use the following OTP code to reset your password:</p>

                            <div class="otp-box">
                                <div class="otp-code">${otp}</div>
                            </div>

                            <p><strong>This code will expire in 10 minutes.</strong></p>

                            <div class="warning-box">
                                <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email. Your password will not be changed without this verification code.
                            </div>

                            <p>For security reasons, this code can only be used once. If you need a new code, please request another password reset.</p>

                            <div class="footer">
                                <p>© 2024 Codiin. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const response = await axios.post(url, emailData, {
            headers: {
                'Accept': 'application/json',
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('Password reset email sent successfully:', response.data);
        return { success: true };
    } catch (error: any) {
        console.error('Password reset email sending error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send password reset email.'
        };
    }
};