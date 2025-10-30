import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRemoteConfig } from '../remote-config';
import { trpc } from '../trpc';

export default function CategoriesScreen({ navigation }: any) {
  const { categories } = useRemoteConfig();
  const width = Dimensions.get('window').width;
  const cols = categories.layout.columns;
  const gap = categories.layout.gap;
  const cardW = Math.floor((width - gap * (cols + 1)) / cols);

  const [q, setQ] = React.useState('');
  const { data: catsData } = trpc.search.searchCategories.useQuery({ query: q, includeProducts: false });

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12 }}>
        <TextInput placeholder="ابحث في التصنيفات" value={q} onChangeText={setQ} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10 }} />
      </View>
      <FlashList
        data={catsData?.categories || []}
        estimatedItemSize={cardW}
        numColumns={cols}
        contentContainerStyle={{ paddingHorizontal: gap, paddingBottom: 24 }}
        renderItem={({ item }: any) => (
          <TouchableOpacity onPress={() => navigation.navigate('Search', { categoryId: item.id })} style={{ width: cardW, margin: gap/2 }}>
            <View style={{ height: cardW, backgroundColor: '#f4f4f5', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
