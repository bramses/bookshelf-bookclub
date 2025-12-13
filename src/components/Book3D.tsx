'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, TextureLoader, Color, CanvasTexture, SRGBColorSpace } from 'three';
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

function makeHeightMap(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i];
    const g = data.data[i + 1];
    const b = data.data[i + 2];
    const v = (r + g + b) / 3; // grayscale
    
    // Boost contrast
    const contrast = 1.5; // Reduced from 2.0 to avoid harsh clamping
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const c = factor * (v - 128) + 128;

    data.data[i] = data.data[i + 1] = data.data[i + 2] = c;
  }

  ctx.putImageData(data, 0, 0);
  return canvas;
}

function BookCover({ imageUrl, dominantColor }: BookCoverProps) {
  const texture = useLoader(TextureLoader, imageUrl);
  texture.colorSpace = SRGBColorSpace;
  
  const [bumpMap, setBumpMap] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = imageUrl;
      img.onload = () => {
        const canvas = makeHeightMap(img);
        const bump = new CanvasTexture(canvas);
        setBumpMap(bump);
      };
    }
  }, [imageUrl]);

  const spineColor = useMemo(() => new Color(dominantColor).multiplyScalar(0.75), [dominantColor]);
  const pageColor = "#f7f4ec"; // Stripe-style warm white

  return (
    <mesh castShadow receiveShadow>
      {/* Increase segments for displacement map */}
      <boxGeometry args={[1, 1.4, 0.2, 32, 32, 1]} />
      <meshStandardMaterial attach="material-0" color={pageColor} roughness={0.9} /> {/* Right (Pages) */}
      <meshStandardMaterial attach="material-1" color={spineColor} roughness={0.6} /> {/* Left (Spine) */}
      <meshStandardMaterial attach="material-2" color={spineColor} roughness={0.6} /> {/* Top */}
      <meshStandardMaterial attach="material-3" color={spineColor} roughness={0.6} /> {/* Bottom */}
      <meshStandardMaterial 
        attach="material-4" 
        map={texture} 
        displacementMap={bumpMap || undefined}
        displacementScale={0.05}
        bumpMap={bumpMap || undefined}
        bumpScale={0.02}
        color="white" 
        roughness={0.55} 
        metalness={0.02} 
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
