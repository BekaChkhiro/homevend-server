import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

class EmailService {
  private transporter: Transporter | null = null;
  private readonly APP_NAME = 'Homevend';
  private readonly FROM_EMAIL: string;
  private readonly FROM_NAME: string;
  private readonly CLIENT_URL: string;
  private initPromise: Promise<void>;

  constructor() {
    this.FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@homevend.ge';
    this.FROM_NAME = process.env.EMAIL_FROM_NAME || 'HomevEnd';
    this.CLIENT_URL = process.env.CLIENT_URL || 'https://homevend.ge';

    // Initialize transporter asynchronously
    this.initPromise = this.initializeTransporter();
  }

  private async initializeTransporter() {
    // Configure transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production email configuration
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        // host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        // port: parseInt(process.env.EMAIL_PORT || '587'),
        // secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else {
      // Development: Use Ethereal Email for testing
      await this.createTestTransporter();
    }
  }

  private async createTestTransporter() {
    try {
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('📧 Test email account created:', testAccount.user);
      console.log('📧 View emails at: https://ethereal.email/messages');
    } catch (error) {
      console.error('Failed to create test email transporter:', error);
      // Fallback: create a dummy transporter to prevent errors
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 587,
        secure: false,
        ignoreTLS: true,
        auth: {
          user: 'test',
          pass: 'test'
        }
      });
    }
  }

  async sendEmail(options: Mail.Options): Promise<void> {
    try {
      // Wait for transporter to be initialized
      await this.initPromise;
      
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions: Mail.Options = {
        from: `"${this.FROM_NAME}" <${this.FROM_EMAIL}>`,
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Message sent: %s', info.messageId);
        console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(email: string, token: string, userName: string): Promise<void> {
    const verificationUrl = `${this.CLIENT_URL}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            background-color: #f8fafc;
          }
          .email-wrapper { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background-color: #1f2937; 
            color: white; 
            padding: 32px 24px; 
            text-align: center; 
            border-radius: 8px 8px 0 0;
          }
          .logo { 
            display: inline-flex; 
            align-items: center; 
            gap: 8px; 
            margin-bottom: 8px;
          }
          .logo-icon { 
            background-color: white; 
            border-radius: 6px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            padding: 6px;
            font-size: 20px;
          }
          .brand-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: white;
          }
          .content { 
            padding: 40px 32px; 
            background-color: white;
          }
          .welcome-text { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 16px;
          }
          .description { 
            font-size: 16px; 
            color: #6b7280; 
            margin-bottom: 32px;
          }
          .cta-button { 
            display: inline-block; 
            background-color: #1f2937; 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px;
            margin: 24px 0;
            transition: background-color 0.2s;
          }
          .cta-button:hover { 
            background-color: #374151; 
          }
          .alternative-link { 
            background-color: #f9fafb; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 16px; 
            margin: 24px 0; 
            word-break: break-all; 
            font-family: monospace; 
            font-size: 14px;
            color: #1f2937;
          }
          .info-box { 
            background-color: #fef3c7; 
            border-left: 4px solid #f59e0b; 
            padding: 16px; 
            margin: 24px 0; 
            border-radius: 4px;
          }
          .footer { 
            background-color: #f9fafb; 
            text-align: center; 
            padding: 32px; 
            border-top: 1px solid #e5e7eb;
            color: #6b7280; 
            font-size: 14px;
          }
          .footer-links { 
            margin-top: 16px;
          }
          .footer-link { 
            color: #1f2937; 
            text-decoration: none; 
            margin: 0 12px;
          }
          .footer-link:hover { 
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <span class="brand-name">HOMEVEND.ge</span>
            </div>
          </div>
          
          <div class="content">
            <h1 class="welcome-text">გამარჯობა ${userName}!</h1>
            <p class="description">გმადლობთ HOMEVEND.ge-ზე რეგისტრაციისთვის! თქვენი ანგარიშის გასააქტიურებლად, გთხოვთ დაადასტუროთ თქვენი ელ.ფოსტის მისამართი.</p>
            
            <center>
              <a href="${verificationUrl}" class="cta-button" style="color: white !important;">ელ.ფოსტის დადასტურება</a>
            </center>
            
            <p style="margin-top: 24px; color: #6b7280;">ან დააკოპირეთ და ჩასვით ეს ბმული თქვენს ბრაუზერში:</p>
            <div class="alternative-link">${verificationUrl}</div>
            
            <div class="info-box">
              <strong>ყურადღება:</strong> ეს ბმული აქტიურია 24 საათის განმავლობაში უსაფრთხოების მიზნებისთვის.
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              თუ თქვენ არ დარეგისტრირებულხართ HOMEVEND.ge-ზე, შეგიძლიათ უგულებელყოთ ეს შეტყობინება.
            </p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} HOMEVEND.ge - საქართველოს #1 უძრავი ქონების პლატფორმა</p>
            <div class="footer-links">
              <a href="${this.CLIENT_URL}" class="footer-link">მთავარი</a>
              <a href="${this.CLIENT_URL}/about" class="footer-link">ჩვენ შესახებ</a>
              <a href="${this.CLIENT_URL}/contact" class="footer-link">კონტაქტი</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `${this.APP_NAME} - ელ.ფოსტის დადასტურება`,
      html,
      text: `გამარჯობა ${userName}! გთხოვთ დაადასტუროთ თქვენი ელ.ფოსტა შემდეგ ბმულზე გადასვლით: ${verificationUrl}`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, userName: string): Promise<void> {
    console.log('📧 sendPasswordResetEmail called with:', { email, token: token.substring(0, 10) + '...', userName });
    const resetUrl = `${this.CLIENT_URL}/reset-password/${token}`;
    console.log('🔗 Reset URL:', resetUrl);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            background-color: #f8fafc;
          }
          .email-wrapper { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background-color: #1f2937; 
            color: white; 
            padding: 32px 24px; 
            text-align: center; 
            border-radius: 8px 8px 0 0;
          }
          .logo { 
            display: inline-flex; 
            align-items: center; 
            gap: 8px; 
            margin-bottom: 8px;
          }
          .logo-icon { 
            background-color: white; 
            border-radius: 6px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            padding: 6px;
            font-size: 20px;
          }
          .brand-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: white;
          }
          .content { 
            padding: 40px 32px; 
            background-color: white;
          }
          .title-text { 
            font-size: 28px; 
            font-weight: bold; 
            font-color:rgb(255, 255, 255);
            text-decoration: none;
            margin-bottom: 16px;
          }
          .description { 
            font-size: 16px; 
            color: #6b7280; 
            margin-bottom: 32px;
          }
          .cta-button { 
            display: inline-block; 
            background-color: #1f2937; 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px;
            margin: 24px 0;
            transition: background-color 0.2s;
          }
          .cta-button:hover { 
            background-color:rgb(41, 49, 61); 
          }
          .alternative-link { 
            background-color: #f9fafb; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 16px; 
            margin: 24px 0; 
            word-break: break-all; 
            font-family: monospace; 
            font-size: 14px;
            color: #1f2937;
          }
          .warning-box { 
            background-color: #fef3c7; 
            border-left: 4px solid #f59e0b; 
            padding: 16px; 
            margin: 24px 0; 
            border-radius: 4px;
          }
          .security-info { 
            background-color: #fef2f2; 
            border-left: 4px solid #ef4444; 
            padding: 16px; 
            margin: 24px 0; 
            border-radius: 4px;
          }
          .footer { 
            background-color: #f9fafb; 
            text-align: center; 
            padding: 32px; 
            border-top: 1px solid #e5e7eb;
            color: #6b7280; 
            font-size: 14px;
          }
          .footer-links { 
            margin-top: 16px;
          }
          .footer-link { 
            color: #1f2937; 
            text-decoration: none; 
            margin: 0 12px;
          }
          .footer-link:hover { 
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">🏠</div>
              <span class="brand-name">HOMEVEND.ge</span>
            </div>
          </div>
          
          <div class="content">
            <h1 class="title-text">🔐 პაროლის აღდგენა</h1>
            <p class="description">გამარჯობა ${userName}, მივიღეთ თქვენი მოთხოვნა პაროლის აღდგენაზე.</p>
            
            <p style="margin-bottom: 24px; color: #374151;">ახალი პაროლის დასაყენებლად დააჭირეთ ქვემოთ მოცემულ ღილაკს:</p>
            
            <center>
              <a href="${resetUrl}" class="cta-button" style="color: white !important;">პაროლის აღდგენა</a>
            </center>
            
            <p style="margin-top: 24px; color: #6b7280;">ან დააკოპირეთ და ჩასვით ეს ბმული თქვენს ბრაუზერში:</p>
            <div class="alternative-link">${resetUrl}</div>
            
            <div class="warning-box">
              <strong>⏰ ყურადღება:</strong> ეს ბმული აქტიურია მხოლოდ 1 საათის განმავლობაში უსაფრთხოების მიზნებისთვის.
            </div>
            
            <div class="security-info">
              <strong>🔒 უსაფრთხოება:</strong> თუ თქვენ არ მოითხოვეთ პაროლის აღდგენა, შეგიძლიათ უგულებელყოთ ეს შეტყობინება. თქვენი პაროლი არ შეიცვლება.
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} HOMEVEND.ge - საქართველოს #1 უძრავი ქონების პლატფორმა</p>
            <div class="footer-links">
              <a href="${this.CLIENT_URL}" class="footer-link">მთავარი</a>
              <a href="${this.CLIENT_URL}/about" class="footer-link">ჩვენ შესახებ</a>
              <a href="${this.CLIENT_URL}/contact" class="footer-link">კონტაქტი</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('📧 About to call sendEmail...');
    await this.sendEmail({
      to: email,
      subject: `${this.APP_NAME} - პაროლის აღდგენა`,
      html,
      text: `გამარჯობა ${userName}! პაროლის აღდგენისთვის გადადით შემდეგ ბმულზე: ${resetUrl}. ეს ბმული აქტიურია 1 საათის განმავლობაში.`,
    });
    console.log('📧 sendEmail completed');
  }

}

export default new EmailService();