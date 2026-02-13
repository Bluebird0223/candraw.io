const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function seed() {
    try {
        // 1. Load Environment Variables
        const envPath = path.resolve(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('❌ .env.local file not found!');
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                env[key] = value;
            }
        });

        const url = env['NEXT_PUBLIC_SUPABASE_URL'];
        const key = env['SUPABASE_SERVICE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'];

        if (!url || !key) {
            console.error('❌ Missing Supabase credentials');
            return;
        }

        const supabase = createClient(url, key);

        console.log('🌱 Seeding data...');

        // Sample Data: A simple smiley face
        const sampleLines = [
            // Left Eye
            { points: [100, 100, 100, 110], color: '#FF0000', width: 5 },
            // Right Eye
            { points: [200, 100, 200, 110], color: '#FF0000', width: 5 },
            // Smile
            { points: [100, 200, 150, 250, 200, 200], color: '#0000FF', width: 5 }
        ];

        // 2. Clear existing data (Optional, but good for testing)
        // await supabase.from('drawings').delete().neq('id', 0); 
        // Note: DELETE might need RLS policies or service role key. 
        // We will just append for now to be safe with public keys.

        // 3. Insert into 'drawings' (Individual strokes)
        console.log('Inserting into "drawings"...');
        for (const line of sampleLines) {
            const { error } = await supabase.from('drawings').insert({
                points: line.points,
                color: line.color,
                width: line.width
            });
            if (error) console.error('Error inserting drawing:', error.message);
        }

        // 4. Insert into 'snapshots' (Full state)
        console.log('Inserting into "snapshots"...');
        const { data: snapshot, error: snapshotError } = await supabase.from('snapshots').insert({
            lines: sampleLines
        }).select().single();

        if (snapshotError) {
            console.error('Error inserting snapshot:', snapshotError.message);
        } else {
            console.log('✅ Created snapshot:', snapshot.id);
        }

        console.log('✅ Seeding complete!');

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

seed();
