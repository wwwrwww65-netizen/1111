import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const CartHeader = ({ itemCount }: { itemCount: number }) => {
  return (
    <View style={styles.container}>
      {itemCount > 0 ? (
        <TouchableOpacity>
          <Text>تحديد الكل</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 60 }} />
      )}
      <Text style={styles.title}>سلة التسوق</Text>
      <TouchableOpacity>
        <Text>إغلاق</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartHeader;
