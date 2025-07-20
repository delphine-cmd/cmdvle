import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your GIMPA VLE Account',
    html: `
      <p>Hello,</p>
      <p>You’ve been added to the GIMPA VLE app. Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify your email</a>
      <p>This link is valid for 24 hours.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.response);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
