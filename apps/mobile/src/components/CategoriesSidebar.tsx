import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const sidebarItems = [
  'لأحلامكم فقط',
  'جديد في',
  'تخفيض الأسعار',
  'ملابس نسائية',
  'إلكترونيات',
  'أحذية',
  'الملابس الرجالية',
  'الأطفال',
  'المنزل والمطبخ',
];

const CategoriesSidebar = () => {
  return (
    <ScrollView style={styles.container}>
      {sidebarItems.map((item, index) => (
        <TouchableOpacity key={index} style={styles.item}>
          <Text style={styles.itemText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 14,
  },
});

export default CategoriesSidebar;
