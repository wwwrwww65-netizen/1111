import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import HomeHeader from '../components/HomeHeader';
import HomeBanner from '../components/HomeBanner';
import CategoryScroller from '../components/CategoryScroller';
import ProductScroller from '../components/ProductScroller';
import ProductGrid from '../components/ProductGrid';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <HomeHeader />
      <ScrollView>
        <HomeBanner />
        <CategoryScroller />
        <ProductScroller title="عروض كبرى" />
        <ProductScroller title="أهم الترندات" />
        <ProductGrid title="من أجلك" />
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
