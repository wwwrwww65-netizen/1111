import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

export default function ProductOptionsModal({ visible, onClose, onConfirm }: { visible: boolean; onClose: () => void; onConfirm: (opts: any) => void }) {
  const [color, setColor] = React.useState<string|undefined>();
  const [sizeL, setSizeL] = React.useState<string|undefined>();
  const [sizeN, setSizeN] = React.useState<string|undefined>();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>خيارات المنتج</Text>
          <Text>اختر اللون/المقاسات</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <TouchableOpacity onPress={() => setColor('أسود')} style={{ padding: 10, backgroundColor: '#f4f4f5', borderRadius: 8 }}><Text>أسود</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setColor('أبيض')} style={{ padding: 10, backgroundColor: '#f4f4f5', borderRadius: 8 }}><Text>أبيض</Text></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <TouchableOpacity onPress={() => setSizeL('M')} style={{ padding: 10, backgroundColor: '#f4f4f5', borderRadius: 8 }}><Text>M</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setSizeL('L')} style={{ padding: 10, backgroundColor: '#f4f4f5', borderRadius: 8 }}><Text>L</Text></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <TouchableOpacity onPress={() => setSizeN('38')} style={{ padding: 10, backgroundColor: '#f4f4f5', borderRadius: 8 }}><Text>38</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setSizeN('40')} style={{ padding: 10, backgroundColor: '#f4f4f5', borderRadius: 8 }}><Text>40</Text></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => onConfirm({ color, sizeLetters: sizeL, sizeNumbers: sizeN })} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8, marginTop: 16 }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>تأكيد</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ padding: 12, alignSelf: 'center' }}>
            <Text>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
