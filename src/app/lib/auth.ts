import { hash } from 'bcryptjs';
import { prisma } from './prisma';

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: 'ADMIN' | 'STAFF' = 'STAFF'
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    return { user };
  } catch (error) {
    throw error;
  }
}
