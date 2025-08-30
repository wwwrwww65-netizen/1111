import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert, FlatList, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={ProductsScreen} options={{ title: 'المنتجات' }} />
            <Stack.Screen name="Product" component={ProductScreen} options={{ title: 'المنتج' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'السلة' }} />
          </Stack.Navigator>
        </NavigationContainer>
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
          <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }} onPress={() => (global as any).nav?.navigate('Product', { id: item.id })}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
function ProductScreen({ route }: any) {
  const { id } = route.params;
  const { data, isLoading, error } = trpc.products.getById.useQuery({ id });
  const addItem = trpc.cart.addItem.useMutation();
  return (
    <View style={styles.container}>
      {isLoading && <Text>Loading...</Text>}
      {error && <Text>Error</Text>}
      {data && (
        <>
          <Text style={styles.text}>{data.name}</Text>
          <Text>{data.description}</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>${data.price}</Text>
          <TouchableOpacity style={{ marginTop: 12, padding: 12, backgroundColor: '#000' }} onPress={async () => { await addItem.mutateAsync({ productId: id, quantity: 1 }); (global as any).nav?.navigate('Cart'); }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>أضف إلى السلة</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

function CartScreen() {
  const { data, isLoading, error } = trpc.cart.getCart.useQuery();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>السلة</Text>
      {isLoading && <Text>Loading...</Text>}
      {error && <Text>Error</Text>}
      <FlatList
        style={{ marginTop: 16, width: '100%' }}
        data={data?.cart?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text>{item.product.name} x {item.quantity}</Text>
          </View>
        )}
      />
    </View>
  );
}
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
