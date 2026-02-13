const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function test() {
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
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
                env[key] = value;
            }
        });

        const url = env['NEXT_PUBLIC_SUPABASE_URL'];
        const key = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'];

        console.log('Testing connection with:');
        console.log('URL:', url);
        console.log('Key:', key ? (key.substring(0, 5) + '...') : 'MISSING');

        if (!url || !key) {
            console.error('❌ Missing Supabase credentials in .env.local');
            return;
        }

        // 2. Initialize Client
        const supabase = createClient(url, key);

        // 3. Test 'drawings' table
        console.log('\nChecking "drawings" table...');
        const { count: drawingsCount, error: drawingsError } = await supabase
            .from('drawings')
            .select('*', { count: 'exact', head: true });

        if (drawingsError) {
            console.error('❌ Error accessing "drawings":', drawingsError.message);
        } else {
            console.log('✅ "drawings" table exists. Row count:', drawingsCount);
        }

        // 4. Test 'snapshots' table
        console.log('\nChecking "snapshots" table...');
        const { count: snapshotsCount, error: snapshotsError } = await supabase
            .from('snapshots')
            .select('*', { count: 'exact', head: true });

        if (snapshotsError) {
            console.error('❌ Error accessing "snapshots":', snapshotsError.message);
        } else {
            console.log('✅ "snapshots" table exists. Row count:', snapshotsCount);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

test();
