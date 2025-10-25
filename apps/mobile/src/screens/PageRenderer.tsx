import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRemoteConfig } from '../remote-config';
import { trpc } from '../trpc';

export default function PageRenderer({ route, navigation }: any) {
  const { path } = route.params;
  const { pages } = useRemoteConfig();
  const def = pages[path];

  const [query, setQuery] = React.useState('');
  const results = trpc.search.searchProducts.useQuery({ query, page: 1, limit: 20 }, { enabled: false });

  function handleAction(action?: string) {
    if (action === 'openLogin') {
      navigation.navigate('account');
    }
  }

  if (!def) return <View style={{ padding: 16 }}><Text>لا توجد صفحة</Text></View>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {def.blocks.map((b, i) => {
        if (b.type === 'heading') return <Text key={i} style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{b.text}</Text>;
        if (b.type === 'text') return <Text key={i} style={{ marginBottom: 8 }}>{b.text}</Text>;
        if (b.type === 'button') return (
          <TouchableOpacity key={i} onPress={() => handleAction(b.props?.action)} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8, marginVertical: 6 }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>{b.text || 'زر'}</Text>
          </TouchableOpacity>
        );
        if (b.type === 'searchBar') return (
          <View key={i} style={{ marginVertical: 8 }}>
            <TextInput placeholder="ابحث" value={query} onChangeText={setQuery} onSubmitEditing={() => results.refetch()} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8 }} />
          </View>
        );
        if (b.type === 'searchResults') return (
          <View key={i}>
            {(results.data?.products || []).map((p: any) => (
              <View key={p.id} style={{ paddingVertical: 8 }}>
                <Text>{p.name}</Text>
              </View>
            ))}
          </View>
        );
        if (b.type === 'addressForm') return (
          <View key={i} style={{ gap: 8 }}>
            <Text>نموذج عنوان (قابل للتوسيع لاحقاً)</Text>
          </View>
        );
        return null;
      })}
    </View>
  );
}
