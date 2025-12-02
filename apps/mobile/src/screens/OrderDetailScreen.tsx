import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { trpc } from '../trpc';

export default function OrderDetailScreen({ route }: any) {
  const { id } = route.params;
  const { data, isLoading, error } = trpc.orders.getById?.useQuery ? trpc.orders.getById.useQuery({ id }) : { data: null, isLoading: false, error: null } as any;
  if (isLoading) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;
  if (error || !data) return <View style={{ padding: 16 }}><Text>Error</Text></View>;
  const o = data.order;
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: '700' }}>طلب #{o.id}</Text>
      <Text>الحالة: {o.status}</Text>
      <Text>الإجمالي: {o.total}</Text>
      <FlatList data={o.items} keyExtractor={(it: any) => it.id} renderItem={({ item }) => (
        <View style={{ paddingVertical: 6 }}>
          <Text>{item.product.name} x {item.quantity}</Text>
        </View>
      )} />
    </View>
  );
}
