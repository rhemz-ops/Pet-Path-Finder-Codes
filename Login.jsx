import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, updateDoc } from "firebase/firestore";
import { auth } from "./firebaseConfig";
import Colors from '../constants/Colors';
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useTheme from '../hooks/useTheme';
import AuthForm from '../components/AuthForm';
import AuthButton from '../components/AuthButton';
import { validateEmail } from '../components/validation';
import Toast from 'react-native-toast-message';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();
  const db = getFirestore();

  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const styles = createStyles(isDarkMode);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setEmail('');
      setPassword('');
    });

    return unsubscribe;
  }, [navigation]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
  
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
  
    if (password.trim() === "") {
      setError("Please enter your password.");
      setLoading(false);
      return;
    }

    await AsyncStorage.setItem('isLoggedIn', 'true')
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (!user.emailVerified) {
        setError("Please verify your email before logging in.");
        setLoading(false);
        return;
      }
  
      const userDocRef = doc(db, "users", user.uid);

      await updateDoc(userDocRef, {
        lastLogin: new Date().toISOString(),
      });

      const loginHistoryRef = collection(userDocRef, "loginHistory");
      await addDoc(loginHistoryRef, {
        timestamp: new Date().toISOString(),
      });
  
      setLoading(false);
      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: `Hello, ${user.email}. You have successfully logged in!`,
        position: 'top',
      });
      navigation.navigate('HomeScreen'); 
  
    } catch (err) {
      setLoading(false);
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={32} color={isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT} />
      </Pressable>
      <Text style={styles.title}>Log in to your account</Text>

      <Image 
        source={require('../assets/images/cat_login.png')}
        style={styles.image}
      />

      <AuthForm
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        showPassword={showPassword}
        togglePasswordVisibility={() => setShowPassword(prev => !prev)}
        isDarkMode={isDarkMode}
        error={error}
      />

      <Pressable onPress={() => router.push('/ResetPassword')} style={styles.forgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </Pressable>

      {loading ? (
        <LoadingSpinner visible={loading} />
      ) : (
        <AuthButton 
          title="Log In" 
          onPress={handleLogin} 
          loading={loading} 
          disabled={loading} 
        />
      )}
    </View>
  );
}

const createStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 100,
    backgroundColor: isDarkMode ? Colors.DARK_MODE_BACKGROUND : Colors.LIGHT_MODE_BACKGROUND,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 10,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    fontWeight: 'bold',
    color: isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  forgotPassword: {
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    color: isDarkMode ? 'white' : 'black',
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 40,
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: isDarkMode ? Colors.DARK_MODE_SUBTEXT : Colors.LIGHT_MODE_SUBTEXT,
  },
  googleBtn: {
    padding: 12,
    backgroundColor: Colors.SECONDARY_COLOR,
    width: '100%',
    borderRadius: 12,
  },
  googleBtnText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.DARK_MODE_TEXT,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  lottie: {
    width: 150,
    height: 150,
  },
});
