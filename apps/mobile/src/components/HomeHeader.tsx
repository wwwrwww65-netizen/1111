import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const HomeHeader = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text>Menu</Text>
        <Text>Jeeey</Text>
        <Text>Cart</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  innerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
});

export default HomeHeader;
