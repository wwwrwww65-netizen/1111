import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Alert, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './src/trpc';

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [httpBatchLink({ url: process.env.EXPO_PUBLIC_TRPC_URL || 'http://localhost:4000/trpc' })],
});

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Root" component={RootTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Product" component={ProductScreen} options={{ title: 'المنتج' }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'الدفع' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function RootTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="Home" component={ProductsScreen} options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="Search" component={SearchScreen} options={{ title: 'البحث' }} />
      <Tabs.Screen name="Categories" component={CategoriesScreen} options={{ title: 'التصنيفات' }} />
      <Tabs.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'المفضلة' }} />
      <Tabs.Screen name="Account" component={AccountScreen} options={{ title: 'حسابي' }} />
      <Tabs.Screen name="Cart" component={CartScreen} options={{ title: 'السلة' }} />
    </Tabs.Navigator>
  );
}

function ProductsScreen({ navigation }: any) {
  const { data, isLoading, error } = trpc.search.searchProducts.useQuery({ page: 1, limit: 10 });
  return (
    <View style={styles.container}>
      <Text style={styles.title}>المنتجات</Text>
      {isLoading && <Text>Loading...</Text>}
      {error && <Text>Error</Text>}
      <FlatList
        style={{ marginTop: 16, width: '100%' }}
        data={data?.products ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('Product', { id: item.id })}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <StatusBar style="auto" />
    </View>
  );
}

function ProductScreen({ route, navigation }: any) {
  const { id } = route.params;
  const { data, isLoading, error } = trpc.products.getById.useQuery({ id });
  const addItem = trpc.cart.addItem.useMutation();
  return (
    <View style={styles.container}>
      {isLoading && <Text>Loading...</Text>}
      {error && <Text>Error</Text>}
      {data && (
        <>
          <Text style={styles.title}>{data.name}</Text>
          <Text>{data.description}</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>${data.price}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={async () => {
              await addItem.mutateAsync({ productId: id, quantity: 1 });
              navigation.navigate('Cart');
            }}
          >
            <Text style={styles.primaryBtnText}>أضف إلى السلة</Text>
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
      <Text style={styles.title}>السلة</Text>
      {isLoading && <Text>Loading...</Text>}
      {error && <Text>Error</Text>}
      <FlatList
        style={{ marginTop: 16, width: '100%' }}
        data={data?.cart?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>
              {item.product.name} x {item.quantity}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

function SearchScreen({ navigation }: any) {
  const [q, setQ] = React.useState('');
  const { data, isLoading, error } = trpc.search.searchProducts.useQuery(
    { page: 1, limit: 10, q },
    { enabled: !!q }
  );
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ابحث</Text>
      <TextInput
        placeholder="ابحث عن منتج..."
        value={q}
        onChangeText={setQ}
        style={styles.input}
      />
      {isLoading && <Text>Loading...</Text>}
      {error && <Text>Error</Text>}
      <FlatList
        style={{ marginTop: 16, width: '100%' }}
        data={data?.products ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('Product', { id: item.id })}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function CategoriesScreen({ navigation }: any) {
  const categories = [
    { id: 'dresses', name: 'فساتين' },
    { id: 'shoes', name: 'أحذية' },
    { id: 'bags', name: 'حقائب' },
    { id: 'accessories', name: 'إكسسوارات' },
  ];
  return (
    <View style={styles.container}>
      <Text style={styles.title}>التصنيفات</Text>
      <FlatList
        style={{ marginTop: 16, width: '100%' }}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('Search', { cat: item.id })}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function WishlistScreen() {
  const { data, isLoading, error } = trpc.wishlist.get.useQuery();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>المفضلة</Text>
      {isLoading && <Text>Loading...</Text>}
      {error && <Text>Error</Text>}
      <FlatList
        style={{ marginTop: 16, width: '100%' }}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>{item.product.name}</Text>
          </View>
        )}
      />
    </View>
  );
}

function AccountScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>حسابي</Text>
      <Text>تسجيل الدخول/الملف الشخصي لاحقاً</Text>
    </View>
  );
}

function CheckoutScreen() {
  const checkout = trpc.checkout.start.useMutation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>الدفع</Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={async () => {
          await checkout.mutateAsync();
          Alert.alert('تم الطلب بنجاح');
        }}
      >
        <Text style={styles.primaryBtnText}>تأكيد الطلب</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  primaryBtn: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#000',
    borderRadius: 6,
    minWidth: 180,
  },
  primaryBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
