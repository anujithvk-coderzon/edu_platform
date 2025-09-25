
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
    console.log(`🔍 Verifying OTP for ${email}`);
    console.log(`🔍 User entered: "${userEnteredOTP}" (length: ${userEnteredOTP?.length})`);

    // Step 1: Check if we have an OTP for this email
    const storedData = otpStorage.get(email);

    if (!storedData) {
        console.log(`❌ No OTP found for ${email}`);
        console.log(`📋 Current OTP storage:`, Array.from(otpStorage.keys()));
        return {
            valid: false,
            message: "No OTP found. Please request a new one."
        };
    }

    console.log(`✅ Found stored data for ${email}`);
    console.log(`🔍 Stored OTP: "${storedData.otp}" (length: ${storedData.otp?.length})`);
    console.log(`🕐 OTP created at: ${new Date(storedData.timestamp).toISOString()}`);

    // Step 2: Check if OTP is not expired (10 minutes limit)
    const currentTime = Date.now();
    const otpAge = currentTime - storedData.timestamp;
    const tenMinutes = 10 * 60 * 1000;

    if (otpAge > tenMinutes) {
        otpStorage.delete(email); // Remove expired OTP
        console.log(`OTP expired for ${email}`);
        return {
            valid: false,
            message: "OTP has expired. Please request a new one."
        };
    }

    // Step 3: Check if the OTP matches
    console.log(`🔍 Comparing OTPs:`);
    console.log(`   Stored: "${storedData.otp}" (type: ${typeof storedData.otp})`);
    console.log(`   Entered: "${userEnteredOTP}" (type: ${typeof userEnteredOTP})`);
    console.log(`   Equal? ${storedData.otp === userEnteredOTP}`);
    console.log(`   Loose Equal? ${storedData.otp == userEnteredOTP}`);

    if (storedData.otp === userEnteredOTP) {
        // Success! OTP is correct
        const userData = storedData.userData; // Get the user's registration data
        otpStorage.delete(email); // Remove used OTP

        console.log(`✅ OTP verified successfully for ${email}`);
        return {
            valid: true,
            userData: userData,
            message: "OTP verified successfully!"
        };
    }

    console.log(`❌ Invalid OTP attempt for ${email}`);
    return {
        valid: false,
        message: "Invalid OTP. Please try again."
    };
};

