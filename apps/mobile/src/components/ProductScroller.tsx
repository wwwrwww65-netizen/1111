import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { trpc } from '../lib/trpc';

const ProductScroller = ({ title }: { title: string }) => {
  const { data, isLoading, error } = trpc.products.list.useQuery({ limit: 6 });

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error loading products</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {data?.items.map((product, index) => (
          <TouchableOpacity key={index} style={styles.product}>
            <Image source={{ uri: product.images[0] }} style={styles.image} />
            <Text style={styles.price}>{product.price} ر.س</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  product: {
    marginHorizontal: 8,
  },
  image: {
    width: 150,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ProductScroller;
