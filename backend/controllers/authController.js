import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../utils/email.js';

const prisma = new PrismaClient();

export async function addUser(req, res) {
const { name, email, password, role, studentId } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required.' });
  }

  // Email validation patterns
  const studentEmailRegex = /^[a-zA-Z0-9._%+-]+@st\.gimpa\.edu\.gh$/i;
  const lecturerEmailRegex = /^[a-zA-Z0-9._%+-]+@gimpa\.edu\.gh$/i;
  const adminGmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

  if (role === 'student' && !studentEmailRegex.test(email)) {
    return res.status(400).json({ message: 'Student email must end with @st.gimpa.edu.gh' });
  }

  if (role === 'lecturer' && !lecturerEmailRegex.test(email)) {
    return res.status(400).json({ message: 'Lecturer email must end with @gimpa.edu.gh' });
  }

  if (role === 'admin' && !(lecturerEmailRegex.test(email) || adminGmailRegex.test(email))) {
    return res.status(400).json({ message: 'Admin email must be either a lecturer email or a Gmail address.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
    data: {
    name,
    email,
    password: hashedPassword,
    role,
    ...(role === 'student' && studentId ? { studentId } : {})
  },
});



    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        token,
        userId: newUser.id,
        expiresAt,
        email,
      },
    });

    await sendVerificationEmail(email, token);

    return res.status(201).json({ message: 'User created successfully. Verification email sent.' });
  } catch (err) {
    console.error('[Add User Error]', err);
    return res.status(500).json({ message: 'Error creating user' });
  }
}

export async function verifyEmail(req, res) {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: 'Missing token.' });
  }

  try {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Token is invalid or expired.' });
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: { isVerified: true },
    });

    await prisma.verificationToken.delete({
      where: { token },
    });

    // ✅ Redirect to frontend login after verification
    return res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (err) {
    console.error('[Verify Email Error]', err);
    return res.status(500).json({ message: 'Verification failed.' });
  }
}

export async function loginUser(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('[DEBUG] loginUser - email:', email);


    console.log('[DEBUG] loginUser - user fetched from DB:', user);
    console.log('[DEBUG] loginUser - password from request:', password);
    console.log('[DEBUG] loginUser - hashed password from DB:', user?.password);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
}

export async function setPassword(req, res) {
  return res.status(501).json({ message: 'Not implemented yet.' });
}

export async function getUserFromToken(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send the user object with name included
    res.status(200).json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name  // <--- This is the important addition
      } 
    });
  } catch (err) {
    console.error('[Token Verification Error]', err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
