import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const EmptyCart = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>عربة التسوق فارغة</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>تسوق الآن</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#8a1538',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default EmptyCart;
