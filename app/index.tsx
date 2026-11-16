import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function IndexScreen() {
  const { user } = useAuth();

  if (user) {
    return <Redirect href={user.role === 'admin' ? '/(admin)' : '/(collaborator)'} />;
  }

  return <Redirect href="/login" />;
}
