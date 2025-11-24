import { prisma } from './db';
import { ReadingStatus } from '@prisma/client';

export type { ReadingStatus };

export interface Book {
  id: string;
  title: string;
  author: string | null;
  imageUrl: string | null;
  isbn: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields for 3D look
  color: string;
  slug: string;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  book: Book;
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
  });

  return dbBooks.map((book) => ({
    ...book,
    color: stringToColor(book.title),
    slug: generateSlug(book.title, book.author),
  }));
}

export async function getUserBooks(): Promise<UserBook[]> {
    // For now, fetch all user books. In a real app, filtering by user ID would happen here.
    const dbUserBooks = await prisma.userBook.findMany({
        include: { book: true }
    });
    
    return dbUserBooks.map(ub => ({
        ...ub,
        book: {
            ...ub.book,
            color: stringToColor(ub.book.title),
            slug: generateSlug(ub.book.title, ub.book.author)
        }
    }));
}

// Keep mock data for fallback or initial render if DB is empty (optional, but good for dev)
export const books: Book[] = []; 
export const userBooks: UserBook[] = [];
