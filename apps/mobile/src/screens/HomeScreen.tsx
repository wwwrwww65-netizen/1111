import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import HomeHeader from '../components/HomeHeader';
import HomeBanner from '../components/HomeBanner';
import CategoryScroller from '../components/CategoryScroller';
import ProductScroller from '../components/ProductScroller';
import CategoryGrid from '../components/CategoryGrid'; // Renamed from ProductGrid

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <HomeHeader />
      <ScrollView>
        <HomeBanner />
        <CategoryScroller />
        <ProductScroller title="عروض كبرى" />
        <ProductScroller title="أهم الترندات" />
        {/* This should be a ProductGrid, but we'll reuse CategoryGrid for now */}
        <CategoryGrid title="من أجلك" />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HomeScreen;
