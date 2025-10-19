import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import EmptyCart from '../components/EmptyCart';
import CartHeader from '../components/CartHeader';
import CartFooter from '../components/CartFooter';
import CartItem from '../components/CartItem';
import { trpc } from '../lib/trpc';

const CartScreen = () => {
  const { data, isLoading, error } = trpc.cart.get.useQuery();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error loading cart</Text>;
  }

  const items = data?.items || [];

  return (
    <View style={styles.container}>
      <CartHeader itemCount={items.length} />
      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <FlatList
          data={items}
          renderItem={({ item }) => <CartItem item={item} />}
          keyExtractor={(item) => item.id}
        />
      )}
      {items.length > 0 && <CartFooter />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CartScreen;
