'use client';

import React from 'react';
import { Book } from '@/lib/data';

interface BookGridProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

export default function BookGrid({ books, onSelectBook }: BookGridProps) {
  return (
    <div className="book-grid">
      {books.map((book) => (
        <div
          key={book.id}
          onClick={() => onSelectBook(book)}
          className="book-item"
        >
          <div className="book-cover"
               style={{ 
                 backgroundColor: book.color,
                 backgroundImage: book.imageUrl ? `url(${book.imageUrl})` : 'none',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
            {/* Spine effect */}
            <div className="book-spine" />
            
            {!book.imageUrl && (
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">{book.author}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
