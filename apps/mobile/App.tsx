import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { Button } from '@repo/ui';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Mobile App!</Text>
      <Button onPress={() => Alert.alert("Button Pressed!")}>
        Click Me
      </Button>
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
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  }
});
