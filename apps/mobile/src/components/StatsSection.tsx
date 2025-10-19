import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatsSection = () => {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.statNumber}>0</Text>
        <Text style={styles.statLabel}>بانتظار الشحن</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statNumber}>0</Text>
        <Text style={styles.statLabel}>نقاط</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statNumber}>0</Text>
        <Text style={styles.statLabel}>عربات</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
});

export default StatsSection;
