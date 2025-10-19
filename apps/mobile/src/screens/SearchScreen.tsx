import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, FlatList } from 'react-native';
import SearchBar from '../components/SearchBar';
import Chip from '../components/Chip';
import RankingCard from '../components/RankingCard';
import { trpc } from '../lib/trpc';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const { data, isLoading, error } = trpc.search.products.useQuery({ q: query }, { enabled: !!query });

  const history = ['فساتين', 'أحذية', 'ساعات', 'سماعات'];
  const ranking = {
    title: 'عمليات البحث الشائعة',
    items: [
      { title: 'كلمة 1', sub: '#ترند', img: 'https://picsum.photos/seed/sr1/96/96' },
      { title: 'كلمة 2', sub: '#ترند', img: 'https://picsum.photos/seed/sr2/96/96' },
      { title: 'كلمة 3', sub: '#ترند', img: 'https://picsum.photos/seed/sr3/96/96' },
    ],
  };

  return (
    <View style={styles.container}>
      <SearchBar />
      {isLoading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text>Error searching</Text>
      ) : query && data?.items ? (
        <FlatList
          data={data.items}
          // Render search results here
        />
      ) : (
        <ScrollView>
          <View style={styles.chipContainer}>
            <Text style={styles.sectionTitle}>البحث الأخير</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {history.map((item, index) => (
                <Chip key={index} text={item} />
              ))}
            </ScrollView>
          </View>
          <RankingCard title={ranking.title} items={ranking.items} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chipContainer: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default SearchScreen;
