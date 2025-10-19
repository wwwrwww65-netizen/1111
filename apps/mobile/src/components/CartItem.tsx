import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const CartItem = ({ item }: { item: any }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: item.img }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>{item.price} ر.س</Text>
      </View>
      <View style={styles.quantity}>
        <TouchableOpacity>
          <Text>-</Text>
        </TouchableOpacity>
        <Text>{item.qty}</Text>
        <TouchableOpacity>
          <Text>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 14,
    color: '#8a1538',
  },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default CartItem;
