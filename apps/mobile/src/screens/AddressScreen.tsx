import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { trpc } from '../trpc';

export default function AddressScreen() {
  const me = trpc.auth.me.useQuery(undefined, { retry: 0 });
  const update = trpc.auth.updateProfile.useMutation();

  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [street, setStreet] = React.useState('');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [country, setCountry] = React.useState('');

  async function save() {
    try {
      await update.mutateAsync({ name: fullName || undefined, phone: phone || undefined, address: { street, city, state, postalCode, country } });
      Alert.alert('تم الحفظ');
    } catch(e: any) { Alert.alert('خطأ', e?.message || 'فشل الحفظ'); }
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>العنوان</Text>
      <TextInput placeholder="الاسم الكامل" value={fullName} onChangeText={setFullName} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginTop: 8 }} />
      <TextInput placeholder="الهاتف" value={phone} onChangeText={setPhone} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginTop: 8 }} />
      <TextInput placeholder="الشارع" value={street} onChangeText={setStreet} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginTop: 8 }} />
      <TextInput placeholder="المدينة" value={city} onChangeText={setCity} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginTop: 8 }} />
      <TextInput placeholder="المنطقة" value={state} onChangeText={setState} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginTop: 8 }} />
      <TextInput placeholder="الرمز البريدي" value={postalCode} onChangeText={setPostalCode} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginTop: 8 }} />
      <TextInput placeholder="الدولة" value={country} onChangeText={setCountry} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginTop: 8 }} />
      <TouchableOpacity onPress={save} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8, marginTop: 12 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>حفظ</Text>
      </TouchableOpacity>
    </View>
  );
}
