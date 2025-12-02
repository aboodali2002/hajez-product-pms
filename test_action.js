const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInitialize() {
    // Login
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@mahdi.com',
        password: 'admin123'
    });

    if (loginError) {
        console.error('Login Error:', loginError);
        return;
    }
    console.log('Logged in as:', session.user.email);

    const hallId = '19e1f35e-fe12-41cc-acda-66b7c17e1659'; // Dorat Joman
    const serviceId = '42771150-cfe0-491b-8948-ccde2675756d'; // Standard Wedding Package

    console.log('Initializing local items...');

    // 1. Fetch global items
    const { data: globalItems, error: fetchError } = await supabase
        .from('service_package_items')
        .select('name')
        .eq('service_id', serviceId);

    if (fetchError) {
        console.error('Fetch Error:', fetchError);
        return;
    }
    console.log('Global Items found:', globalItems.length);

    // 2. Insert into local items
    if (globalItems.length > 0) {
        const { error: insertError } = await supabase
            .from('hall_package_items')
            .insert(
                globalItems.map(item => ({
                    hall_id: hallId,
                    service_id: serviceId,
                    name: item.name
                }))
            );
        if (insertError) {
            console.error('Insert Error:', insertError);
            return;
        }
        console.log('Inserted local items');
    }

    // 3. Set flag
    const { data: updated, error: updateError } = await supabase
        .from('hall_services')
        .update({ has_custom_items: true })
        .eq('hall_id', hallId)
        .eq('service_id', serviceId)
        .select();

    if (updateError) {
        console.error('Update Error:', updateError);
        return;
    }

    console.log('Updated hall_services:', updated);
}

testInitialize();
