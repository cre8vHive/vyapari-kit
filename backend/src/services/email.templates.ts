const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 16px; margin-bottom: 16px; }
    .footer { margin-top: 32px; font-size: 14px; color: #6b7280; text-align: center; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #111827; color: #f9fafb; }
      .card { background-color: #1f2937; }
      .footer { color: #9ca3af; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Vyapari Kit. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

export const welcomeTemplate = (name: string) => baseTemplate(`
  <h2 style="margin-top: 0;">Welcome, ${name}!</h2>
  <p>We're thrilled to have you on board. Vyapari Kit is designed to help you succeed.</p>
  <p>If you have any questions, feel free to reply to this email.</p>
`);

export const verificationTemplate = (name: string, link: string) => baseTemplate(`
  <h2 style="margin-top: 0;">Verify your email address</h2>
  <p>Hi ${name},</p>
  <p>Please click the button below to verify your email address and secure your account.</p>
  <a href="${link}" class="btn">Verify Email</a>
  <p>Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #4f46e5;">${link}</p>
  <p>This link will expire in 24 hours.</p>
`);

export const passwordResetTemplate = (name: string, link: string) => baseTemplate(`
  <h2 style="margin-top: 0;">Reset your password</h2>
  <p>Hi ${name},</p>
  <p>We received a request to reset your password. Click the button below to choose a new one:</p>
  <a href="${link}" class="btn">Reset Password</a>
  <p>Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #4f46e5;">${link}</p>
  <p>If you didn't request this, you can safely ignore this email.</p>
`);
