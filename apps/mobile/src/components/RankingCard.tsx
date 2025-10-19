import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const RankingCard = ({ title, items }: { title: string; items: any[] }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity key={index} style={styles.item}>
          <Text style={styles.rank}>{index + 1}</Text>
          <Image source={{ uri: item.img }} style={styles.image} />
          <View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSubtitle}>{item.sub}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0edea',
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    width: 28,
    textAlign: 'center',
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#777',
  },
});

export default RankingCard;
