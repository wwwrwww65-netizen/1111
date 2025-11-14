import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { GridSectionData } from '@/types/home';

interface GridSectionProps {
  data: GridSectionData;
  onItemPress?: (link: NonNullable<GridSectionData['items'][0]['link']>) => void;
}

/**
 * GridSection component displays items in a grid layout.
 * Used for category browsing or featured collections.
 */
export function GridSection({ data, onItemPress }: GridSectionProps) {
  const columns = data.columns || 2;
  
  const renderItem = ({ item }: { item: GridSectionData['items'][0] }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { width: `${100 / columns}%` }]}
      onPress={() => item.link && onItemPress?.(item.link)}
      disabled={!item.link}
    >
      <View style={styles.itemContent}>
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.itemImage}
          resizeMode="cover"
        />
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.subtitle && (
          <Text style={styles.itemSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{data.title}</Text>
      <FlatList
        data={data.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        scrollEnabled={false}
        contentContainerStyle={styles.gridContent}
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
  gridContent: {
    paddingHorizontal: 8,
  },
  itemContainer: {
    padding: 8,
  },
  itemContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  itemName: {
    padding: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  itemSubtitle: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    fontSize: 12,
    color: '#666',
  },
});
