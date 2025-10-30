import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRemoteConfig } from '../remote-config';
import { trpc } from '../trpc';
// import * as WebBrowser from 'expo-web-browser';

export default function CheckoutScreen({ navigation }: any) {
  const { checkout } = useRemoteConfig();
  const { data: cartData } = trpc.cart.getCart.useQuery();
  const createOrder = trpc.orders.createOrder.useMutation();
  const createPI = trpc.payments.createPaymentIntent.useMutation();

  async function startCheckout() {
    try {
      const ord = await createOrder.mutateAsync({});
      const amount = (cartData?.cart?.total ?? 0) as number;
      const pi = await createPI.mutateAsync({ amount, currency: 'usd', orderId: ord.order.id });
      // Mock/Success path (no 3DS flow in CI): رجوع فوري
      navigation.navigate('PaymentConfirm', { status: 'success' });
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'فشل بدء الدفع');
    }
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>الدفع</Text>
      <Text>الخطوات: {checkout.steps.join(' → ')}</Text>
      <TouchableOpacity onPress={startCheckout} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8, marginTop: 12 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>تابع الدفع</Text>
      </TouchableOpacity>
    </View>
  );
}
