import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const SheinClubCard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SHEIN CLUB</Text>
      <Text style={styles.subtitle}>انضم للحصول على المزايا 3+</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>انضم الآن</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f97316',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SheinClubCard;
