import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { trpc } from '../trpc';

export default function AccountScreen({ navigation }: any) {
  const utils = trpc.useUtils?.?.();
  const me = trpc.auth.me.useQuery(undefined, { retry: 0 });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      try { await SecureStore.deleteItemAsync('shop_token'); } catch {}
      me.refetch();
      Alert.alert('تم تسجيل الخروج');
    },
  });

  if (me.isLoading) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;
  if (me.error) return (
    <View style={{ padding: 16 }}>
      <Text>غير مسجل</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Auth')} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8, marginTop: 8 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>تسجيل الدخول</Text>
      </TouchableOpacity>
    </View>
  );
  const u = me.data;
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>مرحباً {u.name || u.email}</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Orders')} style={{ backgroundColor: '#111827', padding: 12, borderRadius: 8, marginTop: 8 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>طلباتي</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Address')} style={{ backgroundColor: '#374151', padding: 12, borderRadius: 8, marginTop: 8 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>عناويني</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => logout.mutate()} style={{ backgroundColor: '#ef4444', padding: 12, borderRadius: 8, marginTop: 8 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
}
