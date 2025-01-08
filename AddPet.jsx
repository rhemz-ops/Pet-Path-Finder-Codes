import React, { useState } from 'react';
import { View } from 'react-native';
import PetForm from '../components/PetForm';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from './firebaseConfig';
import Toast from 'react-native-toast-message';
import useTheme from '../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';

export default function AddPet() {
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const navigation = useNavigation();

  const handleAddPet = async (formData) => {
    const { petName, species, breed, gender, age, profilePic, imageName, ownerName, ownerPhone, ownerEmail, ownerAddress } = formData;
    setIsLoading(true);

    try {
      let imageUrl = null;

      if (profilePic) {
        const storage = getStorage();
        const response = await fetch(profilePic);
        const blob = await response.blob();

        const storageRef = ref(storage, `petImages/${auth.currentUser.uid}/${imageName}`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      const db = getFirestore();
      const petRef = collection(db, 'users', auth.currentUser.uid, 'pets');

      await addDoc(petRef, {
        name: petName,
        species,
        breed,
        gender,
        age,
        profilePic: imageUrl,
        userId: auth.currentUser.uid,
        ownerName,
        ownerAddress,
        ownerEmail,
        ownerPhone
      });

      Toast.show({
        type: 'success',
        text1: 'Pet Added',
        text2: `${petName} was added successfully!`,
        position: 'top',
        visibilityTime: 3000,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error adding pet:', error);
      alert("Error adding pet: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PetForm
        initialData={null}
        onSubmit={handleAddPet}
        isLoading={isLoading}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}
