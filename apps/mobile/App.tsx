import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from './src/lib/trpc';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import SearchScreen from './src/screens/SearchScreen';
import CartScreen from './src/screens/CartScreen';
import AccountScreen from './src/screens/AccountScreen';

const Tab = createBottomTabNavigator();

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api',
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Tab.Navigator>
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'الرئيسية' }} />
            <Tab.Screen name="Categories" component={CategoriesScreen} options={{ title: 'الفئات' }} />
            <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'جديد' }} />
            <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'الحقيبة' }} />
            <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'حسابي' }} />
          </Tab.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </trpc.Provider>
  );
};

export default App;