// Send email with OTP
export const sendVerificationEmail = async (email, otp) => {
    try {
        const apiKey = process.env.API_KEY;

        console.log('API Key check:', {
            hasApiKey: !!apiKey,
            keyLength: apiKey?.length,
            keyPrefix: apiKey?.substring(0, 10) + '...'
        });

        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';

        const emailData = {
            sender: {
                name: 'Edu Platform',
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
                            <h2>Welcome to Coderzon!</h2>
                            <p>Thank you for registering with us. Please use the following OTP code to verify your email address:</p>

                            <div class="otp-box">
                                <div class="otp-code">${otp}</div>
                            </div>

                            <p><strong>This code will expire in 10 minutes.</strong></p>
                            <p>If you didn't request this verification, please ignore this email.</p>

                            <div class="footer">
                                <p>© 2024 Coderzon. All rights reserved.</p>
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





export const WelcomeEmail = async (email, firstname) => {
    console.log('📧 WelcomeEmail function called with:', { email, firstname });

    try {
        const apiKey = process.env.API_KEY;

        console.log('📧 API Key status:', {
            hasApiKey: !!apiKey,
            keyLength: apiKey?.length
        });
        console.log('📧 Preparing to send welcome email to:', email, 'Name:', firstname);

        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';

        const emailData = {
            sender: {
                name: 'Edu Platform',
                email: 'anujith.vk@coderzon.com'
            },
            to: [
                {
                    email: email
                }
            ],
            subject: 'Welcome to Edu Platform',
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
          .getting-started {
              background: #f8f9fa;
              border-radius: 10px;
              padding: 25px;
              margin: 30px 0;
          }
          .getting-started h3 {
              color: #333;
              margin: 0 0 20px 0;
              font-size: 18px;
          }
          .step-list {
              list-style: none;
              padding: 0;
              margin: 0;
          }
          .step-list li {
              padding: 10px 0;
              border-bottom: 1px solid #e9ecef;
              display: flex;
              align-items: center;
          }
          .step-list li:last-child {
              border-bottom: none;
          }
          .step-number {
              background: #667eea;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 12px;
              margin-right: 15px;
              flex-shrink: 0;
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
          .stats-box {
              background: #e8f4f8;
              border-radius: 10px;
              padding: 25px;
              text-align: center;
              margin: 30px 0;
          }
          .stats-box h4 {
              color: #2d3748;
              margin: 0 0 15px 0;
              font-size: 18px;
          }
          .stats {
              display: flex;
              justify-content: space-around;
              text-align: center;
          }
          .stat {
              flex: 1;
          }
          .stat-number {
              font-size: 24px;
              font-weight: bold;
              color: #667eea;
              margin: 0;
          }
          .stat-label {
              font-size: 14px;
              color: #666;
              margin: 5px 0 0 0;
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
              <h1>Welcome to Edu Platform</h1>
              <p>Your Professional Learning Platform</p>
          </div>

          <!-- Main Content -->
          <div class="content">
              <div class="welcome-message">
                  <h2>Dear ${firstname},</h2>
                  <p>Thank you for joining Edu Platform. Your account has been successfully created and you now have access to our comprehensive learning resources.</p>
              </div>

              <div class="getting-started">
                  <h3>Getting Started Guide</h3>
                  <ul class="step-list">
                      <li>
                          <span class="step-number">1</span>
                          <span>Complete your profile to personalize your experience</span>
                      </li>
                      <li>
                          <span class="step-number">2</span>
                          <span>Browse our course catalog and find topics you love</span>
                      </li>
                      <li>
                          <span class="step-number">3</span>
                          <span>Enroll in your first course and start learning</span>
                      </li>
                      <li>
                          <span class="step-number">4</span>
                          <span>Join our community and connect with other learners</span>
                      </li>
                  </ul>
              </div>

              <div style="text-align: center;">
                  <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="cta-button">
                      Start Learning Now →
                  </a>
              </div>

              <div class="stats-box">
                  <h4>Join thousands of learners worldwide</h4>
                  <div class="stats">
                      <div class="stat">
                          <p class="stat-number">50+</p>
                          <p class="stat-label">Courses</p>
                      </div>
                      <div class="stat">
                          <p class="stat-number">10K+</p>
                          <p class="stat-label">Students</p>
                      </div>
                      <div class="stat">
                          <p class="stat-number">95%</p>
                          <p class="stat-label">Satisfaction</p>
                      </div>
                  </div>
              </div>

              <div class="support-box">
                  <h4>Learning Resources</h4>
                  <p>Explore our comprehensive documentation and learning materials available in your dashboard to maximize your learning experience.</p>
              </div>
          </div>

          <!-- Footer -->
          <div class="footer">
              <p>© 2024 Edu Platform. All rights reserved.</p>
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
    console.log(`🔍 Verifying forgot password OTP for ${email}`);
    console.log(`🔍 User entered: "${userEnteredOTP}" (length: ${userEnteredOTP?.length})`);

    // Step 1: Check if we have an OTP for this email
    const storedData = ForgetStore.get(email);

    if (!storedData) {
        console.log(`❌ No forgot password OTP found for ${email}`);
        return {
            valid: false,
            message: "No OTP found. Please request a new password reset."
        };
    }

    console.log(`✅ Found stored forget OTP data for ${email}`);
    console.log(`🔍 Stored OTP: "${storedData.otp}" (length: ${storedData.otp?.length})`);

    // Step 2: Check if OTP is not expired (10 minutes limit)
    const currentTime = Date.now();
    const otpAge = currentTime - storedData.timestamp;
    const tenMinutes = 10 * 60 * 1000;

    if (otpAge > tenMinutes) {
        ForgetStore.delete(email); // Remove expired OTP
        console.log(`OTP expired for ${email}`);
        return {
            valid: false,
            message: "OTP has expired. Please request a new password reset."
        };
    }

    // Step 3: Check if the OTP matches
    if (storedData.otp === userEnteredOTP) {
        // Success! OTP is correct - don't delete yet, will delete after password reset
        console.log(`✅ Forgot password OTP verified successfully for ${email}`);
        return {
            valid: true,
            email: email,
            message: "OTP verified successfully! You can now reset your password."
        };
    }

    console.log(`❌ Invalid forgot password OTP attempt for ${email}`);
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
                name: 'Edu Platform',
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
                                <p>© 2024 Edu Platform. All rights reserved.</p>
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