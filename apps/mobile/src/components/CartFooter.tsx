import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const CartFooter = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.total}>المجموع: 0 ر.س</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>الانتقال إلى الدفع</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
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

export default CartFooter;
