import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail } from '../utils/resetEmail.js';

const prisma = new PrismaClient();

export async function requestPasswordReset(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: 'A password reset link has been sent to this email adress.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
        email,
      },
    });

    await sendPasswordResetEmail(email, token);

    return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('[Request Password Reset Error]', err);
    return res.status(500).json({ message: 'Server error during password reset request.' });
  }
}

export async function verifyPasswordReset(req, res) {
  const { token } = req.params;
  if (!token) return res.status(400).json({ message: 'Missing token.' });

  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Token is invalid or expired.' });
    }

    return res.status(200).json({ message: 'Token is valid.' });
  } catch (err) {
    console.error('[Verify Password Reset Error]', err);
    return res.status(500).json({ message: 'Server error during token verification.' });
  }
}

export async function resetPassword(req, res) {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Token and new passwords are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Token is invalid or expired.' });
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from the old one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('[Reset Password Error]', err);
    return res.status(500).json({ message: 'Server error during password reset.' });
  }
}
