import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Modal, TextInput, Image } from 'react-native';
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import LottieView from 'lottie-react-native';
import useTheme from '../hooks/useTheme';
import Colors from '../constants/Colors';

export default function SettingScreen() {
  const db = getFirestore();
  const navigation = useNavigation();

  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const styles = createStyles(isDarkMode);

  const [selectedTags, setSelectedTags] = useState([]);

  const tags = ['Bug', 'Feedback', 'UI/UX', 'Report', 'Suggestion'];

  const toggleTag = (tag) => {
    setSelectedTags((prevSelected) => {
      if (prevSelected.includes(tag)) {
        if (prevSelected.length === 1) {
          Toast.show({
            type: 'error',
            text1: 'Minimum Tag Limit',
            text2: 'At least one tag must be selected.',
            position: 'top',
          });
          return prevSelected;
        }
        return prevSelected.filter(t => t !== tag);
      } else {
        if (prevSelected.length >= 3) {
          Toast.show({
            type: 'error',
            text1: 'Tag Limit Exceeded',
            text2: 'You can only select up to 3 tags.',
            position: 'top',
          });
          return prevSelected;
        }
        return [...prevSelected, tag];
      }
    });
  };

  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdatingProfilePic, setIsUpdatingProfilePic] = useState(false);
  const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackBody, setFeedbackBody] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storage = getStorage();
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || 'User');
          setUserId(auth.currentUser.uid);
          setEmail(auth.currentUser.email);
  
          if (data.profilePicture) {
            try {
              const profilePicUrl = await getDownloadURL(ref(storage, data.profilePicture));
              setProfileImage(profilePicUrl);
            } catch (error) {
              const fallbackUrl = await getDownloadURL(ref(storage, 'default_profile.jpg'));
              setProfileImage(fallbackUrl);
            }
          } else {
            const fallbackUrl = await getDownloadURL(ref(storage, 'default_profile.jpg'));
            setProfileImage(fallbackUrl);
          }
        } else {
          console.log("User document does not exist.");
        }
      } catch (error) {
        console.log("Error fetching user data:", error.message);
      }
    };
  
    fetchUserData();
  }, []);
  
  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  
    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;
      await uploadImageToStorage(selectedImage);
    }
  };
  
  const uploadImageToStorage = async (imageUri) => {
    setIsUpdatingProfilePic(true);
    const storage = getStorage();
    const imageRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
  
    const response = await fetch(imageUri);
    const blob = await response.blob();
  
    try {
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      await updateProfileImage(downloadURL);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error uploading image',
        text2: error.message,
        position: 'top'
      });
    } finally {
      setIsUpdatingProfilePic(false);
    }
  };
  
  const updateProfileImage = async (downloadURL) => {
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { profilePicture: downloadURL });
      setProfileImage(downloadURL);
      Toast.show({
        type: 'success',
        text1: 'Profile picture updated!',
        position: 'top'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error updating profile picture',
        text2: error.message,
        position: 'top'
      });
    }
  };
  

  const handleFeedbackSubmit = async () => {
    if (selectedTags.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Tag Required',
        text2: 'Please select at least one tag.',
        position: 'top',
      });
      return;
    }
  
    try {
      await addDoc(collection(db, 'feedback'), {
        userId,
        username,
        email,
        title: feedbackTitle,
        body: feedbackBody,
        tags: selectedTags,
        timestamp: new Date(),
      });
  
      Toast.show({
        type: 'success',
        text1: 'Feedback submitted',
        position: 'top',
      });
  
      setFeedbackTitle('');
      setFeedbackBody('');
      setSelectedTags([]);
      setFeedbackModalVisible(false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error submitting feedback',
        text2: error.message,
        position: 'top',
      });
    }
  };
  

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully',
        position: 'top'
      });
      navigation.navigate('Login');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error logging out',
        text2: error.message,
        position: 'top'
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.userInfo}>
          <View style={styles.profileImageContainer}>
            {profileImage && (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            )}
            <Pressable style={styles.changeIcon} onPress={handleImagePick}>
              <MaterialIcons name="edit" size={20} color="white" />
            </Pressable>
          </View>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.userId}>ID: {userId}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
            {isUpdatingProfilePic && (
          <View style={styles.overlay}>
            <LottieView
              source={require('../assets/animations/gps_loading_animation.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
        )}
        <View style={styles.optionsContainer}>
          <Pressable style={styles.option}onPress={() => Alert.alert(
    "Reset Password",
    "You need to log out to reset your password. Do you want to continue?",
    [
      { text: "Cancel", onPress: () => null, style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await handleLogout();
          navigation.navigate("ResetPassword");
        }
      }
    ]
  )}>
            <Text style={styles.optionText}>Change Password</Text>
            <MaterialIcons name="lock-outline" size={24} color={isDarkMode ? 'white' : 'black'} />
          </Pressable>

          <Pressable style={styles.option} onPress={() => setFeedbackModalVisible(true)}>
            <Text style={styles.optionText}>Send Feedback</Text>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={isDarkMode ? 'white' : 'black'} />
          </Pressable>

          <Pressable style={[styles.logoutBtn, styles.option, ]} onPress={() => Alert.alert("Sign Out", "Are you sure you want to log out?", [
            { text: "Cancel", onPress: () => null, style: "cancel" },
            { text: "YES", onPress: handleLogout }
          ])}>
            <Text style={styles.optionText}>Log Out</Text>
            <Ionicons name="exit-outline" size={24} color='red' />
          </Pressable>
        </View>


        
      </ScrollView>

      <View style={styles.floatingNavBar}>
        <Pressable style={styles.navButton} onPress={() => navigation.navigate('HomeScreen')}>
          <Ionicons name="home-outline" size={30} color='white' />
        </Pressable>
        <Pressable style={styles.addButton} onPress={() => navigation.navigate('AddPet')}>
          <MaterialIcons name="add" size={32} color='white'/>
        </Pressable>
        <Pressable style={styles.navButton} onPress={() => navigation.navigate('SettingScreen')}>
          <Ionicons name="settings-outline" size={30} color='white' />
        </Pressable>
      </View>
        
      <Modal visible={isFeedbackModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Feedback</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={isDarkMode ? 'white' : 'black'}
              value={feedbackTitle}
              onChangeText={setFeedbackTitle}
            />
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <Pressable
                    key={tag}
                    style={[
                      styles.tagButton,
                      selectedTags.includes(tag) && styles.selectedTagButton
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTags.includes(tag) && styles.selectedTagText
                      ]}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your feedback here..."
              placeholderTextColor={isDarkMode ? 'white' : 'black'}
              value={feedbackBody}
              onChangeText={setFeedbackBody}
              multiline={true}
              numberOfLines={4}
            />
            <Pressable style={styles.submitButton} onPress={handleFeedbackSubmit}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setFeedbackModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? Colors.DARK_MODE_BACKGROUND : Colors.LIGHT_MODE_BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 100,
  },
  userInfo: {
    paddingTop: 100,
    paddingBottom: 50,
    backgroundColor: Colors.SECONDARY_COLOR,
    borderBottomLeftRadius: 160,
    borderBottomRightRadius: 160,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,

  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changeIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userId: {
    fontSize: 12,
    color: '#ddd',
  },
  email: {
    fontSize: 12,
    color: '#ccc',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  lottie: {
    width: 150,
    height: 150,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: isDarkMode ? '#3a6073' : '#ccc',
  },
  logoutBtn: {
    marginTop: 50,
  },
  optionText: {
    fontSize: 18,
    color: isDarkMode ? 'white' : 'black',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: isDarkMode ? '#16222a' : 'white',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: isDarkMode ? 'white' : 'black',
  },
  tagsScroll: {
    maxHeight: 40,
    marginVertical: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
  },
  tagButton: {
    backgroundColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  selectedTagButton: {
    backgroundColor: '#4CAF50',
  },
  tagText: {
    color: isDarkMode ? '#333' : '#000',
  },
  selectedTagText: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#3a6073' : '#ccc',
    borderRadius: 5,
    padding: 10,
    color: isDarkMode ? 'white' : 'black',
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 10,
  },
  cancelButtonText: {
    color: isDarkMode ? '#dbdbdb' : '#16222a',
  },
});
