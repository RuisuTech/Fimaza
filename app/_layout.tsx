import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProductsProvider } from '@/context/ProductsContext';
import { ActivityProvider } from '@/context/ActivityContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { CatalogsProvider } from '@/context/CatalogsContext';
import { UsersProvider } from '@/context/UsersContext';
import { ClientsProvider } from '@/context/ClientsContext';
import { SuppliersProvider } from '@/context/SuppliersContext';
import { SalesProvider } from '@/context/SalesContext';
import { WarehouseProvider } from '@/context/WarehouseContext';
import { PurchasesProvider } from '@/context/PurchasesContext';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import { Colors } from '@/constants/theme';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAdminGroup = segments[0] === '(admin)';
    const inCollaboratorGroup = segments[0] === '(collaborator)';
    const inAuthGroup = inAdminGroup || inCollaboratorGroup;
    const inLoginRoute = segments[0] === 'login';

    if (!user && inAuthGroup) {
      router.dismissAll();
      router.replace('/login');
    } else if (user && inAdminGroup && user.role !== 'admin') {
      router.replace('/(collaborator)');
    } else if (user && inCollaboratorGroup && user.role === 'admin') {
      router.replace('/(admin)');
    } else if (user && inLoginRoute) {
      const route = user.role === 'admin' ? '/(admin)' : '/(collaborator)';
      router.replace(route);
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.accent} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="(collaborator)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <CatalogsProvider>
          <UsersProvider>
            <ClientsProvider>
              <SuppliersProvider>
                <SettingsProvider>
                  <ActivityProvider>
                    <ProductsProvider>
                      <SalesProvider>
                        <WarehouseProvider>
                          <PurchasesProvider>
                            <RootLayoutNav />
                            <StatusBar style="auto" />
                          </PurchasesProvider>
                        </WarehouseProvider>
                      </SalesProvider>
                    </ProductsProvider>
                  </ActivityProvider>
                </SettingsProvider>
              </SuppliersProvider>
            </ClientsProvider>
          </UsersProvider>
        </CatalogsProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
