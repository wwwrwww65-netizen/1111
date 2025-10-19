import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const AccountHeader = ({ username }: { username: string }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity>
        <Text>الإعدادات</Text>
      </TouchableOpacity>
      <Text style={styles.username}>{username}</Text>
      <View style={{ width: 60 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AccountHeader;
