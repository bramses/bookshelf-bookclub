'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import { ACESFilmicToneMapping, Color } from 'three';
import Book3D from '@/components/Book3D';
import BookGrid from '@/components/BookGrid';
import { userBooks, Book } from '@/lib/data';

interface ClientHomeProps {
  initialBookId?: string;
  books: Book[];
}

function SceneSettings() {
  const { scene } = useThree();
  useEffect(() => {
    scene.environmentIntensity = 0.35;
  }, [scene]);
  return null;
}

export default function ClientHome({ initialBookId, books }: ClientHomeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#f0f0f0');
  const [textColor, setTextColor] = useState('#000000');
  const [isListView, setIsListView] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Initialize from URL
  useEffect(() => {
    const userParam = searchParams.get('username');
    if (userParam) {
      setSelectedUser(userParam);
      setIsListView(true); // Auto-switch to list view if filtering
    }
  }, [searchParams]);

  // Initialize book from URL or default
  useEffect(() => {
    if (initialBookId) {
      const index = books.findIndex((b) => b.id === initialBookId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [initialBookId, books]);

  // Extract unique users
  const users = useMemo(() => {
    const userMap = new Map<string, string>(); // username -> display name
    
    // Parse env var for display names
    const envMapStr = process.env.NEXT_PUBLIC_USER_MAP;
    if (envMapStr) {
      try {
        const parsed = JSON.parse(envMapStr);
        Object.entries(parsed).forEach(([k, v]) => userMap.set(k, v as string));
      } catch (e) {
        console.error('Failed to parse NEXT_PUBLIC_USER_MAP', e);
      }
    }

    const uniqueUsers = new Set<string>();
    books.forEach(book => {
      book.userBooks?.forEach(ub => {
        if (ub.user.username) uniqueUsers.add(ub.user.username);
      });
    });

    return Array.from(uniqueUsers).map(username => ({
      username,
      displayName: userMap.get(username) || username
    })).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [books]);

  // Filter and Group Books
  const { filteredBooks, groupedBooks } = useMemo(() => {
    if (selectedUser === 'all') {
      return { filteredBooks: books, groupedBooks: null };
    }

    const userBooksList = books.filter(b => 
      b.userBooks?.some(ub => ub.user.username === selectedUser)
    );

    // Grouping Logic
    const groups: { title: string; books: Book[] }[] = [];
    
    // 1. Currently Reading
    const reading = userBooksList.filter(b => 
      b.userBooks?.some(ub => ub.user.username === selectedUser && (ub.status as any) === 'READING')
    );
    if (reading.length > 0) {
      groups.push({ title: "Currently Reading", books: reading });
    }

    // 2. Finished/Dropped (Grouped by Month)
    const others = userBooksList.filter(b => 
      b.userBooks?.some(ub => ub.user.username === selectedUser && (ub.status as any) !== 'READING')
    );

    // Sort by end date desc
    others.sort((a, b) => {
      const dateA = a.userBooks?.find(ub => ub.user.username === selectedUser)?.endDate || a.createdAt;
      const dateB = b.userBooks?.find(ub => ub.user.username === selectedUser)?.endDate || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const monthGroups = new Map<string, Book[]>();
    others.forEach(book => {
      const ub = book.userBooks?.find(u => u.user.username === selectedUser);
      const dateStr = ub?.endDate || book.createdAt;
      const date = new Date(dateStr);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!monthGroups.has(monthYear)) {
        monthGroups.set(monthYear, []);
      }
      monthGroups.get(monthYear)?.push(book);
    });

    monthGroups.forEach((books, title) => {
      groups.push({ title, books });
    });

    return { filteredBooks: userBooksList, groupedBooks: groups };
  }, [books, selectedUser]);

  const handleUserChange = (username: string) => {
    setSelectedUser(username);
    const params = new URLSearchParams(window.location.search);
    if (username === 'all') {
      params.delete('username');
    } else {
      params.set('username', username);
    }
    router.replace(`/?${params.toString()}`);
  };

  // ... (rest of keyboard/touch handlers)

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
    // Desaturate background color
    const c = new Color(color);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    c.setHSL(hsl.h, hsl.s * 0.6, hsl.l); // Reduce saturation by 40%
    
    setBackgroundColor(c.getStyle());
    
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
      <div className="stripe-header" style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        padding: '1.5rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap', // Allow wrapping on mobile
        gap: '1rem', // Space between button and filters
        zIndex: 10,
        pointerEvents: 'none' // Let clicks pass through empty space
      }}>
        <button 
          className="list-view-toggle"
          onClick={() => setIsListView(!isListView)}
          style={{ 
            position: 'relative', // Override absolute from CSS
            top: 'auto',
            left: 'auto',
            borderColor: isListView ? '#e5e5e5' : 'rgba(255,255,255,0.3)',
            color: isListView ? '#000' : 'inherit',
            pointerEvents: 'auto', // Re-enable clicks
            flexShrink: 0
          }}
        >
          {isListView ? '← Back to Book' : 'All Books'}
        </button>

        {isListView && (
          <div className="user-filters" style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap', // Allow filters to wrap
            pointerEvents: 'auto',
            justifyContent: 'flex-end'
          }}>
            <label style={{ cursor: 'pointer', fontWeight: selectedUser === 'all' ? 'bold' : 'normal' }}>
              <input 
                type="radio" 
                name="user" 
                value="all" 
                checked={selectedUser === 'all'} 
                onChange={() => handleUserChange('all')}
                style={{ marginRight: '0.5rem' }}
              />
              All
            </label>
            {users.map(u => (
              <label key={u.username} style={{ cursor: 'pointer', fontWeight: selectedUser === u.username ? 'bold' : 'normal' }}>
                <input 
                  type="radio" 
                  name="user" 
                  value={u.username} 
                  checked={selectedUser === u.username} 
                  onChange={() => handleUserChange(u.username)}
                  style={{ marginRight: '0.5rem' }}
                />
                {u.displayName}
              </label>
            ))}
          </div>
        )}
      </div>

      {isListView ? (
        <div style={{ paddingTop: '5rem' }}>
          <BookGrid 
            books={filteredBooks} 
            groups={groupedBooks}
            onSelectBook={handleBookSelect} 
          />
        </div>
      ) : (
        <div className="stripe-content">
          {/* ... (Book3D and Details sections remain same) ... */}
          <div className="stripe-book-section">
            <Canvas 
              shadows 
              gl={{ 
                toneMapping: ACESFilmicToneMapping, 
                toneMappingExposure: 0.7 
              }}
            >
              <PerspectiveCamera makeDefault fov={28} position={[0, 0, 6]} />
              <SceneSettings />
              
              {/* Key Light - Grazing angle, high intensity */}
              <directionalLight
                position={[2.5, 3, 4]}
                intensity={2.7}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.00015}
              />

              {/* Rim Light - Edge separation */}
              <directionalLight
                position={[0, 1.5, 2]}
                intensity={0.6}
                color="#ffffff"
              />

              {/* Environment - Soft fill */}
              {/* <Environment preset="studio" /> */}

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
            <div className="stripe-description">
              {currentBook.description ? (
                (() => {
                  // Split into sentences (looking for . ! ? followed by space or end of string)
                  const sentences = currentBook.description.match(/[^.!?]+[.!?]+(\s|$)/g) || [currentBook.description];
                  const paragraphs: string[] = [];
                  let currentParagraph = "";
                  
                  sentences.forEach((sentence, index) => {
                    currentParagraph += sentence;
                    // Create new paragraph every 4 sentences or at the end
                    if ((index + 1) % 4 === 0 || index === sentences.length - 1) {
                      paragraphs.push(currentParagraph.trim());
                      currentParagraph = "";
                    }
                  });

                  return paragraphs.map((p, i) => (
                    <p key={i} style={{ marginBottom: '1em' }}>{p}</p>
                  ));
                })()
              ) : (
                "No description available."
              )}
            </div>
            
            <div style={{ marginTop: 'auto', opacity: 0.6, fontSize: '0.9rem', paddingTop: '2rem' }}>
              <p className="nav-hint-desktop">Use ↑ and ↓ keys to navigate</p>
              <p className="nav-hint-mobile">Swipe left or right to navigate</p>
            </div>
          </div>
        </div>
      )}
      <a 
        href="https://github.com/bramses/bookshelf-bookclub" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          fontSize: '0.8rem',
          opacity: 0.3,
          color: isListView ? '#000' : textColor,
          textDecoration: 'none',
          zIndex: 100,
          transition: 'opacity 0.2s',
          fontWeight: 500
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
      >
        ★ Star on GitHub
      </a>
    </main>
  );
}
