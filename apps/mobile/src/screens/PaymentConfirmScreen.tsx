import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRemoteConfig } from '../remote-config';

export default function PaymentConfirmScreen({ navigation, route }: any) {
  const { checkout } = useRemoteConfig();
  const status = route?.params?.status || 'success';
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{status === 'success' ? 'تم الدفع بنجاح' : 'فشل الدفع'}</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Root')} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8, marginTop: 8 }}>
        <Text style={{ color: '#fff' }}>العودة للرئيسية</Text>
      </TouchableOpacity>
    </View>
  );
}
