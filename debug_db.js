const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
    const hallId = '78c0cb85-d556-428f-a666-2143b115d203';

    // Get Service ID
    const { data: services } = await supabase
        .from('services_catalog')
        .select('id, name')
        .eq('name', 'Standard Wedding Package')
        .single();

    if (!services) {
        console.log('Service not found');
        return;
    }

    const serviceId = services.id;
    console.log('Service ID:', serviceId);

    // Check Global Items
    const { data: globalItems } = await supabase
        .from('service_package_items')
        .select('*')
        .eq('service_id', serviceId);
    console.log('Global Items:', globalItems);

    // Check Hall Service
    const { data: hallService } = await supabase
        .from('hall_services')
        .select('*')
        .eq('hall_id', hallId)
        .eq('service_id', serviceId);

    console.log('Hall Service Record:', hallService);

    // Check Local Items
    const { data: localItems } = await supabase
        .from('hall_package_items')
        .select('*')
        .eq('hall_id', hallId)
        .eq('service_id', serviceId);

    console.log('Local Items:', localItems);
}

checkState();
