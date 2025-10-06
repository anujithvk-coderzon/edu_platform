
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

// Welcome email for Students (learners)
export const StudentWelcomeEmail = async (email: string, firstname: string) => {
    console.log('📧 StudentWelcomeEmail function called with:', { email, firstname });

    try {
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';
        const studentUrl = process.env.CLIENT_URL || 'http://localhost:3000';

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
            subject: 'Welcome to Codiin - Start Your Learning Journey!',
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
          .features {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
          }
          .features h3 {
              color: #333;
              margin: 0 0 15px 0;
              font-size: 18px;
          }
          .feature-item {
              padding: 8px 0;
              color: #555;
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
              <p>Your Learning Journey Starts Here!</p>
          </div>

          <!-- Main Content -->
          <div class="content">
              <div class="welcome-message">
                  <h2>Dear ${firstname},</h2>
                  <p>Thank you for joining Codiin! Your account has been successfully created and you now have access to our comprehensive learning platform.</p>
              </div>

              <div class="features">
                  <h3>What you can do now:</h3>
                  <div class="feature-item">📚 Browse thousands of courses across various subjects</div>
                  <div class="feature-item">🎓 Enroll in courses that match your interests</div>
                  <div class="feature-item">📊 Track your learning progress and achievements</div>
                  <div class="feature-item">💬 Interact with instructors and fellow students</div>
                  <div class="feature-item">📝 Complete assignments and earn certificates</div>
              </div>

              <div style="text-align: center;">
                  <a href="${studentUrl}/courses" class="cta-button">
                      Explore Courses →
                  </a>
              </div>

              <div class="support-box">
                  <h4>💡 Getting Started Tips</h4>
                  <p>Complete your profile, browse our course catalog, and enroll in your first course to begin your learning journey. Need help? Our support team is always here to assist you!</p>
              </div>
          </div>

          <!-- Footer -->
          <div class="footer">
              <p>© 2024 Codiin. All rights reserved.</p>
              <p>
                  <a href="#">Privacy Policy</a> •
                  <a href="#">Terms of Service</a> •
                  <a href="#">Contact Support</a>
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
        console.log('📧 Student welcome email sent successfully:', response.data);
        return { success: true };
    } catch (error) {
        console.error('📧 Student welcome email sending error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send welcome email.'
        };
    }
};

// Welcome email for Admin/Tutor (staff)
export const StaffWelcomeEmail = async (email: string, firstname: string, role: string = 'Tutor') => {
    console.log('📧 StaffWelcomeEmail function called with:', { email, firstname, role });

    try {
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';

        // Customize content based on role
        const isAdmin = role === 'Admin';
        const dashboardUrl = process.env.ADMIN_URL || 'http://localhost:3001';
        const roleTitle = isAdmin ? 'Administrator' : 'Tutor';
        const welcomeMessage = isAdmin
            ? 'Your administrator account has been successfully created. You now have full access to manage the platform.'
            : 'Your tutor account has been successfully created. You can now start creating and managing courses.';

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
            subject: `Welcome to Codiin - ${roleTitle} Account Created`,
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
              background: linear-gradient(135deg, ${isAdmin ? '#DC2626 0%, #991B1B 100%' : '#10B981 0%, #059669 100%'});
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
              color: ${isAdmin ? '#DC2626' : '#10B981'};
              font-size: 24px;
              margin: 0 0 15px 0;
          }
          .cta-button {
              display: inline-block;
              background: ${isAdmin ? '#DC2626' : '#10B981'};
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
          }
          .cta-button:hover {
              background: ${isAdmin ? '#991B1B' : '#059669'};
          }
          .features {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
          }
          .features h3 {
              color: #333;
              margin: 0 0 15px 0;
              font-size: 18px;
          }
          .feature-item {
              padding: 8px 0;
              color: #555;
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
              <h1>🎉 Welcome to Codiin!</h1>
              <p>${roleTitle} Account</p>
          </div>

          <!-- Main Content -->
          <div class="content">
              <div class="welcome-message">
                  <h2>Dear ${firstname},</h2>
                  <p>${welcomeMessage}</p>
              </div>

              <div class="features">
                  <h3>Your Account Details:</h3>
                  <div class="feature-item">📧 <strong>Email:</strong> ${email}</div>
                  <div class="feature-item">👤 <strong>Role:</strong> ${roleTitle}</div>
                  <div class="feature-item">✅ <strong>Status:</strong> Active</div>
              </div>

              <div class="features">
                  <h3>What you can do now:</h3>
                  ${isAdmin ? `
                  <div class="feature-item">✅ Manage all users and tutors</div>
                  <div class="feature-item">✅ Review tutor registration requests</div>
                  <div class="feature-item">✅ Oversee all courses and content</div>
                  <div class="feature-item">✅ Access analytics and reports</div>
                  <div class="feature-item">✅ Configure platform settings</div>
                  ` : `
                  <div class="feature-item">✅ Create and publish courses</div>
                  <div class="feature-item">✅ Upload course materials (videos, PDFs, etc.)</div>
                  <div class="feature-item">✅ Manage your students</div>
                  <div class="feature-item">✅ Track student progress</div>
                  <div class="feature-item">✅ Create assignments and grade submissions</div>
                  `}
              </div>

              <div style="text-align: center;">
                  <a href="${dashboardUrl}/login" class="cta-button">
                      Login to Dashboard →
                  </a>
              </div>

              <p style="text-align: center; margin-top: 30px; color: #666;">
                  If you have any questions or need assistance, feel free to reach out to our support team.
              </p>
          </div>

          <!-- Footer -->
          <div class="footer">
              <p>© 2024 Codiin. All rights reserved.</p>
              <p>
                  <a href="#">Privacy Policy</a> •
                  <a href="#">Terms of Service</a> •
                  <a href="#">Contact Support</a>
              </p>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                  This email was sent to ${email}. If you didn't expect this email, please contact support immediately.
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

export const sendTutorPendingApprovalEmail = async (email: string, firstName: string) => {
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
            subject: 'Tutor Registration - Pending Admin Approval',
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .info-box { background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 20px; margin: 20px 0; border-radius: 4px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎓 Registration Submitted!</h1>
                        </div>
                        <div class="content">
                            <h2>Dear ${firstName},</h2>
                            <p>Thank you for registering as a tutor on Codiin! Your registration request has been successfully submitted to our admin team.</p>

                            <div class="info-box">
                                <strong>📋 What's Next?</strong>
                                <p>Our admin team will review your registration request. You will receive an email notification once your account has been approved or if any additional information is needed.</p>
                            </div>

                            <p>This process typically takes 1-2 business days. We appreciate your patience!</p>

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

        console.log('Tutor pending approval email sent successfully:', response.data);
        return { success: true };
    } catch (error) {
        console.error('Tutor pending approval email error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send email. Please try again.'
        };
    }
};

export const sendTutorRejectionEmail = async (email: string, firstName: string) => {
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
            subject: 'Tutor Registration - Application Update',
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .info-box { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 4px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Registration Update</h1>
                        </div>
                        <div class="content">
                            <h2>Dear ${firstName},</h2>
                            <p>Thank you for your interest in becoming a tutor on Codiin.</p>

                            <div class="info-box">
                                <p>After careful review, we regret to inform you that we are unable to approve your tutor registration at this time.</p>
                            </div>

                            <p>If you have any questions or would like to discuss this decision, please feel free to contact our support team.</p>

                            <p>We appreciate your interest in Codiin and wish you all the best in your future endeavors.</p>

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

        console.log('Tutor rejection email sent successfully:', response.data);
        return { success: true };
    } catch (error) {
        console.error('Tutor rejection email error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send email. Please try again.'
        };
    }
};

export const sendCourseRejectionEmail = async (email: string, tutorName: string, courseTitle: string, reason: string) => {
    try {
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';
        const dashboardUrl = process.env.ADMIN_URL || 'http://localhost:3001';

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
            subject: `Course Rejected - ${courseTitle}`,
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .course-box { background: white; border: 2px solid #DC2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
                        .course-title { font-size: 20px; font-weight: bold; color: #DC2626; margin-bottom: 10px; }
                        .reason-box { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
                        .btn { display: inline-block; background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📋 Course Review Update</h1>
                        </div>
                        <div class="content">
                            <h2>Dear ${tutorName},</h2>
                            <p>Thank you for submitting your course for review. After careful evaluation, we regret to inform you that your course has not been approved for publication at this time.</p>

                            <div class="course-box">
                                <div class="course-title">${courseTitle}</div>
                                <div style="color: #DC2626; font-weight: bold;">Status: Rejected</div>
                            </div>

                            <div class="reason-box">
                                <strong>📝 Reason for Rejection:</strong>
                                <p style="margin: 10px 0 0 0;">${reason}</p>
                            </div>

                            <p><strong>What's Next?</strong></p>
                            <p>You can edit your course to address the feedback provided and resubmit it for review. The course is now back in your drafts where you can make the necessary changes.</p>

                            <div style="text-align: center;">
                                <a href="${dashboardUrl}/my-courses" class="btn">View My Courses</a>
                            </div>

                            <p>If you have any questions about this decision or need clarification on the feedback, please don't hesitate to contact our support team.</p>

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

        console.log('Course rejection email sent successfully:', response.data);
        return { success: true };
    } catch (error: any) {
        console.error('Course rejection email error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send email. Please try again.'
        };
    }
};

export const sendCoursePublishedEmail = async (email: string, tutorName: string, courseTitle: string) => {
    try {
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            console.error('API_KEY not found in environment variables');
            return { success: false, error: 'Email service not configured' };
        }

        const url = 'https://api.brevo.com/v3/smtp/email';
        const dashboardUrl = process.env.ADMIN_URL || 'http://localhost:3001';
        const studentUrl = process.env.CLIENT_URL || 'http://localhost:3000';

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
            subject: `Course Published - ${courseTitle}`,
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .course-box { background: white; border: 2px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0; }
                        .course-title { font-size: 20px; font-weight: bold; color: #10B981; margin-bottom: 10px; }
                        .success-box { background: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px; }
                        .btn { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px; }
                        .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .feature-item { padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Congratulations!</h1>
                        </div>
                        <div class="content">
                            <h2>Dear ${tutorName},</h2>
                            <p>Great news! Your course has been approved and is now published on Codiin!</p>

                            <div class="course-box">
                                <div class="course-title">${courseTitle}</div>
                                <div style="color: #10B981; font-weight: bold;">✅ Status: Published</div>
                            </div>

                            <div class="success-box">
                                <strong>🎓 Your course is now live!</strong>
                                <p style="margin: 10px 0 0 0;">Students can now discover, enroll in, and start learning from your course. Your content is now reaching learners worldwide!</p>
                            </div>

                            <div class="features">
                                <h3>What you can do now:</h3>
                                <div class="feature-item">✅ Monitor student enrollments and progress</div>
                                <div class="feature-item">✅ Update course materials as needed</div>
                                <div class="feature-item">✅ Respond to student questions and reviews</div>
                                <div class="feature-item">✅ Track course analytics and performance</div>
                            </div>

                            <div style="text-align: center;">
                                <a href="${dashboardUrl}/my-courses" class="btn">View in Dashboard</a>
                                <a href="${studentUrl}/courses" class="btn" style="background: #667eea;">View on Platform</a>
                            </div>

                            <p style="text-align: center; margin-top: 20px;">Thank you for contributing to our learning community!</p>

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

        console.log('Course published email sent successfully:', response.data);
        return { success: true };
    } catch (error: any) {
        console.error('Course published email error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send email. Please try again.'
        };
    }
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