import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import { Trash2, MousePointer2, Pencil, Square, Circle as CircleIcon, Download, Undo2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface WhiteboardProps {
  socket?: any;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ socket }) => {
  const [tool, setTool] = useState<'pen' | 'rect' | 'circle' | 'eraser'>('pen');
  const [lines, setLines] = useState<any[]>([]);
  const [color, setColor] = useState('#0ea5e9');
  const isDrawing = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteUpdate = (newLine: any) => {
      setLines(prev => [...prev, newLine]);
    };

    const handleRemoteClear = () => {
      setLines([]);
    };

    socket.on('whiteboard:update', handleRemoteUpdate);
    socket.on('whiteboard:clear', handleRemoteClear);

    return () => {
      socket.off('whiteboard:update', handleRemoteUpdate);
      socket.off('whiteboard:clear', handleRemoteClear);
    };
  }, [socket]);

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool, points: [pos.x, pos.y], color }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    
    if (tool === 'pen' || tool === 'eraser') {
      lastLine.points = lastLine.points.concat([point.x, point.y]);
    } else if (tool === 'rect' || tool === 'circle') {
      // For shapes, we update the second point
      lastLine.points[2] = point.x;
      lastLine.points[3] = point.y;
    }

    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    // Here we would emit the final line/shape to the socket for collaboration
    if (socket) {
      socket.emit('whiteboard:update', lines[lines.length - 1]);
    }
  };

  const clearCanvas = () => {
    setLines([]);
    if (socket) socket.emit('whiteboard:clear');
  };

  const undo = () => {
    setLines(lines.slice(0, -1));
  };

  const downloadImage = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'whiteboard-design.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stageRef = useRef<any>(null);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur shadow-xl border border-black/5 p-2 rounded-2xl">
        <button 
          onClick={() => setTool('pen')}
          className={cn("p-2 rounded-xl transition-all", tool === 'pen' ? "bg-accent text-white shadow-lg shadow-accent/20" : "hover:bg-black/5 text-black/60")}
          title="Pencil"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setTool('rect')}
          className={cn("p-2 rounded-xl transition-all", tool === 'rect' ? "bg-accent text-white shadow-lg shadow-accent/20" : "hover:bg-black/5 text-black/60")}
          title="Rectangle"
        >
          <Square className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setTool('circle')}
          className={cn("p-2 rounded-xl transition-all", tool === 'circle' ? "bg-accent text-white shadow-lg shadow-accent/20" : "hover:bg-black/5 text-black/60")}
          title="Circle"
        >
          <CircleIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-black/10 mx-1" />
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
        />
        <div className="w-px h-6 bg-black/10 mx-1" />
        <button onClick={undo} className="p-2 rounded-xl hover:bg-black/5 text-black/60" title="Undo">
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={clearCanvas} className="p-2 rounded-xl hover:bg-red-50 text-red-500" title="Clear All">
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={downloadImage} className="p-2 rounded-xl hover:bg-black/5 text-black/60" title="Download">
          <Download className="w-4 h-4" />
        </button>
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
        className="cursor-crosshair"
      >
        <Layer>
          {lines.map((line, i) => {
            if (line.tool === 'pen' || line.tool === 'eraser') {
              return (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={5}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    line.tool === 'eraser' ? 'destination-out' : 'source-over'
                  }
                />
              );
            } else if (line.tool === 'rect') {
              const x = line.points[0];
              const y = line.points[1];
              const width = (line.points[2] || x) - x;
              const height = (line.points[3] || y) - y;
              return (
                <Rect
                  key={i}
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  stroke={line.color}
                  strokeWidth={2}
                />
              );
            } else if (line.tool === 'circle') {
              const x = line.points[0];
              const y = line.points[1];
              const radius = Math.sqrt(
                Math.pow((line.points[2] || x) - x, 2) + 
                Math.pow((line.points[3] || y) - y, 2)
              );
              return (
                <Circle
                  key={i}
                  x={x}
                  y={y}
                  radius={radius}
                  stroke={line.color}
                  strokeWidth={2}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
      
      {/* Hint */}
      <div className="absolute bottom-4 right-4 text-[10px] text-black/30 font-mono">
        Collaborative Whiteboard Mode Active
      </div>
    </div>
  );
};
