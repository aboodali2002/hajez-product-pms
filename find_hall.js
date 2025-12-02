const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findHall() {
    const { data: halls, error } = await supabase
        .from('halls')
        .select('id, name, slug')
        .ilike('name', '%dorat%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Halls found:', halls);
}

findHall();
