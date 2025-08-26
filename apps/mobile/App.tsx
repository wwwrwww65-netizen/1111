import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Button } from '@repo/ui';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

const trpc = createTRPCReact<any>();
const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({ url: process.env.EXPO_PUBLIC_TRPC_URL || 'http://localhost:4000/trpc' }),
  ],
});

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ProductsScreen />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function ProductsScreen() {
  const { data, isLoading, error } = trpc.search.searchProducts.useQuery({ page: 1, limit: 10 });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Mobile App!</Text>
      <Button onPress={() => Alert.alert("Button Pressed!")}>Click Me</Button>
      {isLoading && <Text>Loading...</Text>}
      {error && <Text>Error</Text>}
      <FlatList
        style={{ marginTop: 16, width: '100%' }}
        data={data?.products ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  }
});
