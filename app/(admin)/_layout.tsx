import React from 'react';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="productos" options={{ headerShown: false }} />
      <Stack.Screen name="ventas" options={{ headerShown: false }} />
      <Stack.Screen name="usuarios" options={{ headerShown: false }} />
      <Stack.Screen name="config" options={{ headerShown: false }} />
    </Stack>
  );
}
