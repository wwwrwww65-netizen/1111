import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { trpc } from '../trpc';

export default function AccountScreen({ navigation }: any) {
  const me = trpc.auth.me.useQuery(undefined, { retry: 0 });
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
    </View>
  );
}
