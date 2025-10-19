import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { trpc } from '../lib/trpc';

const CategoryGrid = ({ title }: { title: string }) => {
  const { data, isLoading, error } = trpc.products.listCategories.useQuery({ limit: 30 });

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error loading categories</Text>;
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.category}>
      <Image source={{ uri: item.image || `https://csspicker.dev/api/image/?q=${encodeURIComponent(item.name||'fashion')}&image_type=photo` }} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>
      <FlatList
        data={data?.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
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
    textAlign: 'center',
  },
  category: {
    flex: 1,
    margin: 8,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default CategoryGrid;
