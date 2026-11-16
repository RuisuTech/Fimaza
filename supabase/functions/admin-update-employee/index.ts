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
      return json({ error: 'Solo un administrador puede actualizar usuarios' }, 403);
    }

    const body = await req.json();
    const employeeId = Number(body.employee_id);
    const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
    const password = body.password ? String(body.password) : undefined;

    if (!employeeId) return json({ error: 'Falta employee_id' }, 400);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Correo inválido' }, 400);
    }
    if (password && password.length < 8) {
      return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: employee, error: employeeError } = await adminClient
      .from('empleados')
      .select('id, auth_user_id, email')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee) {
      return json({ error: 'Usuario no encontrado' }, 404);
    }
    if (!employee.auth_user_id) {
      return json({ error: 'El perfil no tiene usuario de Supabase Auth' }, 400);
    }

    if (email || password) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(
        employee.auth_user_id,
        {
          ...(email ? { email, email_confirm: true } : {}),
          ...(password ? { password } : {}),
        },
      );
      if (authError) return json({ error: authError.message }, 400);
    }

    const profileUpdates: Record<string, unknown> = {};
    const fields = ['nombres', 'apellidos', 'documento_identidad', 'usuario', 'id_cargo', 'estado'];
    for (const field of fields) {
      if (field in body) profileUpdates[field] = body[field];
    }
    if (email) profileUpdates.email = email;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateError } = await adminClient
        .from('empleados')
        .update(profileUpdates)
        .eq('id', employeeId);
      if (updateError) return json({ error: updateError.message }, 400);
    }

    return json({ success: true });
  } catch (_error) {
    return json({ error: 'Error interno al actualizar el usuario' }, 500);
  }
});
