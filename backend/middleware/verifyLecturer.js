// backend/middleware/verifyLecturer.js
import jwt from 'jsonwebtoken';

export default function verifyLecturer(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'lecturer') {
      return res.status(403).json({ message: 'Access denied: Lecturers only.' });
    }

    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    console.error('[Lecturer Auth Error]', err);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}
