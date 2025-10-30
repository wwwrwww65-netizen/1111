import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { trpc } from '../trpc';

export default function OrdersScreen({ navigation }: any) {
  const { data, isLoading, error } = trpc.orders.listOrders.useQuery();
  if (isLoading) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;
  if (error) return <View style={{ padding: 16 }}><Text>Error</Text></View>;
  const orders = data?.orders || [];
  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      renderItem={({ item }) => (
        <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
          <Text onPress={() => navigation.navigate('OrderDetail', { id: item.id })}>طلب #{item.id.slice(0,6)} • {item.status}</Text>
          <Text>الإجمالي: {item.total}</Text>
        </View>
      )}
    />
  );
}
