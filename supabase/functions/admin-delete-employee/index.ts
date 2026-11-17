import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Configuración incompleta del servidor' }, 500);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: isAdmin, error: adminError } = await callerClient.rpc('is_admin');
    if (adminError || isAdmin !== true) {
      return json({ error: 'Solo un administrador puede eliminar usuarios' }, 403);
    }

    const body = await req.json();
    const employeeId = Number(body.employee_id);
    if (!employeeId) return json({ error: 'Falta employee_id' }, 400);

    const { data: profile } = await callerClient.rpc('get_my_profile');
    const currentProfile = Array.isArray(profile) ? profile[0] : profile;
    if (currentProfile && Number(currentProfile.id) === employeeId) {
      return json({ error: 'No puedes eliminar tu propio usuario' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: employee, error: employeeError } = await adminClient
      .from('empleados')
      .select('id, auth_user_id')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee) {
      return json({ error: 'Usuario no encontrado' }, 404);
    }

    if (employee.auth_user_id) {
      const { error: authError } = await adminClient.auth.admin.deleteUser(
        employee.auth_user_id,
      );
      if (authError) return json({ error: authError.message }, 400);
    }

    const { error: deleteError } = await adminClient
      .from('empleados')
      .delete()
      .eq('id', employeeId);

    if (deleteError) return json({ error: deleteError.message }, 400);
    return json({ success: true });
  } catch (_error) {
    return json({ error: 'Error interno al eliminar el usuario' }, 500);
  }
});
