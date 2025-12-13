'use client';

import React from 'react';
import { Book } from '@/lib/data';

interface BookGridProps {
  books: Book[];
  groups?: { title: string; books: Book[] }[] | null;
  onSelectBook: (book: Book) => void;
}

export default function BookGrid({ books, groups, onSelectBook }: BookGridProps) {
  if (groups) {
    return (
      <div className="book-grid-grouped">
        {groups.map((group) => (
          <div key={group.title} className="book-group">
            <h2 className="group-title" style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem',
              marginTop: '3rem',
              paddingLeft: '1rem'
            }}>
              {group.title}
            </h2>
            <div className="book-grid">
              {group.books.map((book) => (
                <BookItem key={book.id} book={book} onSelectBook={onSelectBook} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="book-grid">
      {books.map((book) => (
        <BookItem key={book.id} book={book} onSelectBook={onSelectBook} />
      ))}
    </div>
  );
}

function BookItem({ book, onSelectBook }: { book: Book; onSelectBook: (book: Book) => void }) {
  return (
    <div
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
  );
}
