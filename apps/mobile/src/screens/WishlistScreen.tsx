import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { trpc } from '../trpc';

export default function WishlistScreen() {
  const list = trpc.wishlist.getWishlist.useQuery();
  const addToCart = trpc.wishlist.moveToCart.useMutation({ onSuccess: () => list.refetch() });
  const remove = trpc.wishlist.removeFromWishlist.useMutation({ onSuccess: () => list.refetch() });
  if (list.isLoading) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;
  if (list.error) return <View style={{ padding: 16 }}><Text>Error</Text></View>;
  const items = list.data?.wishlistItems || [];
  return (
    <FlatList
      data={items}
      keyExtractor={(i: any) => i.productId}
      renderItem={({ item }: any) => (
        <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
          <Text>{item.product.name}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <TouchableOpacity onPress={() => addToCart.mutate({ productId: item.productId, quantity: 1 })} style={{ backgroundColor: '#000', padding: 8, borderRadius: 6 }}>
              <Text style={{ color: '#fff' }}>إلى السلة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => remove.mutate({ productId: item.productId })} style={{ backgroundColor: '#ef4444', padding: 8, borderRadius: 6 }}>
              <Text style={{ color: '#fff' }}>حذف</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}
