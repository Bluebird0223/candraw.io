'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/db/supabase';

export function useSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [drawings, setDrawings] = useState<any[]>([]);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        // Load initial drawings from Supabase
        const loadInitialDrawings = async () => {
            const { data, error } = await supabase
                .from('drawings')
                .select('*')
                .order('created_at', { ascending: true });

            if (!error && data) {
                setDrawings(data);
            }
        };

        loadInitialDrawings();

        // Setup Realtime Channel
        const channel = supabase.channel('global-canvas', {
            config: {
                broadcast: { self: false },
            },
        });

        channel
            .on('broadcast', { event: 'draw' }, ({ payload }) => {
                setDrawings((prev) => [...prev, payload]);
            })
            .on('broadcast', { event: 'clear' }, () => {
                setDrawings([]);
            })
            .subscribe((status) => {
                console.log('Realtime status:', status);
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                } else {
                    setIsConnected(false);
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    const sendDrawing = async (points: number[], color: string, width: number) => {
        const drawing = { points, color, width };

        // 1. Broadcast to other users immediately
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'draw',
                payload: drawing,
            });
        }

        // 2. Persist to Supabase
        try {
            await supabase.from('drawings').insert(drawing);
        } catch (err) {
            console.error('Error saving drawing:', err);
        }
    };

    return {
        isConnected,
        drawings,
        sendDrawing
    };
}