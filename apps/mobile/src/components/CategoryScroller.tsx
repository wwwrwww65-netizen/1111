import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { trpc } from '../lib/trpc';

const CategoryScroller = () => {
  const { data, isLoading, error } = trpc.products.listCategories.useQuery({ limit: 15 });

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error loading categories</Text>;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {data?.items.map((category, index) => (
          <TouchableOpacity key={index} style={styles.category}>
            <Image source={{ uri: category.image || `https://csspicker.dev/api/image/?q=${encodeURIComponent(category.name||'fashion')}&image_type=photo` }} style={styles.image} />
            <Text style={styles.name}>{category.name}</Text>
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
  category: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  image: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    color: '#333',
  },
});

export default CategoryScroller;
