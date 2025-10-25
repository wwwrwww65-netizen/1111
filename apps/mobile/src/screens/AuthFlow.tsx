import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getApiBase } from '../lib/api';

export default function AuthFlow({ navigation }: any) {
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [stage, setStage] = React.useState<'request'|'verify'>('request');

  async function requestOtp() {
    try {
      const res = await fetch(getApiBase()+ '/auth/otp/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, channel: 'whatsapp' }) });
      const j = await res.json(); if (!res.ok || !j.ok) throw new Error(j.error||'otp_request_failed');
      setStage('verify');
    } catch (e: any) { Alert.alert('خطأ', e?.message||'فشل'); }
  }
  async function verifyOtp() {
    try {
      const res = await fetch(getApiBase()+ '/auth/otp/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, code }) });
      const j = await res.json(); if (!res.ok || !j.ok) throw new Error(j.error||'otp_verify_failed');
      const token = j.token; await SecureStore.setItemAsync('shop_token', token);
      navigation.navigate('Root');
    } catch (e: any) { Alert.alert('خطأ', e?.message||'فشل'); }
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>تسجيل دخول برمز OTP</Text>
      <TextInput placeholder="رقم الهاتف بصيغة +967..." value={phone} onChangeText={setPhone} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginBottom: 12 }} />
      {stage==='verify' && <TextInput placeholder="الرمز" value={code} onChangeText={setCode} style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginBottom: 12 }} />}
      {stage==='request' ? (
        <TouchableOpacity onPress={requestOtp} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>أرسل الرمز</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={verifyOtp} style={{ backgroundColor: '#000', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>تحقق وسجّل الدخول</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
