'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Book, UserBook } from '@/lib/data';
import Book3D from './Book3D';
import ColorThief from 'colorthief';

interface BookDetailProps {
  book: Book;
  userBook?: UserBook;
  onClose: () => void;
}

export default function BookDetail({ book, userBook, onClose }: BookDetailProps) {
  const [bgColor, setBgColor] = useState<string>('#f5f5f5');

  useEffect(() => {
    if (book.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = book.imageUrl;
      img.onload = () => {
        const colorThief = new ColorThief();
        try {
          const color = colorThief.getColor(img);
          // Calculate complementary color (invert RGB)
          // Or maybe just a lighter/darker version or a muted version of the dominant color
          // Let's try a very muted version of the dominant color for the background
           setBgColor(`rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`);
        } catch (e) {
          console.error('Error getting dominant color', e);
        }
      };
    } else {
        // Use book color with opacity
        setBgColor(book.color + '33'); // 20% opacity approx
    }
  }, [book.imageUrl, book.color]);

  return (
    <div className="book-detail-overlay">
      <button 
        onClick={onClose}
        className="close-button"
      >
        &times;
      </button>
      
      <div className="book-detail-card">
        {/* Left Side: 3D Book */}
        <div className="book-3d-container" style={{ backgroundColor: bgColor, transition: 'background-color 0.5s ease' }}>
          <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={2048} castShadow />
            <Suspense fallback={<mesh><boxGeometry args={[1, 1.4, 0.2]} /><meshStandardMaterial color="gray" /></mesh>}>
              <Book3D book={book} scale={1.5} />
              <Environment preset="studio" />
            </Suspense>
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
          </Canvas>
        </div>

        {/* Right Side: Details */}
        <div className="book-info-container">
          <h1 className="detail-title">{book.title}</h1>
          <h2 className="detail-author">{book.author}</h2>
          
          <div className="detail-content">
            <p className="detail-description">{book.description}</p>
            
            <div className="detail-meta">
              <div className="meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Year</span>
                  <span>{new Date(book.createdAt).getFullYear()}</span> {/* Mock year */}
                </div>
                <div className="meta-item">
                  <span className="meta-label">ISBN</span>
                  <span>{book.isbn}</span>
                </div>
                {userBook && (
                    <>
                        <div className="meta-item">
                        <span className="meta-label">Status</span>
                        <span className={`status-badge ${userBook.status.toLowerCase()}`}>
                            {userBook.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        </div>
                         <div className="meta-item">
                        <span className="meta-label">Read Date</span>
                        <span>{userBook.endDate ? userBook.endDate.toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
