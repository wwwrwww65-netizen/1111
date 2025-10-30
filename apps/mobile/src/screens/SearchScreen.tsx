import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { trpc } from '../trpc';

export default function SearchScreen({ navigation, route }: any) {
  const [q, setQ] = React.useState('');
  const [categoryId, setCategoryId] = React.useState(route?.params?.categoryId || undefined);
  const [showFilters, setShowFilters] = React.useState(false);

  const suggestions = trpc.search.getSearchSuggestions.useQuery({ query: q || 'aa' }, { enabled: q.length >= 2 });
  const filters = trpc.search.getSearchFilters.useQuery();
  const results = trpc.search.searchProducts.useQuery({ query: q || undefined, categoryId, page: 1, limit: 20 }, { keepPreviousData: true });

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <TextInput placeholder="ابحث عن منتج" value={q} onChangeText={setQ} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
        <TouchableOpacity onPress={() => results.refetch()} style={{ backgroundColor: '#000', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>بحث</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={{ padding: 10 }}>
          <Text>فلاتر</Text>
        </TouchableOpacity>
      </View>
      {showFilters && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: '700', marginBottom: 4 }}>التصنيفات</Text>
          <FlatList
            horizontal
            data={filters.data?.categories || []}
            keyExtractor={(c: any) => c.id}
            renderItem={({ item }: any) => (
              <TouchableOpacity onPress={() => setCategoryId(item.id)} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f4f4f5', borderRadius: 16, marginEnd: 6 }}>
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      <FlatList
        data={results.data?.products || []}
        keyExtractor={(p: any) => p.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Product', { id: item.id })} style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      {q.length >= 2 && suggestions.data?.products?.length ? (
        <View style={{ paddingTop: 8 }}>
          <Text style={{ fontWeight: '700' }}>اقتراحات</Text>
          {suggestions.data.products.map((p: any) => (
            <TouchableOpacity key={p.id} onPress={() => navigation.navigate('Product', { id: p.id })}>
              <Text>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}
