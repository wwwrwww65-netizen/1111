import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { CarouselSectionData } from '@/types/home';

interface CarouselSectionProps {
  data: CarouselSectionData;
  onItemPress?: (link: NonNullable<CarouselSectionData['items'][0]['link']>) => void;
}

/**
 * CarouselSection component displays a horizontal scrolling list of items.
 * Commonly used for product recommendations, new arrivals, or special offers.
 */
export function CarouselSection({ data, onItemPress }: CarouselSectionProps) {
  const renderItem = ({ item }: { item: CarouselSectionData['items'][0] }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => item.link && onItemPress?.(item.link)}
      disabled={!item.link}
    >
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.itemImage}
        resizeMode="cover"
      />
      <Text style={styles.itemName} numberOfLines={2}>
        {item.name}
      </Text>
      {item.price !== undefined && (
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{data.title}</Text>
      <FlatList
        horizontal
        data={data.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  itemContainer: {
    width: 150,
    marginRight: 12,
  },
  itemImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  itemPrice: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
