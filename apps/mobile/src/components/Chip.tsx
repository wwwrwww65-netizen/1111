import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Chip = ({ text }: { text: string }) => {
  return (
    <TouchableOpacity style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    margin: 4,
  },
  text: {
    fontSize: 14,
  },
});

export default Chip;
