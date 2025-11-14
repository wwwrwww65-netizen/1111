import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { BannerSectionData } from '@/types/home';

interface BannerSectionProps {
  data: BannerSectionData;
  onPress?: (link: BannerSectionData['link']) => void;
}

/**
 * BannerSection component displays a full-width banner image with optional link.
 * Used in HomeScreen to show promotional banners or featured content.
 */
export function BannerSection({ data, onPress }: BannerSectionProps) {
  const handlePress = () => {
    if (data.link && onPress) {
      onPress(data.link);
    }
  };

  const containerStyle = [
    styles.container,
    data.backgroundColor ? { backgroundColor: data.backgroundColor } : null,
  ];

  return (
    <TouchableOpacity 
      style={containerStyle} 
      onPress={handlePress}
      disabled={!data.link}
    >
      <Image 
        source={{ uri: data.imageUrl }} 
        style={styles.image}
        resizeMode="cover"
      />
      {data.title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{data.title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
