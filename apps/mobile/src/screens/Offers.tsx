import React from 'react';
import { View } from 'react-native';
import { useRemoteConfig } from '../remote-config';

export default function Offers() {
  const { offers } = useRemoteConfig();
  // Placeholder wiring; placements can be rendered where needed in Home/PDP
  return <View style={{ display: 'none' }} />;
}
