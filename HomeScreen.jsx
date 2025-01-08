import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Alert, ScrollView, Modal, BackHandler } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import Colors from '../constants/Colors';
import { auth } from './firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, collection, onSnapshot, query, deleteDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref, getStorage } from 'firebase/storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import useTheme from '../hooks/useTheme';
import LottieView from 'lottie-react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';


export default function HomeScreen() {
  const db = getFirestore();
  const storage = getStorage();
  const [pets, setPets] = useState([]);
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [menuVisibility, setMenuVisibility] = useState({});
  const [selectedPetQR, setSelectedPetQR] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const qrCodeRef = useRef();
  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const styles = createStyles(isDarkMode);

  const navigation = useNavigation();

  const fetchUserInfo = async () => {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      setUsername(userData.username || 'Your Pets');

      const profilePicRef = ref(storage, userData.profilePicture || 'default_profile.jpg');
      const profilePicUrl = await getDownloadURL(profilePicRef);
      setProfilePic(profilePicUrl);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserInfo();
    }, [])
  );

  useEffect(() => {
    const userId = auth.currentUser.uid;
    setIsLoadingPets(true);
    const petsQuery = query(collection(db, 'users', userId, 'pets'));

    const unsubscribe = onSnapshot(petsQuery, (snapshot) => {
      const loadedPets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      loadedPets.sort((a, b) => a.name.localeCompare(b.name));
      setPets(loadedPets);
      setIsLoadingPets(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out?',
        [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'Log Out',
            onPress: () => {
              auth.signOut();
              navigation.navigate('LoginScreen'); // Navigate to the login screen
            },
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
      return true; // Return true to prevent default back behavior
    });

    return () => backHandler.remove(); // Cleanup the listener when component unmounts
  }, []);

  const handleGenerateQR = (pet) => {
    const ownerInfo = `
      Name: ${pet.ownerName}
      Address: ${pet.ownerAddress}
      Email: ${pet.ownerEmail}
      Phone: ${pet.ownerPhone}
    `;
    setSelectedPetQR(ownerInfo);
    setQrModalVisible(true);
  };

  const handleDeletePet = (petIndex) => {
    const petToDelete = pets[petIndex];
    
    Alert.alert(
      "Delete Confirmation",
      `Are you sure you want to delete ${petToDelete.name}?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setPets(pets.filter((_, index) => index !== petIndex));
              const petDocRef = doc(db, 'users', auth.currentUser.uid, 'pets', petToDelete.id);
              await deleteDoc(petDocRef);
              Toast.show({
                type: 'success',
                text1: 'Pet Deleted',
                text2: `${petToDelete.name} has been removed successfully.`,
                position: 'top',
                visibilityTime: 3000,
                autoHide: true,
                topOffset: 30,
                bottomOffset: 40,
              });
            } catch (error) {
              Alert.alert("Error", "Failed to delete pet.");
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  const handleTrackPet = (pet) => {
    navigation.navigate('TrackerPetMap', { pet });
    Toast.show({
      type: 'info',
      text1: 'Tracking Pet',
      text2: `You are now tracking ${pet.name}.`,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 30,
      bottomOffset: 40,
    });
  };

  const handleEditPet = (pet) => {
    navigation.navigate('EditPet', { pet });
  };

  const handleAddPet = () => {
    navigation.navigate('AddPet');
  };

  const handleReportMissing = async (pet) => {
    try {
      const petDocRef = doc(db, 'users', auth.currentUser.uid, 'pets', pet.id);
  
      if (pet.isMissing) {
        await updateDoc(petDocRef, {
          isMissing: false,
          additionalInfo: null,
          lastSeenDate: null,
          lastSeenLocation: null,
        });
        Toast.show({
          type: 'success',
          text1: 'Pet Updated',
          text2: `${pet.name} is no longer marked as missing.`,
          position: 'top',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 30,
          bottomOffset: 40,
        });
      } else {
        navigation.navigate('ReportMissingScreen', { pet });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update the pet status. Please try again.');
      console.error('Error updating pet status:', error);
    }
  };
  
  const handleDownloadQRCode = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'You need to grant media library permissions to download the QR code.');
        return;
      }

      const uri = await captureRef(qrCodeRef, {
        format: 'png',
        quality: 1,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Download', asset, false);
  
      Alert.alert('Download Successful', 'QR Code saved to your gallery.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save QR Code. Please try again.');
      console.error(error);
    }
  };
  

  const handleToggleMenu = (petId) => {
    setMenuVisibility((prevState) => {
      const isCurrentlyVisible = prevState[petId];
      const newState = Object.keys(prevState).reduce((acc, id) => {
        acc[id] = false;
        return acc;
      }, {});

      return {
        ...newState,
        [petId]: !isCurrentlyVisible,
      };
    });
  };

  const handleScreenPress = () => {
    setMenuVisibility({});
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={handleScreenPress}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{username}</Text>
          {profilePic && (
            <Image source={{ uri: profilePic }} style={styles.profilePic} />
          )}
        </View>

        {isLoadingPets ? (
          <View style={styles.overlay}>
            <LottieView
              source={require('../assets/animations/gps_loading_animation.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
        ) : (
          pets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pets added yet. Tap the + button to add a pet.</Text>
            </View>
          ) : (
            <ScrollView>
              <View style={styles.cardsContainer}>
                {pets.map((pet) => (
                  <Pressable key={pet.id} onPress={() => handleScreenPress()} style={styles.petCard}>
                    <View style={styles.petInfo}>
                    {pet.isMissing && (
                      <View style={styles.missingBadge}>
                        <Text style={styles.missingText}>Missing!</Text>
                      </View>
                    )}
                      <Image source={{ uri: pet.profilePic || 'path/to/default_pet_image.png' }} style={styles.petImage} />
                      <Text style={styles.petName}>{pet.name}</Text>
                      <View style={styles.petDetails}>
                        <View style={styles.leftCol}>
                          <Text style={styles.petSpecies}>Species: {pet.species}</Text>
                          <Text style={styles.petBreed}>Breed: {pet.breed}</Text>
                        </View>
                        <View style={styles.rightCol}>
                          <Text style={styles.petGender}>Gender: {pet.gender}</Text>
                          <Text style={styles.petAge}>Age: {pet.age}</Text>
                        </View>
                      </View>
                    </View>

                    <Pressable style={styles.menuToggle} onPress={() => handleToggleMenu(pet.id)}>
                      <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? '#ffffff' : '#16222a'} />
                    </Pressable>
                    {menuVisibility[pet.id] && (
                      <View style={styles.menuContainer}>
                        <Pressable
                          style={styles.menuItem}
                          onPress={() => {
                            handleTrackPet(pet);
                            setMenuVisibility({});
                          }}
                        >
                          <MaterialIcons name="location-pin" size={20} color="#FFB703" />
                          <Text style={styles.menuText}>Track Pet</Text>
                        </Pressable>
                        <Pressable
                          style={styles.menuItem}
                          onPress={() => {
                            handleEditPet(pet);
                            setMenuVisibility({});
                          }}
                        >
                          <MaterialIcons name="edit" size={20} color="#FFB703" />
                          <Text style={styles.menuText}>Edit Pet</Text>
                        </Pressable>
                        <Pressable
                          style={styles.menuItem}
                          onPress={() => {
                            navigation.navigate('LocationHistory', { pet });
                            setMenuVisibility({});
                          }}
                        >
                          <MaterialIcons name="history" size={20} color="#FFB703" />
                          <Text style={styles.menuText}>Location History</Text>
                        </Pressable>
                        <Pressable
                          style={styles.menuItem}
                          onPress={() => {
                            handleGenerateQR(pet);
                            setMenuVisibility({});
                          }}
                        >
                          <MaterialIcons name="qr-code" size={20} color="#FFB703" />
                          <Text style={styles.menuText}>Generate QR</Text>
                        </Pressable>
                        <Pressable
                          style={styles.menuItem}
                          onPress={() => {
                            handleReportMissing(pet);
                            setMenuVisibility({});
                          }}
                        >
                          <MaterialIcons name="report" size={20} color="#FFB703" />
                          <Text style={styles.menuText}>
                            {pet.isMissing ? 'Unmark Missing' : 'Report Missing'}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={styles.menuItem}
                          onPress={() => {
                            handleDeletePet(pets.indexOf(pet));
                            setMenuVisibility({});
                          }}
                        >
                          <MaterialIcons name="delete" size={20} color="#FFB703" />
                          <Text style={styles.menuText}>Delete</Text>
                        </Pressable>
                      </View>
                    )}

                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )
        )}

        <Modal visible={qrModalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View ref={qrCodeRef} style={{padding: 10, backgroundColor: 'white' }}>
                  <QRCode value={selectedPetQR || ''} size={200} />
              </View>
              <Pressable style={styles.downloadButton} onPress={handleDownloadQRCode}>
                <Text style={styles.downloadText}>Download QR Code</Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={() => setQrModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>
          </View>
        </Modal>


        <View style={styles.floatingNavBar}>
          <Pressable style={styles.navButton} onPress={() => navigation.navigate('HomeScreen')}>
            <Ionicons name="home-outline" size={30} color='white' />
          </Pressable>
          <Pressable style={styles.addButton} onPress={handleAddPet}>
            <MaterialIcons name="add" size={32} color="white" />
          </Pressable>
          <Pressable style={styles.navButton} onPress={() => navigation.navigate('SettingScreen')}>
            <Ionicons name="settings-outline" size={30} color='white' />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? Colors.DARK_MODE_BACKGROUND : Colors.LIGHT_MODE_BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.SECONDARY_COLOR,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 40,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cardsContainer: {
    marginVertical: 10,
    paddingBottom: 90,
    marginHorizontal: 10,
    backgroundColor: 'transparent',
  },
  petCard: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: isDarkMode ? Colors.PRIMARY_COLOR : Colors.SUB_BTN_COLOR,
    borderRadius: 10,
    borderTopLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 20,
    gap: 10,
    width: '100%',
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity:  0.20,
    shadowRadius: 5.62,
    elevation: 8,
  },
  petInfo: {
    flex: 1,
  },
  petImage: {
    height: 140,
    borderRadius: 10,
    borderTopLeftRadius: 35,
    borderWidth: 3,
    borderColor: isDarkMode ? Colors.TERTIARY_COLOR : '#FFB703',
  },
  petDetails: {
    flexDirection: 'row',
  },
  leftCol: {
    flex: 1,
  },
  rightCol: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDarkMode ? '#ffffff' : '#16222a'
  },
  petSpecies: {
    fontSize: 14,
    color: isDarkMode ? '#dbdbdb' : '#16222a',
    borderLeftWidth: 2,
    borderColor: '#FFB703',
    paddingLeft: 8,
    marginBottom: 10,
  },
  petBreed: {
    fontSize: 14,
    color: isDarkMode ? '#dbdbdb' : '#16222a',
    borderColor: '#FFB703',
    borderLeftWidth: 2,
    paddingLeft: 8,
  },
  petGender: {
    fontSize: 14,
    color: isDarkMode ? '#dbdbdb' : '#16222a',
    borderColor: '#FFB703',
    borderLeftWidth: 2,
    paddingLeft: 8,
    marginBottom: 10,
  },
  petAge: {
    fontSize: 14,
    color: isDarkMode ? '#dbdbdb' : '#16222a',
    borderColor: '#FFB703',
    borderLeftWidth: 2,
    paddingLeft: 8,
  },
  menuToggle: {
    backgroundColor: Colors.MAIN_BTN_COLOR,
    borderRadius: 50,
    height: 35,
    width: 35,
    position: 'absolute',
    top: 3,
    right: 3,
    alignItems: 'center',
    justifyContent:'center',
  },
  menuContainer: {
    backgroundColor: isDarkMode ? '#333' : '#fff',
    borderColor: '#FFB703',
    borderWidth: 3,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    position: 'absolute',
    right: 0,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  menuText: {
    marginLeft: 8,
    fontSize: 16,
    color: isDarkMode ? '#FFB703' : '#16222a',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  actionButton: {
    backgroundColor: isDarkMode ? '#49768c' : '#4A628A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginBottom: 10,
    height: 40,
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    color: isDarkMode ? Colors.DARK_MODE_SUBTEXT : Colors.LIGHT_MODE_SUBTEXT,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
  },
  lottie: {
    width: 100,
    height: 100,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'relative',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: 'black',
    marginTop: 10,
    width: 200,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  downloadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: -15,
    right: -15,
    backgroundColor: '#FFB703',
    borderRadius: 50,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingNavBar: {
    position: 'absolute',
    bottom: 20,
    left: 80,
    right: 80,
    height: 60,
    backgroundColor: Colors.SECONDARY_COLOR,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: 10,
    padding: 14,
    elevation: 5,
  },
  addButton: {
    backgroundColor: Colors.MAIN_BTN_COLOR,
    borderRadius: 35,
    marginTop: -40,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF6F61',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    zIndex: 1,
  },
  
  missingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  }

});
