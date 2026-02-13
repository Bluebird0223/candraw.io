'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { useSocket } from '@/hooks/useSocket';
import Toolbar from './Toolbar';

export default function Canvas() {
    const [lines, setLines] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const stageRef = useRef<any>(null);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [showCursor, setShowCursor] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isMounted, setIsMounted] = useState(false);

    const { isConnected, drawings, sendDrawing } = useSocket();
    // State for color and width
    const [strokeColor, setStrokeColor] = useState('#FFFFFF');
    const [strokeWidth, setStrokeWidth] = useState(2);


    // Init
    useEffect(() => {
        setIsMounted(true);
        setDimensions({
            width: window.innerWidth,
            height: window.innerHeight
        });

        // Check for snapshot
        const params = new URLSearchParams(window.location.search);
        const snapshotId = params.get('snapshot');

        if (snapshotId) {
            fetch(`/api/snapshots?id=${snapshotId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.lines) setLines(data.lines);
                })
                .catch(err => console.error('Failed to load snapshot', err));
        } else {
            // Only sync with socket if not viewing a snapshot (or maybe sync anyway?)
            // For now, if snapshot is loaded, we might want to keep it stationary until user draws
        }

        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync with server drawings if NO snapshot is loaded (or if we want real-time)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (!params.get('snapshot')) {
            setLines(drawings);
        }
    }, [drawings]);

    const handleContainerMouseMove = (e: React.MouseEvent) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = (e: any) => {
        setIsDrawing(true);
        const pos = e.target.getStage().getPointerPosition();
        if (pos) {
            setLines(prevLines => [...prevLines, {
                points: [pos.x, pos.y],
                color: strokeColor,
                width: strokeWidth
            }]);
        }
    };

    const handleStageMouseMove = (e: any) => {
        if (!isDrawing) return;

        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        if (!point) return;

        setLines(prevLines => {
            const lastLine = prevLines[prevLines.length - 1];
            if (!lastLine) return prevLines;

            const newPoints = [...lastLine.points, point.x, point.y];
            const updatedLine = { ...lastLine, points: newPoints };

            // Throttle sending to server
            if (newPoints.length % 10 === 0) {
                sendDrawing(newPoints, lastLine.color, lastLine.width);
            }

            const newLines = [...prevLines];
            newLines[newLines.length - 1] = updatedLine;
            return newLines;
        });
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleShare = async () => {
        try {
            const res = await fetch('/api/snapshots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lines }),
            });
            const data = await res.json();
            if (data.id) {
                const url = `${window.location.origin}/?snapshot=${data.id}`;
                navigator.clipboard.writeText(url);
                alert('Snapshot link copied to clipboard: ' + url);

                // Increase dimensions by 20px
                setDimensions(prev => ({
                    width: prev.width + 20,
                    height: prev.height + 20
                }));
            }
        } catch (err) {
            console.error('Failed to share', err);
            alert('Failed to share drawing');
        }
    };

    if (!isMounted) return null;

    return (
        <div
            className="relative w-screen h-screen overflow-auto cursor-none"
            onMouseMove={handleContainerMouseMove}
            onMouseEnter={() => setShowCursor(true)}
            onMouseLeave={() => setShowCursor(false)}
        >
            {/* Custom Cursor */}
            <div
                className="pointer-events-none fixed rounded-full border-2 border-white shadow-sm z-50 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                    left: cursorPos.x,
                    top: cursorPos.y,
                    width: Math.max(strokeWidth, 10),
                    height: Math.max(strokeWidth, 10),
                    backgroundColor: strokeColor,
                    opacity: 0.8,
                    display: showCursor ? 'block' : 'none'
                }}
            />

            {/* Connection status */}
            <div className={`absolute top-4 left-4 z-10 px-1 py-1 rounded-full text-sm ${isConnected ? 'bg-green-500' : 'bg-red-500'
                } text-white`}>
            </div>

            <div className="cursor-none">
                <Toolbar
                    onColorChange={setStrokeColor}
                    onWidthChange={setStrokeWidth}
                    onShare={handleShare}
                />
            </div>

            <Stage
                width={dimensions.width}
                height={dimensions.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                ref={stageRef}
            >
                <Layer>
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke={line.color}
                            strokeWidth={line.width}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            perfectDrawEnabled={false}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
}