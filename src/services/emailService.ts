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
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>გამარჯობა ${userName}!</h2>
            <p>გმადლობთ HomevEnd-ზე რეგისტრაციისთვის!</p>
            <p>თქვენი ანგარიშის გასააქტიურებლად, გთხოვთ დაადასტუროთ თქვენი ელ.ფოსტის მისამართი:</p>
            <center>
              <a href="${verificationUrl}" class="button">ელ.ფოსტის დადასტურება</a>
            </center>
            <p>ან დააკოპირეთ და ჩასვით ეს ბმული თქვენს ბრაუზერში:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 3px;">
              ${verificationUrl}
            </p>
            <p>ეს ბმული აქტიურია 24 საათის განმავლობაში.</p>
            <p>თუ თქვენ არ დარეგისტრირებულხართ HomevEnd-ზე, გთხოვთ უგულებელყოთ ეს შეტყობინება.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${this.APP_NAME}. ყველა უფლება დაცულია.</p>
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
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>პაროლის აღდგენა</h2>
            <p>გამარჯობა ${userName},</p>
            <p>მივიღეთ თქვენი მოთხოვნა პაროლის აღდგენაზე.</p>
            <p>ახალი პაროლის დასაყენებლად დააჭირეთ ქვემოთ მოცემულ ღილაკს:</p>
            <center>
              <a href="${resetUrl}" class="button">პაროლის აღდგენა</a>
            </center>
            <p>ან დააკოპირეთ და ჩასვით ეს ბმული თქვენს ბრაუზერში:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 3px;">
              ${resetUrl}
            </p>
            <div class="warning">
              <strong>ყურადღება:</strong> ეს ბმული აქტიურია მხოლოდ 1 საათის განმავლობაში უსაფრთხოების მიზნებისთვის.
            </div>
            <p>თუ თქვენ არ მოითხოვეთ პაროლის აღდგენა, შეგიძლიათ უგულებელყოთ ეს შეტყობინება. თქვენი პაროლი არ შეიცვლება.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${this.APP_NAME}. ყველა უფლება დაცულია.</p>
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

  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>კეთილი იყოს თქვენი მობრძანება ${this.APP_NAME}-ზე!</h1>
          </div>
          <div class="content">
            <h2>გამარჯობა ${userName}!</h2>
            <p>თქვენი ანგარიში წარმატებით გააქტიურდა!</p>
            <p>ახლა შეგიძლიათ სრულად გამოიყენოთ ჩვენი პლატფორმის ყველა ფუნქცია:</p>
            <ul>
              <li>განცხადებების დამატება და მართვა</li>
              <li>ფავორიტების შენახვა</li>
              <li>პროფილის პერსონალიზაცია</li>
              <li>VIP სერვისების გამოყენება</li>
            </ul>
            <center>
              <a href="${this.CLIENT_URL}/dashboard" class="button">ჩემი ანგარიში</a>
            </center>
            <p>კითხვების შემთხვევაში, მოგვწერეთ: support@homevend.ge</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${this.APP_NAME}. ყველა უფლება დაცულია.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `კეთილი იყოს თქვენი მობრძანება ${this.APP_NAME}-ზე!`,
      html,
      text: `გამარჯობა ${userName}! თქვენი ანგარიში წარმატებით გააქტიურდა. ეწვიეთ ${this.CLIENT_URL}/dashboard`,
    });
  }
}

export default new EmailService();