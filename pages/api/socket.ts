import { Server as IOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Socket as NetSocket } from 'net';
import { supabase } from '@/lib/db/supabase';

interface SocketServer extends NetServer {
    io?: IOServer;
}

interface SocketWithIO extends NetSocket {
    server: SocketServer;
}

export default async function SocketHandler(req: NextApiRequest, res: any) {
    if (!res.socket.server.io) {
        console.log('Setting up socket.io');

        const io = new IOServer(res.socket.server, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        io.on('connection', async (socket) => {
            console.log('New client connected:', socket.id);
            const GLOBAL_ROOM = 'global-canvas';

            socket.join(GLOBAL_ROOM);

            // Load initial drawings from Supabase
            try {
                const { data, error } = await supabase
                    .from('drawings')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (!error && data) {
                    socket.emit('initial-drawings', data);
                } else {
                    console.error('Error fetching initial drawings:', error);
                }
            } catch (err) {
                console.error('Failed to fetch drawings:', err);
            }

            // Handle drawing
            socket.on('draw', async (data: { points: number[]; color: string; width: number }) => {
                const { points, color, width } = data;

                // Save to Supabase
                try {
                    await supabase.from('drawings').insert({
                        points,
                        color,
                        width
                    });
                } catch (err) {
                    console.error('Error saving drawing:', err);
                }

                // Broadcast to others in global room
                socket.to(GLOBAL_ROOM).emit('draw', { points, color, width });
            });

            // Clear room
            socket.on('clear', async () => {
                try {
                    await supabase.from('drawings').delete().neq('id', 0); // Delete all
                    io.to(GLOBAL_ROOM).emit('clear');
                } catch (err) {
                    console.error('Error clearing drawings:', err);
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        res.socket.server.io = io;
    }

    res.end();
}

export const config = {
    api: {
        bodyParser: false
    }
};
