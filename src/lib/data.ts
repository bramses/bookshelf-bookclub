import { prisma } from './db';
import { ReadingStatus } from '@prisma/client';
import { unstable_noStore as noStore } from 'next/cache';

export type { ReadingStatus };

export interface User {
  id: string;
  discordId: string;
  username: string;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  imageUrl: string | null;
  isbn: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  // Additional fields for 3D look
  color: string;
  slug: string;
  userBooks?: UserBook[];
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  book: Book;
  user: User;
}

// Helper to generate slug from title and author
function generateSlug(title: string, author: string | null): string {
  const base = `${title}-${author || ''}`.toLowerCase();
  return base.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Helper to generate consistent color from string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

export async function getBooks(): Promise<Book[]> {
  const dbBooks = await prisma.book.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
        userBooks: {
            include: {
                user: true
            }
        }
    }
  });

  return dbBooks.map((book) => ({
    ...book,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
    color: stringToColor(book.title),
    slug: generateSlug(book.title, book.author),
    userBooks: book.userBooks.map(ub => ({
        id: ub.id,
        userId: ub.userId,
        bookId: ub.bookId,
        status: ub.status,
        startDate: ub.startDate?.toISOString() ?? null,
        endDate: ub.endDate?.toISOString() ?? null,
        createdAt: ub.createdAt.toISOString(),
        updatedAt: ub.updatedAt.toISOString(),
        book: book as any, // Circular reference workaround
        user: {
            id: ub.user.id,
            discordId: (ub.user as any).discordId || (ub.user as any).id,
            username: (ub.user as any).username || (ub.user as any).name || 'Unknown'
        }
    }))
  }));
}

export async function getUserBooks(): Promise<UserBook[]> {
    // For now, fetch all user books. In a real app, filtering by user ID would happen here.
    const dbUserBooks = await prisma.userBook.findMany({
        include: { 
            book: true,
            user: true
        }
    });
    
    return dbUserBooks.map(ub => ({
        id: ub.id,
        userId: ub.userId,
        bookId: ub.bookId,
        status: ub.status,
        startDate: ub.startDate?.toISOString() ?? null,
        endDate: ub.endDate?.toISOString() ?? null,
        createdAt: ub.createdAt.toISOString(),
        updatedAt: ub.updatedAt.toISOString(),
        book: {
            ...ub.book,
            createdAt: ub.book.createdAt.toISOString(),
            updatedAt: ub.book.updatedAt.toISOString(),
            color: stringToColor(ub.book.title),
            slug: generateSlug(ub.book.title, ub.book.author)
        },
        user: {
            id: ub.user.id,
            discordId: (ub.user as any).discordId || (ub.user as any).id,
            username: (ub.user as any).username || (ub.user as any).name || 'Unknown'
        }
    }));
}

// Keep mock data for fallback or initial render if DB is empty (optional, but good for dev)
export const books: Book[] = []; 
export const userBooks: UserBook[] = [];
