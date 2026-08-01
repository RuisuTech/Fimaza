import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProductsProvider } from '@/context/ProductsContext';
import { ActivityProvider } from '@/context/ActivityContext';
import { SalesProvider } from '@/context/SalesContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { CatalogsProvider } from '@/context/CatalogsContext';
import { UsersProvider } from '@/context/UsersContext';
import { InventoryProvider } from '@/context/InventoryContext';
import { Colors } from '@/constants/theme';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(admin)' || segments[0] === '(collaborator)';
    const inLoginRoute = segments[0] === 'login';

    if (!user && inAuthGroup) {
      router.dismissAll();
      router.replace('/login');
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
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="(collaborator)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CatalogsProvider>
        <UsersProvider>
          <SettingsProvider>
            <ActivityProvider>
              <ProductsProvider>
                <InventoryProvider>
                  <SalesProvider>
                    <RootLayoutNav />
                    <StatusBar style="auto" />
                  </SalesProvider>
                </InventoryProvider>
              </ProductsProvider>
            </ActivityProvider>
          </SettingsProvider>
        </UsersProvider>
      </CatalogsProvider>
    </AuthProvider>
  );
}
