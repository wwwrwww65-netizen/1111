import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator } from 'react-native';
import AccountHeader from '../components/AccountHeader';
import SheinClubCard from '../components/SheinClubCard';
import StatsSection from '../components/StatsSection';
import QuickActions from '../components/QuickActions';
import { trpc } from '../lib/trpc';

const AccountScreen = () => {
  const { data, isLoading, error } = trpc.auth.me.useQuery();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error || !data?.user) {
    return (
      <View style={styles.guestContainer}>
        <Text>Please log in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AccountHeader username={data.user.name || 'User'} />
      <ScrollView>
        <SheinClubCard />
        <StatsSection />
        <QuickActions />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AccountScreen;
