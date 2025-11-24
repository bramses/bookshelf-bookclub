'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BookGrid from '@/components/BookGrid';
import BookDetail from '@/components/BookDetail';
import { userBooks, Book } from '@/lib/data';

interface ClientHomeProps {
  initialBookSlug?: string;
  books: Book[];
}

export default function ClientHome({ initialBookSlug, books }: ClientHomeProps) {
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    if (initialBookSlug) {
      const book = books.find((b) => b.slug === initialBookSlug);
      if (book) {
        setSelectedBook(book);
      }
    }
  }, [initialBookSlug]);

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    // Update URL without full reload
    window.history.pushState(null, '', `/${book.slug}`);
  };

  const handleCloseDetail = () => {
    setSelectedBook(null);
    // Revert URL
    window.history.pushState(null, '', '/');
  };

  const getRelatedUserBook = (bookId: string) => {
    return userBooks.find((ub) => ub.bookId === bookId);
  };

  return (
    <main className="main-container">
      <header className="app-header">
        <h1 className="app-title">My Bookshelf</h1>
        <p className="app-subtitle">A 3D exploration of my reading journey</p>
      </header>

      <BookGrid books={books} onSelectBook={handleSelectBook} />

      {selectedBook && (
        <BookDetail 
          book={selectedBook} 
          userBook={getRelatedUserBook(selectedBook.id)} 
          onClose={handleCloseDetail} 
        />
      )}
    </main>
  );
}
