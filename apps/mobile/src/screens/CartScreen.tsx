import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useRemoteConfig } from '../remote-config';
import { trpc } from '../trpc';

export default function CartScreen({ navigation }: any) {
  const { cart } = useRemoteConfig();
  const { data, refetch } = trpc.cart.getCart.useQuery();
  const removeItem = trpc.cart.removeItem.useMutation({ onSuccess: () => refetch() });

  const items = data?.cart?.items || [];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <View>
              <Text>{item.product.name}</Text>
              <Text>x{item.quantity}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem.mutate({ itemId: item.id })}>
              <Text style={{ color: '#ef4444' }}>حذف</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={{ paddingTop: 12 }}>
        {cart.totals.includes('subtotal') && <Text>المجموع: {data?.cart?.subtotal ?? 0}</Text>}
        {cart.totals.includes('shipping') && <Text>الشحن: سيتم احتسابه</Text>}
        {cart.totals.includes('discounts') && <Text>الخصومات: 0</Text>}
        {cart.totals.includes('total') && <Text style={{ fontWeight: '700' }}>الإجمالي: {data?.cart?.total ?? 0}</Text>}
        <TouchableOpacity onPress={() => navigation.navigate('Checkout')} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8, marginTop: 8 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>إتمام الشراء</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
