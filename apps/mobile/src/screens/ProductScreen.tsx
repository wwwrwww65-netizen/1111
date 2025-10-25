import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { trpc } from '../trpc';
import { useRemoteConfig } from '../remote-config';

export default function ProductScreen({ route }: any) {
  const { id } = route.params;
  const { data, isLoading, error } = trpc.products.getById.useQuery({ id });
  const addItem = trpc.cart.addItem.useMutation();
  const { pdp } = useRemoteConfig();

  if (isLoading) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;
  if (error || !data) return <View style={{ padding: 16 }}><Text>Error</Text></View>;

  const blocks = pdp.blocks || [];
  const product: any = data;

  async function handleAddToCart() {
    await addItem.mutateAsync({ productId: id, quantity: 1 });
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      {blocks.map((b, i) => {
        if (b.type === 'images') {
          const src = Array.isArray(product.images) && product.images.length ? product.images[0] : undefined;
          return (
            <Image key={i} source={{ uri: src }} style={{ width: '100%', height: 360, backgroundColor: '#f2f2f2' }} contentFit="cover" />
          );
        }
        if (b.type === 'title-price') {
          return (
            <View key={i} style={{ padding: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700' }}>{product.name}</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 6 }}>${product.price}</Text>
            </View>
          );
        }
        if (b.type === 'variants') {
          // Simplified: render color + size toggle placeholders, honoring presence
          const hasColor = b.options?.color;
          const hasLetters = b.options?.sizeLetters;
          const hasNumbers = b.options?.sizeNumbers;
          return (
            <View key={i} style={{ paddingHorizontal: 16, gap: 8 }}>
              {hasColor ? <Text style={{ fontWeight: '600' }}>الألوان</Text> : null}
              {hasLetters ? <Text style={{ fontWeight: '600' }}>المقاسات بالأحرف</Text> : null}
              {hasNumbers ? <Text style={{ fontWeight: '600' }}>المقاسات بالأرقام</Text> : null}
            </View>
          );
        }
        if (b.type === 'inventory') {
          return (
            <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text>المخزون: {product.stockQuantity ?? 0}</Text>
            </View>
          );
        }
        if (b.type === 'description') {
          return (
            <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text>{product.description}</Text>
            </View>
          );
        }
        if (b.type === 'actions') {
          const canAdd = b.options?.addToCart !== false;
          const canBuy = b.options?.buyNow === true;
          return (
            <View key={i} style={{ padding: 16, gap: 8 }}>
              {canAdd ? (
                <TouchableOpacity onPress={handleAddToCart} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>أضف إلى السلة</Text>
                </TouchableOpacity>
              ) : null}
              {canBuy ? (
                <TouchableOpacity onPress={handleAddToCart} style={{ backgroundColor: '#111827', padding: 12, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>اشتر الآن</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }
        return null;
      })}
    </ScrollView>
  );
}
