import React from 'react';
import { Stack } from 'expo-router';

export default function CollaboratorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
