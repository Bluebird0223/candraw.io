'use client';

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function useSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [drawings, setDrawings] = useState<any[]>([]);

    useEffect(() => {
        // Initialize socket connection
        const initSocket = async () => {
            // Ensure socket server is running
            await fetch('/api/socket');

            if (!socketInstance) {
                socketInstance = io({
                    path: '/api/socket',
                    addTrailingSlash: false,
                });
            }

            const socket = socketInstance;

            socket.on('connect', () => {
                console.log('Connected to socket server');
                setIsConnected(true);
            });

            socket.on('initial-drawings', (initialDrawings) => {
                setDrawings(initialDrawings);
            });

            socket.on('draw', (drawing) => {
                setDrawings((prev) => [...prev, drawing]);
            });

            socket.on('clear', () => {
                setDrawings([]);
            });

            socket.on('disconnect', () => {
                console.log('Disconnected from socket server');
                setIsConnected(false);
            });
        };

        initSocket();

        return () => {
            if (socketInstance) {
                socketInstance.off('connect');
                socketInstance.off('initial-drawings');
                socketInstance.off('draw');
                socketInstance.off('clear');
                socketInstance.off('disconnect');
            }
        };
    }, []);

    const sendDrawing = (points: number[], color: string, width: number) => {
        if (socketInstance && isConnected) {
            socketInstance.emit('draw', { points, color, width });
        }
    };

    const clearCanvas = () => {
        if (socketInstance && isConnected) {
            socketInstance.emit('clear');
        }
    };

    return {
        isConnected,
        drawings,
        sendDrawing,
        clearCanvas
    };
}