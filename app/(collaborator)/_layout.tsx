import React from 'react';
import { Stack } from 'expo-router';

export default function CollaboratorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="productos" options={{ headerShown: false }} />
      <Stack.Screen name="ventas" options={{ headerShown: false }} />
      <Stack.Screen name="stock" options={{ headerShown: false }} />
    </Stack>
  );
}
