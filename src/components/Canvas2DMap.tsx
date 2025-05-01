import React, { useEffect, useRef, useState } from 'react';
import { Location } from '../types/map';

interface Canvas2DMapProps {
  width?: number;
  height?: number;
  rotation?: number;
  locations?: Location[];
  onRotationChange?: (angle: number) => void;
}

const Canvas2DMap: React.FC<Canvas2DMapProps> = ({
  width = 800,
  height = 600,
  rotation = 0,
  locations = [],
  onRotationChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [currentRotation, setCurrentRotation] = useState(rotation);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save the current state
    ctx.save();

    // Move to center for rotation
    ctx.translate(width / 2, height / 2);
    ctx.rotate((currentRotation * Math.PI) / 180);

    // Draw grid
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    
    // Vertical lines
    for (let x = -width; x < width; x += 50) {
      ctx.moveTo(x, -height);
      ctx.lineTo(x, height);
    }
    
    // Horizontal lines
    for (let y = -height; y < height; y += 50) {
      ctx.moveTo(-width, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();

    // Draw main axes
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.moveTo(-width/2, 0);
    ctx.lineTo(width/2, 0);
    
    // Y-axis
    ctx.moveTo(0, -height/2);
    ctx.lineTo(0, height/2);
    
    ctx.stroke();

    // Draw locations
    locations.forEach(location => {
      const x = (location.lng * width) / 360;
      const y = (location.lat * height) / 180;

      ctx.beginPath();
      ctx.fillStyle = '#ef4444';
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      if (location.name) {
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px sans-serif';
        ctx.fillText(location.name, x + 8, y + 4);
      }
    });

    // Restore the context
    ctx.restore();
  }, [width, height, currentRotation, locations]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;
    
    setIsDragging(true);
    setStartAngle(Math.atan2(e.clientY - centerY, e.clientX - centerX));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let rotation = ((angle - startAngle) * 180) / Math.PI;
    
    setCurrentRotation(prevRotation => {
      const newRotation = (prevRotation + rotation) % 360;
      onRotationChange?.(newRotation);
      return newRotation;
    });
    
    setStartAngle(angle);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg shadow-lg cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded-md shadow text-sm">
        Rotation: {Math.round(currentRotation)}°
      </div>
    </div>
  );
};

export default Canvas2DMap;