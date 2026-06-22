import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import { Trash2, Pencil, Square, Circle as CircleIcon, Download, Undo2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Stroke {
  tool: 'pen' | 'rect' | 'circle' | 'eraser';
  points: number[];
  color: string;
}

interface WhiteboardProps {
  socket?: any;
}

function useContainerSize(ref: React.RefObject<HTMLDivElement>) {
  const [size, setSize] = useState({ width: 800, height: 600 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(ref.current);
    // Set initial size
    setSize({ width: ref.current.offsetWidth, height: ref.current.offsetHeight });
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ socket }) => {
  const [tool, setTool] = useState<'pen' | 'rect' | 'circle' | 'eraser'>('pen');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState('#0ea5e9');
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  // Replay strokes from server when joining a room that already has drawings
  useEffect(() => {
    if (!socket) return;

    const handleInit = (state: { strokes?: Stroke[] }) => {
      if (state.strokes && state.strokes.length > 0) {
        setStrokes(state.strokes);
      }
    };

    const handleRemoteUpdate = (stroke: Stroke) => {
      setStrokes(prev => [...prev, stroke]);
    };

    const handleRemoteClear = () => setStrokes([]);

    socket.on('init', handleInit);
    socket.on('whiteboard:update', handleRemoteUpdate);
    socket.on('whiteboard:clear', handleRemoteClear);

    return () => {
      socket.off('init', handleInit);
      socket.off('whiteboard:update', handleRemoteUpdate);
      socket.off('whiteboard:clear', handleRemoteClear);
    };
  }, [socket]);

  // Unified pointer-down handler (mouse + touch)
  const handlePointerDown = useCallback((e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    const newStroke: Stroke = { tool, points: [pos.x, pos.y], color };
    setStrokes(prev => [...prev, newStroke]);
  }, [tool, color]);

  // Unified pointer-move handler — fully immutable update (no splice/mutation)
  const handlePointerMove = useCallback((e: any) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    setStrokes(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      let updatedPoints: number[];
      if (last.tool === 'pen' || last.tool === 'eraser') {
        updatedPoints = [...last.points, point.x, point.y];
      } else {
        // rect / circle: update the drag endpoint (indices 2 & 3)
        updatedPoints = [last.points[0], last.points[1], point.x, point.y];
      }
      return [
        ...prev.slice(0, -1),
        { ...last, points: updatedPoints },
      ];
    });
  }, []);

  // Unified pointer-up handler — emit completed stroke to collaborators
  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (socket) {
      setStrokes(prev => {
        if (prev.length > 0) {
          socket.emit('whiteboard:update', prev[prev.length - 1]);
        }
        return prev;
      });
    }
  }, [socket]);

  const clearCanvas = useCallback(() => {
    setStrokes([]);
    if (socket) socket.emit('whiteboard:clear');
  }, [socket]);

  const undo = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1));
  }, []);

  const downloadImage = useCallback(() => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const TOOLS = [
    { id: 'pen' as const,    icon: Pencil,      title: 'Pen' },
    { id: 'rect' as const,   icon: Square,      title: 'Rectangle' },
    { id: 'circle' as const, icon: CircleIcon,  title: 'Circle' },
  ];

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-white overflow-hidden relative select-none">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur shadow-xl border border-black/5 p-2 rounded-2xl">
        {TOOLS.map(({ id, icon: Icon, title }) => (
          <button
            key={id}
            onClick={() => setTool(id)}
            className={cn("p-2 rounded-xl transition-all", tool === id ? "bg-accent text-white shadow-lg shadow-accent/20" : "hover:bg-black/5 text-black/60")}
            title={title}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <div className="w-px h-6 bg-black/10 mx-1" />
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
          title="Stroke color"
        />
        <div className="w-px h-6 bg-black/10 mx-1" />
        <button onClick={undo} className="p-2 rounded-xl hover:bg-black/5 text-black/60" title="Undo">
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={clearCanvas} className="p-2 rounded-xl hover:bg-red-50 text-red-500" title="Clear All">
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={downloadImage} className="p-2 rounded-xl hover:bg-black/5 text-black/60" title="Download PNG">
          <Download className="w-4 h-4" />
        </button>
      </div>

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="cursor-crosshair"
      >
        <Layer>
          {strokes.map((stroke, i) => {
            if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
              return (
                <Line
                  key={i}
                  points={stroke.points}
                  stroke={stroke.color}
                  strokeWidth={stroke.tool === 'eraser' ? 20 : 4}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={stroke.tool === 'eraser' ? 'destination-out' : 'source-over'}
                />
              );
            }
            if (stroke.tool === 'rect') {
              const [x, y, x2 = x, y2 = y] = stroke.points;
              return (
                <Rect key={i} x={x} y={y} width={x2 - x} height={y2 - y} stroke={stroke.color} strokeWidth={2} />
              );
            }
            if (stroke.tool === 'circle') {
              const [x, y, x2 = x, y2 = y] = stroke.points;
              const radius = Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));
              return (
                <Circle key={i} x={x} y={y} radius={radius} stroke={stroke.color} strokeWidth={2} />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>

      <div className="absolute bottom-4 right-4 text-[10px] text-black/30 font-mono pointer-events-none">
        Collaborative Whiteboard · {strokes.length} stroke{strokes.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
