import { View, Text, Image, StyleSheet, Pressable, FlatList, Dimensions } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import useTheme from '../hooks/useTheme';
import PetLottie from '../components/PetLottie'; 

const data = [
  {
    key: '1',
    animation: require('../assets/animations/pet_animation_3.json'), 
    title: 'Track your Pet',
    description: 'Real-time GPS tracking for your pets, keeping them safe and secure.',
  },
  {
    key: '2',
    animation: require('../assets/animations/pet_animation_2.json'),
    title: 'Stay Connected',
    description: 'Stay connected to your pets wherever they go, ensuring their safety.',
  },
  {
    key: '3',
    animation: require('../assets/animations/pet_animation_1.json'),
    title: 'Never Lost, Always Together',
    description: 'Always together, never apart—ensuring you and your pet stay connected, no matter where the adventure leads.',
  },
];

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const styles = createStyles(isDarkMode);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= data.length) {
        nextIndex = 0;
      }
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
        source={ isDarkMode 
          ? require('../assets/images/pet_path_finder_text_dark.png') 
          : require('../assets/images/pet_path_finde_text.png')}
        style={styles.logoImage}
        />
      </View>

      <FlatList
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        ref={flatListRef}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <PetLottie animationSource={item.animation} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
        keyExtractor={(item) => item.key}
      />

      <View style={styles.pagination}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      <View style={styles.textContainer}>
        <Pressable style={styles.createBtn} onPress={() => router.push('/Signup')}>
          <Text style={styles.textBtn}>Create Account</Text>
        </Pressable>
        <Pressable style={styles.loginBtn} onPress={() => router.push('/Login')}>
          <Text style={styles.textBtn}>Log In</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? Colors.DARK_MODE_BACKGROUND : Colors.LIGHT_MODE_BACKGROUND,
    },
    logoContainer: {
      marginTop: 40,
      alignItems: 'center',
    },
    logoImage: {
      width: '80%',
      height: 100,
      textAlign: 'center',
      resizeMode: 'contain',
    },
    slide: {
      width: width,
      marginTop: -50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 10,
      textAlign: 'center',
      color: isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT,
    },
    description: {
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 20,
      color: isDarkMode ? Colors.DARK_MODE_SUBTEXT : Colors.LIGHT_MODE_SUBTEXT,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: 5,
    },
    activeDot: {
      backgroundColor: Colors.TERTIARY_COLOR,
    },
    inactiveDot: {
      backgroundColor: isDarkMode ? Colors.DARK_MODE_SUBTEXT : Colors.LIGHT_MODE_SUBTEXT,
    },
    textContainer: {
      padding: 20,
      alignItems: 'center',
    },
    createBtn: {
      padding: 12,
      marginTop: 40,
      marginBottom: 10,
      backgroundColor: Colors.MAIN_BTN_COLOR,
      width: '100%',
      borderRadius: 50,
    },
    loginBtn: {
      padding: 12,
      backgroundColor: Colors.SUB_BTN_COLOR,
      width: '100%',
      borderRadius: 50,
    },
    textBtn: {
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
  });
