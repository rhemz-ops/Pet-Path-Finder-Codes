import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { auth } from './firebaseConfig';
import Colors from '../constants/Colors';
import useTheme from '../hooks/useTheme';
import LottieView from 'lottie-react-native';

export default function LocationHistory() {
  const route = useRoute();
  const navigation = useNavigation();
  const { pet } = route.params;

  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(null);

  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const styles = createStyles(isDarkMode);

  useEffect(() => {
    const fetchLocationHistory = async () => {
      try {
        const db = getFirestore();
        const userId = auth.currentUser.uid;
        const petRef = doc(db, 'users', userId, 'pets', pet.id);
        const locationHistoryRef = collection(petRef, 'locationHistory');

        const querySnapshot = await getDocs(locationHistoryRef);
        const historyData = [];

        querySnapshot.forEach((doc) => {
          historyData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        historyData.sort((a, b) => b.timestamp - a.timestamp);
        setLocationHistory(historyData);

        if (historyData.length > 0) {
          const latitudes = historyData.map((loc) => loc.latitude);
          const longitudes = historyData.map((loc) => loc.longitude);

          const minLat = Math.min(...latitudes);
          const maxLat = Math.max(...latitudes);
          const minLon = Math.min(...longitudes);
          const maxLon = Math.max(...longitudes);

          const latitudeDelta = (maxLat - minLat) + 0.01;
          const longitudeDelta = (maxLon - minLon) + 0.01;

          setRegion({
            latitude: (maxLat + minLat) / 2,
            longitude: (maxLon + minLon) / 2, 
            latitudeDelta,
            longitudeDelta,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching location history:', error);
      }
    };

    fetchLocationHistory();
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const deleteHistoryItem = (id) => {
    Alert.alert(
      'Delete History',
      'Are you sure you want to delete this location history entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const db = getFirestore();
              const userId = auth.currentUser.uid;
              const petRef = doc(db, 'users', userId, 'pets', pet.id);
              const historyDocRef = doc(petRef, 'locationHistory', id);
  
              await deleteDoc(historyDocRef);
              setLocationHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
            } catch (error) {
              console.error('Error deleting history item:', error);
            }
          },
        },
      ]
    );
  };

  const deleteAllHistory = async () => {
    Alert.alert(
      'Delete All',
      'Are you sure you want to delete all location history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              const db = getFirestore();
              const userId = auth.currentUser.uid;
              const petRef = doc(db, 'users', userId, 'pets', pet.id);
              const locationHistoryRef = collection(petRef, 'locationHistory');

              const querySnapshot = await getDocs(locationHistoryRef);
              const batch = db.batch();

              querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
              });

              await batch.commit();
              setLocationHistory([]);
            } catch (error) {
              console.error('Error deleting all history:', error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/animations/gps_loading_animation.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.loadingText}>Loading location history...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={locationHistory}
      style={styles.container}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.mapContainer}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.header}>Location History for {pet.name}</Text>
          </View>
          {locationHistory.length > 0 ? (
            <MapView
              style={styles.map}
              initialRegion={region || {
                latitude: locationHistory[0]?.latitude || 0,
                longitude: locationHistory[0]?.longitude || 0,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              {locationHistory.map((location, index) => (
                <Marker
                  key={index}
                  coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                  title={`Location at ${formatTimestamp(location.timestamp)}`}
                  description={`Lat: ${location.latitude}, Lon: ${location.longitude}`}
                  pinColor={index === 0 ? "green" : (index === locationHistory.length - 1 ? "red" : "blue")}
                />
              ))}
              {locationHistory.length > 1 && (
                <Polyline
                  coordinates={locationHistory.map(location => ({
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }))}
                  strokeWidth={3}
                />
              )}
            </MapView>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.historyItem}>
          <View style={styles.historyDetails}>
            <Text style={styles.historyText}>Latitude: {item.latitude}</Text>
            <Text style={styles.historyText}>Longitude: {item.longitude}</Text>
            <Text style={styles.historyText}>Time: {formatTimestamp(item.timestamp)}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteHistoryItem(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No location history available for {pet.name}.</Text>
        </View>
      }
      ListFooterComponent={
        locationHistory.length > 0 && (
          <TouchableOpacity onPress={deleteAllHistory} style={styles.deleteAllButton}>
            <Ionicons name="trash" size={24} color="white" />
            <Text style={styles.deleteAllText}>Delete All History</Text>
          </TouchableOpacity>
        )
      }
    />
  );
}

const createStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#16222a' : '#f2f1eb',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 350,
  },
  emptyText: {
    fontSize: 16,
    color: isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT,
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#29A19C',
    paddingTop: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    padding: 10,
    paddingTop: 0,
    marginVertical: 8,
    borderBottomColor: isDarkMode ? Colors.DARK_MODE_SUBTEXT : Colors.LIGHT_MODE_SUBTEXT,
    borderBottomWidth: 2,
  },
  historyText: {
    fontSize: 16,
    color: isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    fontSize: 16,
    color: isDarkMode ? 'white' : 'black',
    marginTop: 10,
  },
  map: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  deleteButton: {
    backgroundColor: isDarkMode ? '#334652' : '#e6e1d3',
    borderRadius: 50,
    padding: 6,
  },
  deleteAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    margin: 16,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  deleteAllText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  }
});
