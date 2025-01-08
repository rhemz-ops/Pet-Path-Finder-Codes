import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/WelcomeScreen');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/images/pet_path_finde_text.png')}
        style={[styles.image, { transform: [{ scale: scaleAnim }] }]}
      />
      <LottieView
        source={require('../assets/animations/welcome_animation.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '85%',
    height: 100,
    resizeMode: 'contain',
    zIndex: 1,
  },
  lottie: {
    backgroundColor: 'none',
    marginTop: -30,
    width: 200,
    height: 200,
    zIndex: -1,
  },
});
