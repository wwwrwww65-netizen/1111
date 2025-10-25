import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRemoteConfig } from '../remote-config';
import { resolveLink } from '../lib/nav';

export default function HomeScreen({ navigation }: any) {
  const { home, tokens } = useRemoteConfig();
  const width = Dimensions.get('window').width;
  const [modal, setModal] = React.useState<{ visible: boolean; content?: any }>({ visible: false });

  function onPressLink(link?: string) {
    const dest = resolveLink(link);
    if (!dest) return;
    if (dest.params) navigation.navigate(dest.screen, dest.params);
    else navigation.navigate(dest.screen);
  }

  return (
    <FlashList
      data={home.sections}
      estimatedItemSize={200}
      renderItem={({ item }) => {
        if (item.type === 'banner') {
          return (
            <TouchableOpacity onPress={() => onPressLink((item as any).link)}>
              <Image
                source={{ uri: (item as any).imageUrl }}
                style={{ width, height: Math.round(width * 0.42), backgroundColor: tokens.colors.background }}
                contentFit="cover"
              />
            </TouchableOpacity>
          );
        }
        if (item.type === 'carousel') {
          const it = item as any;
          return (
            <View style={{ paddingVertical: 12 }}>
              {it.title ? <Text style={{ fontSize: 18, fontWeight: '700', paddingHorizontal: 12 }}>{it.title}</Text> : null}
              <FlashList
                horizontal
                data={it.items}
                estimatedItemSize={140}
                renderItem={({ item: ci }) => (
                  <TouchableOpacity onPress={() => onPressLink(ci.link)} style={{ marginHorizontal: 8 }}>
                    <Image source={{ uri: ci.imageUrl }} style={{ width: 140, height: 180, borderRadius: 10, backgroundColor: '#f2f2f2' }} contentFit="cover" />
                  </TouchableOpacity>
                )}
              />
            </View>
          );
        }
        if (item.type === 'grid') {
          const gi = item as any;
          const col = 2;
          const cardW = Math.floor((width - 12 * 2 - 8) / col);
          return (
            <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              {gi.title ? <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{gi.title}</Text> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {gi.items?.map((p: any, idx: number) => (
                  <TouchableOpacity key={idx} onPress={() => setModal({ visible: true, content: { type: 'quickView', id: p.productId } })} style={{ width: cardW }}>
                    <View style={{ width: cardW, height: Math.round(cardW * 1.3), borderRadius: 10, backgroundColor: '#f4f4f5' }} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        }
        return null;
      }}
      ListHeaderComponent={<View style={{ height: 8 }} />}
      ListFooterComponent={<View style={{ height: 24 }} />}
    />
    <Modal visible={modal.visible} transparent animationType="slide" onRequestClose={() => setModal({ visible: false })}>
      <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>معاينة سريعة</Text>
          <TouchableOpacity onPress={() => modal.content?.id && navigation.navigate('Product', { id: modal.content.id })} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8 }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>افتح صفحة المنتج</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModal({ visible: false })} style={{ padding: 12, alignSelf: 'center' }}>
            <Text>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
