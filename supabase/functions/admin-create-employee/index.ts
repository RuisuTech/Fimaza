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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'No autorizado' }, 401);
    }

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
      return json({ error: 'Solo un administrador puede crear usuarios' }, 403);
    }

    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const nombres = String(body.nombres ?? '').trim();
    const apellidos = String(body.apellidos ?? '').trim();
    const documento = String(body.documento_identidad ?? '').trim();
    const usuario = String(body.usuario ?? '').trim().toLowerCase();
    const idCargo = Number(body.id_cargo);
    const estado = body.estado !== false;

    if (!email || !password || !nombres || !apellidos || !documento || !usuario) {
      return json({ error: 'Faltan datos obligatorios' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Correo inválido' }, 400);
    }
    if (password.length < 8) {
      return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400);
    }
    if (![1, 2, 3].includes(idCargo)) {
      return json({ error: 'Cargo inválido' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombres, apellidos, usuario, id_cargo: idCargo },
    });

    if (authError || !authData.user) {
      return json({ error: authError?.message ?? 'No se pudo crear el acceso' }, 400);
    }

    const employeeId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    const { data: employee, error: profileError } = await adminClient
      .from('empleados')
      .insert({
        id: employeeId,
        auth_user_id: authData.user.id,
        id_cargo: idCargo,
        nombres,
        apellidos,
        documento_identidad: documento,
        usuario,
        email,
        estado,
      })
      .select('id, nombres, apellidos, documento_identidad, usuario, email, id_cargo, estado, auth_user_id')
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return json({ error: profileError.message }, 400);
    }

    return json({ employee }, 201);
  } catch (_error) {
    return json({ error: 'Error interno al crear el usuario' }, 500);
  }
});
