import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, BackHandler, ActivityIndicator, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import useTheme from '../hooks/useTheme';
import { getFirestore, collection, addDoc, getDocs, doc } from 'firebase/firestore';
import { auth } from './firebaseConfig';

export default function TrackerPetMap() {
  const route = useRoute();
  const navigation = useNavigation();
  const { pet } = route.params;

  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const styles = createStyles(isDarkMode);

  const [location, setLocation] = useState({
    latitude: 14.6037,
    longitude: 121.3084,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [batteryPercentage, setBatteryPercentage] = useState(100); 
  const [isDeviceOn, setIsDeviceOn] = useState(true); 
  const mapRef = useRef(null);
  const watchRef = useRef(null);

  const lastSavedTimestamp = useRef(0);
  const lastSavedLocation = useRef({ latitude: 0, longitude: 0 });
  const timeThreshold = 30000;
  const distanceThreshold = 1;

  const handleBackPress = () => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to go back?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => navigation.goBack() }
      ],
      { cancelable: true }
    );
    return true;
  };

  const saveLocationToHistory = async (location) => {
    try {
      const db = getFirestore();
      const userId = auth.currentUser.uid;
      const petRef = doc(db, 'users', userId, 'pets', pet.id); 
      const locationHistoryRef = collection(petRef, 'locationHistory');
      await addDoc(locationHistoryRef, {
        timestamp: Date.now(),
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error("Error saving location to history:", error);
    }
  };

  const haversineDistance = (loc1, loc2) => {
    const toRadians = (deg) => deg * (Math.PI / 180);
    const R = 6371e3;
    const lat1 = toRadians(loc1.latitude);
    const lat2 = toRadians(loc2.latitude);
    const deltaLat = toRadians(loc2.latitude - loc1.latitude);
    const deltaLon = toRadians(loc2.longitude - loc1.longitude);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const fetchFirebaseLocation = async () => {
    try {
      const db = getFirestore();
      const locationsRef = collection(db, 'location');
      const querySnapshot = await getDocs(locationsRef);
  
      if (!querySnapshot.empty) {
        const firstDoc = querySnapshot.docs[0].data(); // Get the first document
        console.log("Fetched location data:", firstDoc);
  
        if (firstDoc.latitude && firstDoc.longitude) {
          const newLocation = {
            latitude: firstDoc.latitude,
            longitude: firstDoc.longitude,
          };
          setLocation(newLocation);
          mapRef.current?.animateToRegion({
            ...newLocation,
            latitudeDelta: 0.0005,
            longitudeDelta: 0.0005,
          }, 1000);
          saveLocationToHistory(newLocation);
          setLoading(false);
        } else {
          setErrorMsg("No valid location data available");
          setLoading(false);
        }
      } else {
        console.log("No documents found in location collection");
        setErrorMsg("No location data available");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setErrorMsg("Error fetching location from Firebase");
      setLoading(false);
    }
  };
  
  

  useEffect(() => {
    fetchFirebaseLocation();
    const interval = setInterval(fetchFirebaseLocation, 30000); // Fetch new location every 30 seconds

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      clearInterval(interval);
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color='white'/>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pet.name}'s Location</Text>
      </View>
      
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Ionicons name="battery-full" size={20} color={Colors.SECONDARY_COLOR} />
          <Text style={styles.statusText}>{batteryPercentage}%</Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name={isDeviceOn ? "power" : "power-off"} size={20} color={isDeviceOn ? 'green' : 'red'} />
          <Text style={styles.statusText}>{isDeviceOn ? 'On' : 'Off'}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusText}>
            Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
          </Text>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY_COLOR} />
          <Text>Loading map and location...</Text>
        </View>
      ) : (
        <>
          {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

          <MapView
            ref={mapRef}
            style={styles.map}
            region={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.0005,
              longitudeDelta: 0.0005,
            }}
            showsUserLocation={false} // No longer tracking the device location
            followsUserLocation={false} // Disable auto-follow user
          >
            <Marker coordinate={location}>
              <View style={styles.markerContainer}>
                <Image source={{ uri: pet.profilePic }} style={styles.markerImage} />
              </View>
            </Marker>
          </MapView>
        </>
      )}
    </View>
  );
};

const createStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? Colors.DARK_MODE_BACKGROUND : Colors.LIGHT_MODE_BACKGROUND,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: isDarkMode ? 'white' : 'black',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: isDarkMode ? Colors.LIGHT_MODE_TEXT : Colors.DARK_MODE_TEXT,
    marginLeft: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.SECONDARY_COLOR,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    margin: 10,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: Colors.SECONDARY_COLOR,
  },
});
