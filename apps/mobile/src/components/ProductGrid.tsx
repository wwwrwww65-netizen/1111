import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { trpc } from '../lib/trpc';

const ProductGrid = ({ title }: { title: string }) => {
  const { data, isLoading, error } = trpc.products.list.useQuery({ limit: 10 });

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error loading products</Text>;
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.product}>
      <Image source={{ uri: item.images[0] }} style={styles.image} />
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.price}>{item.price} ر.س</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>
      <FlatList
        data={data?.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  product: {
    flex: 1,
    margin: 8,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ProductGrid;
