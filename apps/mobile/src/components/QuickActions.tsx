import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const actions = [
  'المنتجات المحفوظة',
  'تتبع',
  'مركز الشحن',
  'في التحضير',
  'عرض مجاني',
];

const QuickActions = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>الأوامر المحفوظة</Text>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <TouchableOpacity key={index} style={styles.action}>
            <Text style={styles.actionIcon}>Icon</Text>
            <Text style={styles.actionText}>{action}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  title: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  action: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
});

export default QuickActions;
