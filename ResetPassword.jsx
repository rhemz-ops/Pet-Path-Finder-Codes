import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';
import useTheme from '../hooks/useTheme';
import FloatingLabelInput from '../components/FloatingLabelInput';
import AuthButton from '../components/AuthButton'; 

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const theme = useTheme();
  const isDarkMode = theme === 'dark';
  const styles = createStyles(isDarkMode);

  const handleResetPassword = async () => {
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("Failed to send reset email. Please check your email address.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      <Image
        source={require('../assets/images/dog_inu.png')}
        style={styles.image}
      />
      <FloatingLabelInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        isDarkMode={isDarkMode}
        autoCapitalize="none"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>Check your email for a password reset link!</Text> : null}


      <AuthButton
        title="Send Reset Email"
        onPress={handleResetPassword}
        loading={loading}
        disabled={loading}
      />

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back to Login</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: isDarkMode ? Colors.DARK_MODE_BACKGROUND : Colors.LIGHT_MODE_BACKGROUND,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
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
  error: {
    color: Colors.DELETE_ERROR_COLOR,
    marginBottom: 12,
    textAlign: 'center',
  },
  success: {
    color: Colors.SUCCESS_COLOR,
    marginBottom: 12,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: isDarkMode ? 'white' : 'black',
    fontWeight: 'bold',
  },
});
