import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/db/supabase';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { lines } = req.body;

            if (!lines) {
                return res.status(400).json({ error: 'Lines data is required' });
            }

            const { data, error } = await supabase
                .from('snapshots')
                .insert([{ lines }])
                .select()
                .single();

            if (error) throw error;

            return res.status(200).json({ id: data.id });
        } catch (error) {
            console.error('Error saving snapshot:', error);
            return res.status(500).json({ error: 'Failed to save snapshot' });
        }
    } else if (req.method === 'GET') {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Snapshot ID is required' });
        }

        try {
            const { data, error } = await supabase
                .from('snapshots')
                .select('lines')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Snapshot not found' });

            return res.status(200).json({ lines: data.lines });
        } catch (error) {
            console.error('Error fetching snapshot:', error);
            return res.status(500).json({ error: 'Failed to fetch snapshot' });
        }
    } else {
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
