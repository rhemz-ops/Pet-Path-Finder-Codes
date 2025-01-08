import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, updateDoc, getFirestore, Timestamp } from 'firebase/firestore';
import { auth } from './firebaseConfig';
import Toast from 'react-native-toast-message';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import useTheme from '../hooks/useTheme';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ReportMissingScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { pet } = route.params || {};

  const [lastSeenLocation, setLastSeenLocation] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const styles = createStyles(isDarkMode);

  const handleDateChange = (event, date) => {
    setDatePickerVisible(false);
    if (date) {
      const formattedDate = formatDateToMMDDYYYY(date);
      setSelectedDate(formattedDate);
    }
  };

  const handleDateInputChange = (text) => {
    const cleanText = text.replace(/\D/g, '');
    let formattedText = cleanText;
    if (cleanText.length > 2) {
      formattedText = `${cleanText.slice(0, 2)}/${cleanText.slice(2)}`;
    }
    if (cleanText.length > 4) {
      formattedText = `${cleanText.slice(0, 2)}/${cleanText.slice(2, 4)}/${cleanText.slice(4, 8)}`;
    }
    setSelectedDate(formattedText);
  };

  const formatDateToMMDDYYYY = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const parseDateStringToDateObject = (dateString) => {
    const [month, day, year] = dateString.split('/');
    return new Date(year, month - 1, day);
  };

  const handleSubmit = async () => {
    if (!pet || !auth.currentUser) {
      Alert.alert('Error', 'Pet information or user authentication is missing.');
      return;
    }

    if (!lastSeenLocation) {
      Alert.alert('Error', 'Please select a last-seen location on the map.');
      return;
    }

    if (!selectedDate) {
      Alert.alert('Error', 'Please provide the last seen date.');
      return;
    }

    if (!additionalInfo.trim()) {
      Alert.alert('Error', 'Please provide additional information.');
      return;
    }

    Alert.alert(
      'Submit Missing Report',
      'By submitting this report, you agree that this information will be publicly visible to help others locate your pet.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: async () => {
            setLoading(true);
            try {
              const db = getFirestore();
              const petDocRef = doc(db, 'users', auth.currentUser.uid, 'pets', pet.id);

              const lastSeenDate = parseDateStringToDateObject(selectedDate);

              await updateDoc(petDocRef, {
                isMissing: true,
                lastSeenLocation,
                additionalInfo,
                lastSeenDate: Timestamp.fromDate(lastSeenDate),
              });

              Toast.show({
                type: 'success',
                text1: 'Report Submitted',
                text2: `${pet.name} has been reported as missing.`,
              });

              setLoading(false);
              navigation.goBack();
            } catch (error) {
              setLoading(false);
              Alert.alert('Error', 'Failed to submit the missing report.');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLastSeenLocation({ latitude, longitude });
  };

  if (!pet) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: No pet data available.</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      style={styles.container}
      colors={isDarkMode ? ['#1F1D36', '#3a6073'] : ['#ffefba', '#ffffff']}
    >
      <LoadingSpinner visible={loading} />
      <Text style={styles.title}>Report {pet.name} as Missing</Text>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 14.7034,
          longitude: 121.1451,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
      >
        {lastSeenLocation && (
          <Marker coordinate={lastSeenLocation} title="Last seen location" />
        )}
      </MapView>

      {lastSeenLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.infoText}>Latitude: {lastSeenLocation.latitude}</Text>
          <Text style={styles.infoText}>Longitude: {lastSeenLocation.longitude}</Text>
        </View>
      )}

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Additional information (e.g., notable behavior)"
        placeholderTextColor={isDarkMode ? Colors.DARK_MODE_SUBTEXT : Colors.LIGHT_MODE_SUBTEXT}
        value={additionalInfo}
        onChangeText={setAdditionalInfo}
        multiline
      />

      <View style={styles.dateInputContainer}>
        <TextInput
          style={styles.dateInput}
          placeholder="MM/DD/YYYY"
          placeholderTextColor={isDarkMode ? Colors.DARK_MODE_SUBTEXT : Colors.LIGHT_MODE_SUBTEXT}
          value={selectedDate}
          onChangeText={handleDateInputChange}
          keyboardType="numeric"
        />
        <Pressable onPress={() => setDatePickerVisible(true)}>
          <Ionicons name="calendar-outline" size={24} color="#FFB703" />
        </Pressable>
      </View>

      {isDatePickerVisible && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <Pressable
        style={[
          styles.submitButton,
          {
            opacity: lastSeenLocation && selectedDate && additionalInfo.trim() ? 1 : 0.5,
          },
        ]}
        onPress={handleSubmit}
        disabled={!lastSeenLocation || !selectedDate || !additionalInfo.trim()}
      >
        <Text style={styles.submitButtonText}>Submit Report</Text>
      </Pressable>
    </LinearGradient>
  );
}


const createStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT,
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: 350,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.DARK_MODE_SUBTEXT,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 15,
    color: isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT,
    backgroundColor: isDarkMode ? Colors.LIGHT_MODE_SUBTEXT : 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.DARK_MODE_SUBTEXT,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    marginHorizontal: 10,
    backgroundColor: isDarkMode ? Colors.LIGHT_MODE_SUBTEXT : 'white',
  },
  dateInput: {
    flex: 1,
    marginHorizontal: 10,
    color: isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT,
  },
  submitButton: {
    backgroundColor: '#29A19C',
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoText: {
    color: isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT,
  },
  locationInfo: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
});
