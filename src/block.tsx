import React, { useRef, useEffect, useState, useCallback } from 'react';

interface BlockProps {
  title?: string;
  width?: number;
  height?: number;
}

const Block: React.FC<BlockProps> = ({ 
  title = "Simple Whiteboard",
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Color palette
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000',
    '#800000', '#808080', '#FFC0CB', '#A52A2A', '#FFFFFF'
  ];

  // Get canvas context
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas?.getContext('2d');
  }, []);

  // Get mouse/touch position relative to canvas
  const getPosition = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const pos = getPosition(e);
    setIsDrawing(true);
    setLastPos(pos);
  }, [getPosition]);

  // Draw line
  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const ctx = getContext();
    if (!ctx) return;

    const currentPos = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setLastPos(currentPos);
  }, [isDrawing, lastPos, currentColor, brushSize, getContext, getPosition]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [getContext]);

  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set up drawing context
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => startDrawing(e);
    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleMouseUp = () => stopDrawing();
    const handleMouseLeave = () => stopDrawing();

    // Touch events
    const handleTouchStart = (e: TouchEvent) => startDrawing(e);
    const handleTouchMove = (e: TouchEvent) => draw(e);
    const handleTouchEnd = () => stopDrawing();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);

      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [width, height, startDrawing, draw, stopDrawing]);

  // Send completion event when user starts drawing
  useEffect(() => {
    if (isDrawing) {
      window.postMessage({ type: 'BLOCK_COMPLETION', blockId: '685334c2157dfa0de308d307', completed: true }, '*');
      window.parent.postMessage({ type: 'BLOCK_COMPLETION', blockId: '685334c2157dfa0de308d307', completed: true }, '*');
    }
  }, [isDrawing]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      gap: '20px'
    }}>
      {/* Header */}
      <h1 style={{
        fontSize: '2rem',
        color: '#333',
        margin: 0,
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
      }}>
        {title}
      </h1>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '15px',
        background: 'white',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e1e5e9'
      }}>
        {/* Color Palette */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', color: '#555' }}>Colors:</span>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: color,
                  border: currentColor === color ? '3px solid #333' : '2px solid #ccc',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  transform: currentColor === color ? 'scale(1.1)' : 'scale(1)'
                }}
                title={`Select ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Brush Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', color: '#555' }}>Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ 
            minWidth: '25px', 
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            {brushSize}px
          </span>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          style={{
            padding: '10px 20px',
            background: '#ff4757',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff3742'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff4757'}
        >
          Clear Canvas
        </button>
      </div>

      {/* Canvas */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '10px',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #e1e5e9'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '2px solid #ddd',
            borderRadius: '5px',
            cursor: 'crosshair',
            display: 'block',
            touchAction: 'none'
          }}
        />
      </div>

      {/* Instructions */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '15px',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px',
        maxWidth: '600px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>
          🎨 <strong>Click and drag</strong> to draw on the whiteboard
        </p>
        <p style={{ margin: '0' }}>
          📱 <strong>Touch and drag</strong> on mobile devices
        </p>
      </div>
    </div>
  );
};

export default Block;