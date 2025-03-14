import React from 'react';
import { View, Text, Button } from 'react-native';
import SearchPanel from '../components/SearchPanel';
import ImageCarousel from '../components/ImageCarousel';

export default function HomeScreen({ navigation }) {
  return (
    // <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <View>
      <ImageCarousel />
      <SearchPanel />
    </View>
    //   <Text>🏠 Home Screen</Text>
    //   <Button title="Go to Details" onPress={() => navigation.navigate('Details')} />
    // </View>
  );
}
