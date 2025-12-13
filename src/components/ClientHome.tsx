'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import Book3D from '@/components/Book3D';
import BookGrid from '@/components/BookGrid';
import { userBooks, Book } from '@/lib/data';

interface ClientHomeProps {
  initialBookId?: string;
  books: Book[];
}

export default function ClientHome({ initialBookId, books }: ClientHomeProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#f0f0f0');
  const [textColor, setTextColor] = useState('#000000');
  const [isListView, setIsListView] = useState(false);

  // Initialize from URL or default to first book
  useEffect(() => {
    if (initialBookId) {
      const index = books.findIndex((b) => b.id === initialBookId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [initialBookId, books]);

  // Handle keyboard navigation
  useEffect(() => {
    if (isListView) return; // Disable keyboard nav in list view

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setCurrentIndex((prev) => (prev + 1) % books.length);
      } else if (e.key === 'ArrowUp') {
        setCurrentIndex((prev) => (prev - 1 + books.length) % books.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [books.length, isListView]);

  // Update URL when index changes
  useEffect(() => {
    if (!isListView) {
      const book = books[currentIndex];
      if (book) {
        window.history.replaceState(null, '', `/book/${book.id}`);
      }
    }
  }, [currentIndex, books, isListView]);

  const currentBook = books[currentIndex];

  const handleColorDetected = (color: string) => {
    setBackgroundColor(color);
    
    // Simple contrast check
    let r = 0, g = 0, b = 0;
    
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (color.startsWith('rgb')) {
      const match = color.match(/\d+/g);
      if (match) {
        r = parseInt(match[0]);
        g = parseInt(match[1]);
        b = parseInt(match[2]);
      }
    }

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    setTextColor(brightness > 128 ? '#000000' : '#ffffff');
  };

  const handleBookSelect = (book: Book) => {
    const index = books.findIndex(b => b.id === book.id);
    if (index !== -1) {
      setCurrentIndex(index);
      setIsListView(false);
    }
  };

  // Touch handling for swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Next book
      setCurrentIndex((prev) => (prev + 1) % books.length);
    }
    if (isRightSwipe) {
      // Previous book
      setCurrentIndex((prev) => (prev - 1 + books.length) % books.length);
    }
  };

  if (!currentBook) return <div>Loading...</div>;

  return (
    <main 
      className="stripe-container" 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ 
        backgroundColor: isListView ? '#ffffff' : backgroundColor, 
        color: isListView ? '#000000' : textColor,
        overflow: isListView ? 'auto' : 'hidden'
      }}
    >
      <button 
        className="list-view-toggle"
        onClick={() => setIsListView(!isListView)}
        style={{ borderColor: isListView ? '#e5e5e5' : 'rgba(255,255,255,0.3)' }}
      >
        {isListView ? '← Back to Book' : 'All Books'}
      </button>

      {isListView ? (
        <div style={{ paddingTop: '5rem' }}>
          <BookGrid books={books} onSelectBook={handleBookSelect} />
        </div>
      ) : (
        <div className="stripe-content">
          {/* Book Section */}
          <div className="stripe-book-section">
            <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <spotLight 
                position={[5, 8, 5]} 
                angle={0.4} 
                penumbra={1} 
                intensity={2.5} 
                castShadow 
                shadow-bias={-0.0001}
              />
              <pointLight position={[-5, 2, -5]} intensity={0.5} color="#fff0dd" />
              <Book3D 
                book={currentBook} 
                scale={1.7} 
                onColorDetected={handleColorDetected}
              />
            </Canvas>
          </div>

          {/* Details Section */}
          <div className="stripe-details-section">
            <h1 className="stripe-title">
              {currentBook.title}
            </h1>
            <h2 className="stripe-author">
              {currentBook.author}
            </h2>
            <div className="stripe-divider" />
            <p className="stripe-description">
              {currentBook.description || "No description available."}
            </p>
            
            <div style={{ marginTop: 'auto', opacity: 0.6, fontSize: '0.9rem', paddingTop: '2rem' }}>
              <p className="nav-hint-desktop">Use ↑ and ↓ keys to navigate</p>
              <p className="nav-hint-mobile">Swipe left or right to navigate</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
