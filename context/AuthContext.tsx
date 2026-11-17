import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
import { User, Empleado } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    identifier: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildSessionUser = (employee: Empleado): User => ({
  id: String(employee.id),
  email: employee.email ?? `${employee.usuario ?? employee.documento_identidad}@fimaza.local`,
  password: '',
  name: `${employee.nombres} ${employee.apellidos}`.trim(),
  role: employee.id_cargo === 1 ? 'admin' : 'colaborador',
  employeeId: employee.id,
});

async function getMyProfile(): Promise<Empleado | null> {
  const { data, error } = await supabase.rpc('get_my_profile');
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    id: Number(row.id),
    id_cargo: Number(row.id_cargo),
    nombres: row.nombres,
    apellidos: row.apellidos,
    documento_identidad: row.documento_identidad,
    usuario: row.usuario ?? undefined,
    email: row.email ?? undefined,
    estado: Boolean(row.estado),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setUser(null);
        return;
      }
      const profile = await getMyProfile();
      if (!profile) {
        await supabase.auth.signOut();
        setUser(null);
        return;
      }
      setUser(buildSessionUser(profile));
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null);
    });
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') loadUser();
    });

    return () => {
      data.subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [loadUser]);

  const login = async (
    identifier: string,
    password: string,
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const { data: email, error: resolveError } = await supabase.rpc('resolve_login_email', {
      p_identifier: identifier.trim(),
    });

    if (resolveError || !email) {
      return { success: false, error: 'Usuario o contraseña incorrectos.' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { success: false, error: 'Usuario o contraseña incorrectos.' };
    }

    const profile = await getMyProfile();
    if (!profile) {
      await supabase.auth.signOut();
      return { success: false, error: 'Tu usuario no tiene un perfil activo.' };
    }

    if (!profile.estado) {
      await supabase.auth.signOut();
      return { success: false, error: 'Este usuario está inactivo. Contacta al Administrador.' };
    }

    const sessionUser = buildSessionUser(profile);
    setUser(sessionUser);
    return { success: true, user: sessionUser };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
