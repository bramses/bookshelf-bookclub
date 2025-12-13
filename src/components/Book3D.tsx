'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, TextureLoader, Color, CanvasTexture, SRGBColorSpace, RepeatWrapping } from 'three';
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

// Adjustable intensity for the cloth texture
const CLOTH_BUMP_SCALE = Math.random() * 2 + 1; // Random from 2 to 3

// Generate a procedural book cloth normal map
function createBookClothNormalMap(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Fill background
  ctx.fillStyle = '#808080'; // Mid-grey
  ctx.fillRect(0, 0, size, size);

  // Draw noise/weave - Increased opacity for visibility
  ctx.globalAlpha = 0.3; // Increased from 0.1
  ctx.fillStyle = '#ffffff';
  
  // Vertical threads
  for (let i = 0; i < size; i += 2) {
    if (Math.random() > 0.5) {
      ctx.fillRect(i, 0, 1, size);
    }
  }
  
  // Horizontal threads
  for (let i = 0; i < size; i += 2) {
    if (Math.random() > 0.5) {
      ctx.fillRect(0, i, size, 1);
    }
  }

  // Add some noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Increased noise range
    const noise = (Math.random() - 0.5) * 40; // Increased from 20
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
    data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

function BookCover({ imageUrl, dominantColor }: BookCoverProps) {
  const texture = useLoader(TextureLoader, imageUrl);
  texture.colorSpace = SRGBColorSpace;
  
  const [clothMap, setClothMap] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    // Generate cloth texture once
    const canvas = createBookClothNormalMap();
    const map = new CanvasTexture(canvas);
    map.wrapS = map.wrapT = RepeatWrapping;
    map.repeat.set(4, 6); // Repeat the pattern to make it fine
    setClothMap(map);
  }, []);

  const spineColor = useMemo(() => new Color(dominantColor).multiplyScalar(0.75), [dominantColor]);
  const pageColor = "#f7f4ec"; // Stripe-style warm white

  return (
    <mesh castShadow receiveShadow>
      {/* Standard box geometry, no displacement needed for fine cloth */}
      <boxGeometry args={[1, 1.4, 0.2]} />
      <meshStandardMaterial attach="material-0" color={pageColor} roughness={0.9} /> {/* Right (Pages) */}
      <meshStandardMaterial attach="material-1" color={spineColor} roughness={0.6} /> {/* Left (Spine) */}
      <meshStandardMaterial attach="material-2" color={spineColor} roughness={0.6} /> {/* Top */}
      <meshStandardMaterial attach="material-3" color={spineColor} roughness={0.6} /> {/* Bottom */}
      <meshStandardMaterial 
        attach="material-4" 
        map={texture} 
        bumpMap={clothMap || undefined}
        bumpScale={CLOTH_BUMP_SCALE}
        color="white" 
        roughness={0.7} // Cloth is rougher
        metalness={0.0} // Cloth is not metal
      /> {/* Front (Cover) */}
      <meshStandardMaterial attach="material-5" color={dominantColor} roughness={0.6} /> {/* Back */}
    </mesh>
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
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
      
      // Fiddle effect: Look at pointer
      const targetRotationX = state.pointer.y * 0.15; // Tilt up/down
      const targetRotationY = state.pointer.x * 0.3; // Tilt left/right
      
      // Smooth interpolation
      meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.08;
      meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.08;
    }
  });

  return (
    <group scale={scale}>
      <group
        ref={meshRef}
        onClick={onClick}
      >
        {/* Material array: right, left, top, bottom, front, back */}
        
        {book.imageUrl ? (
           <BookCover imageUrl={book.imageUrl} dominantColor={dominantColor} />
        ) : (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1.4, 0.2]} />
            <meshStandardMaterial color={book.color} roughness={0.6} metalness={0.1} />
          </mesh>
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
            fillOpacity={0.9}
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
      </group>
    </group>
  );
}
