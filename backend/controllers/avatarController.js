import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const updateAvatar = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { avatarUrl } = req.body;

  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Only students can update avatars' });
  }

  if (!avatarUrl || !avatarUrl.startsWith('https://')) {
    return res.status(400).json({ error: 'Invalid avatar URL' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    res.status(200).json({
      message: 'Avatar updated successfully',
      avatarUrl: updatedUser.avatarUrl,
    });
  } catch (error) {
    console.error('[Avatar Update Error]', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
};

export const getAvatar = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Only students can fetch avatars' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (!user || !user.avatarUrl) {
      return res.status(404).json({ error: 'No avatar found' });
    }

    res.status(200).json({ avatarUrl: user.avatarUrl });
  } catch (error) {
    console.error('[Avatar Fetch Error]', error);
    res.status(500).json({ error: 'Failed to fetch avatar' });
  }
};
