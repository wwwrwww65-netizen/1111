import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const banners = [
  {
    src: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=60',
    alt: 'عرض تخفيضات',
  },
  {
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop',
    alt: 'عروض جديدة',
  },
  {
    src: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1600&auto=format&fit=crop',
    alt: 'ترندات الموسم',
  },
];

const HomeBanner = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        {banners.map((banner, index) => (
          <View key={index} style={styles.slide}>
            <Image source={{ uri: banner.src }} style={styles.image} />
            <View style={styles.overlay}>
              <Text style={styles.title}>خصم يصل حتى 90%</Text>
              <Text style={styles.subtitle}>احتفالنا الأكبر على الإطلاق</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
  },
  slide: {
    width,
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
});

export default HomeBanner;
