'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, TextureLoader, Color } from 'three';
import { Text } from '@react-three/drei';
import { Book } from '@/lib/data';
import ColorThief from 'colorthief';

interface Book3DProps {
  book: Book;
  onClick?: () => void;
  scale?: number;
  onColorDetected?: (color: string) => void;
}

interface BookCoverProps {
  imageUrl: string;
  dominantColor: string;
}

function BookCover({ imageUrl, dominantColor }: BookCoverProps) {
  const texture = useLoader(TextureLoader, imageUrl);
  return (
    <>
      <meshStandardMaterial attach="material-0" color="white" roughness={0.8} metalness={0.1} /> {/* Right (Pages) */}
      <meshStandardMaterial attach="material-1" color={dominantColor} roughness={0.8} metalness={0.1} /> {/* Left (Spine) */}
      <meshStandardMaterial attach="material-2" color={dominantColor} roughness={0.8} metalness={0.1} /> {/* Top */}
      <meshStandardMaterial attach="material-3" color={dominantColor} roughness={0.8} metalness={0.1} /> {/* Bottom */}
      <meshStandardMaterial attach="material-4" map={texture} color="white" roughness={0.6} metalness={0.1} /> {/* Front (Cover) */}
      <meshStandardMaterial attach="material-5" color={dominantColor} roughness={0.8} metalness={0.1} /> {/* Back */}
    </>
  );
}

export default function Book3D({ book, onClick, scale = 1, onColorDetected }: Book3DProps) {
  const meshRef = useRef<Mesh>(null);
  const [dominantColor, setDominantColor] = useState<string>(book.color);

  useEffect(() => {
    if (book.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = book.imageUrl;
      img.onload = () => {
        const colorThief = new ColorThief();
        try {
          const color = colorThief.getColor(img);
          const rgbString = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
          setDominantColor(rgbString);
          if (onColorDetected) {
            onColorDetected(rgbString);
          }
        } catch (e) {
          console.error('Error getting dominant color', e);
          if (onColorDetected) {
            onColorDetected(book.color);
          }
        }
      };
      img.onerror = () => {
         if (onColorDetected) {
            onColorDetected(book.color);
          }
      }
    } else {
        setDominantColor(book.color);
        if (onColorDetected) {
            onColorDetected(book.color);
        }
    }
  }, [book.imageUrl, book.color, onColorDetected]);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
      
      // Fiddle effect: Look at pointer
      const targetRotationX = state.pointer.y * 0.2; // Tilt up/down
      const targetRotationY = state.pointer.x * 0.4; // Tilt left/right
      
      // Smooth interpolation
      meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.1;
      meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.1;
    }
  });

  return (
    <group scale={scale}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1.4, 0.2]} />
        {/* Material array: right, left, top, bottom, front, back */}
        
        {book.imageUrl ? (
           <BookCover imageUrl={book.imageUrl} dominantColor={dominantColor} />
        ) : (
          <meshStandardMaterial color={book.color} roughness={0.8} metalness={0.1} />
        )}
        
        {/* Spine Text */}
        <group position={[-0.51, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
           <Text
            fontSize={0.12}
            color="white"
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, Math.PI / 2]}
            maxWidth={1.3}
            textAlign="center"
            lineHeight={1}
          >
            {book.title}
          </Text>
        </group>
        
         {/* Cover Text - Only show if NO image URL */}
        {!book.imageUrl && (
        <group position={[0, 0, 0.11]}>
           <Text
            fontSize={0.15}
            color="white"
            maxWidth={0.8}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.2, 0]}
          >
            {book.title}
          </Text>
           <Text
            fontSize={0.08}
            color="white"
            maxWidth={0.8}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.3, 0]}
          >
            {book.author}
          </Text>
        </group>
        )}
      </mesh>
    </group>
  );
}
