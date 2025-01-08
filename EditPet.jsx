import React, { useState } from 'react';
import { View } from 'react-native';
import PetForm from '../components/PetForm';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from './firebaseConfig';
import Toast from 'react-native-toast-message';
import useTheme from '../hooks/useTheme';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function EditPet() {
  const route = useRoute();
  const { pet } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const navigation = useNavigation();

  const handleEditPet = async (formData) => {
    const { petName, species, breed, gender, age, profilePic, imageName } = formData;
    setIsLoading(true);

    try {
      let imageUrl = pet.profilePic;

      if (profilePic && profilePic !== pet.profilePic) {
        const storage = getStorage();
        const response = await fetch(profilePic);
        const blob = await response.blob();

        const storageRef = ref(storage, `petImages/${auth.currentUser.uid}/${imageName}`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      const db = getFirestore();
      const petRef = doc(db, 'users', auth.currentUser.uid, 'pets', pet.id); // Correct path to the pet document

      await updateDoc(petRef, {
        name: petName,
        species,
        breed,
        gender,
        age,
        profilePic: imageUrl,
      });

      Toast.show({
        type: 'success',
        text1: 'Pet Updated',
        text2: `${petName} was updated successfully!`,
        position: 'top',
        visibilityTime: 3000,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error updating pet:', error);
      alert("Error updating pet: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PetForm
        initialData={pet} 
        onSubmit={handleEditPet}
        isLoading={isLoading}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}
