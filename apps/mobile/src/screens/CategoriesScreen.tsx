import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import CategoriesHeader from '../components/CategoriesHeader';
import CategoriesSidebar from '../components/CategoriesSidebar';
import CategoryGrid from '../components/CategoryGrid';

const CategoriesScreen = () => {
  return (
    <View style={styles.container}>
      <CategoriesHeader />
      <View style={styles.layout}>
        <View style={styles.sidebar}>
          <CategoriesSidebar />
        </View>
        <ScrollView style={styles.mainContent}>
          <CategoryGrid title="مختارات من أجلك" />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 120,
    backgroundColor: '#f3f4f6',
  },
  mainContent: {
    flex: 1,
  },
});

export default CategoriesScreen;
