import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const routesData = [
  { id: '1', title: 'Konkan Darshan', description: 'Explore the scenic Konkan coastline.' },
  { id: '2', title: 'Historical Forts', description: 'Visit majestic forts like Sindhudurg & Vijaydurg.' },
  { id: '3', title: 'Temple Tour', description: 'Spiritual tour across ancient temples.' },
  { id: '4', title: 'Waterfall Trail', description: 'Discover hidden waterfalls in the region.' },
  { id: '5', title: 'Beach Retreats', description: 'Relax at serene Konkan beaches.' },
];

const RoutesList = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        // Handle route click — you can navigate or show details
        // navigation.navigate('RouteDetails', { routeId: item.id });
        console.log('Route selected:', item.title);
      }}
    >
      <View style={styles.cardContent}>
        <Ionicons name="navigate" size={22} color="#1e90ff" style={styles.icon} />
        <View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* <Text style={styles.heading}>Available Routes</Text> */}
      <FlatList
        data={routesData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default RoutesList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 10,
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1e1e',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
});
