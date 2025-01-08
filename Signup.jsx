import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Colors from "../constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import useTheme from "../hooks/useTheme";
import AuthForm from "../components/AuthForm";
import AuthButton from "../components/AuthButton";
import LoadingSpinner from "../components/LoadingSpinner";
import TermsAndConditions from "../components/TermsAndConditions";

export default function Signup() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsVisible, setTermsVisible] = useState(false);

    const theme = useTheme();
    const isDarkMode = theme === "dark";
    const styles = createStyles(isDarkMode);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
    const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

    const handleSignUp = async () => {
        if (!termsAccepted) {
            setTermsVisible(true); // Show terms if not accepted
            return;
        }

        setError("");

        if (username.trim() === "") {
            setError("Please enter a username.");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!validatePassword(password)) {
            setError("Please use correct password combination.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const db = getFirestore();
            const storage = getStorage();

            const defaultProfileRef = ref(storage, "default_profile.jpg");
            const defaultProfileUrl = await getDownloadURL(defaultProfileRef);

            await setDoc(doc(db, "users", user.uid), {
                username,
                email: user.email,
                createdAt: new Date(),
                profilePicture: defaultProfileUrl,
            });

            await sendEmailVerification(user);

            Toast.show({
                type: "success",
                text1: "Verification Sent!",
                text2: `Please check your inbox to verify your email before logging in.`,
                position: "top",
            });

            router.push("/Login");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.container}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons
                            name="arrow-back"
                            size={32}
                            color={isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT}
                        />
                    </Pressable>
                    <Text style={styles.title}>Create an account</Text>

                    <Image source={require("../assets/images/dog_signup.png")} style={styles.image} />

                    <AuthForm
                        email={email}
                        onEmailChange={setEmail}
                        username={username}
                        onUsernameChange={setUsername}
                        password={password}
                        onPasswordChange={(text) => setPassword(text)}
                        showPassword={showPassword}
                        togglePasswordVisibility={() => setShowPassword(!showPassword)}
                        isDarkMode={isDarkMode}
                        confirmPassword={confirmPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        error={error}
                        showConfirmPasswordField={true}
                    />

                    <Pressable onPress={() => setTermsVisible(true)}>
                        <Text style={styles.termsLink}>Read Terms and Conditions</Text>
                    </Pressable>

                    {loading ? (
                        <LoadingSpinner visible={loading} />
                    ) : (
                        <AuthButton title="Sign Up" onPress={handleSignUp} loading={loading} disabled={loading} />
                    )}

                    <Pressable onPress={() => router.push("/Login")}>
                        <Text style={styles.loginRedirect}>Already have an account? Log in</Text>
                    </Pressable>

                    <TermsAndConditions
                        visible={termsVisible}
                        onClose={() => setTermsVisible(false)}
                        onAccept={() => {
                            setTermsAccepted(true); // Set terms as accepted
                            setTermsVisible(false); // Close modal
                        }}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (isDarkMode) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingHorizontal: 16,
            paddingTop: 100,
            backgroundColor: isDarkMode ? Colors.DARK_MODE_BACKGROUND : Colors.LIGHT_MODE_BACKGROUND,
        },
        backButton: {
            position: "absolute",
            top: 50,
            left: 10,
        },
        title: {
            fontSize: 24,
            textAlign: "center",
            fontWeight: "bold",
            color: isDarkMode ? Colors.DARK_MODE_TEXT : Colors.LIGHT_MODE_TEXT,
        },
        image: {
            width: 200,
            height: 200,
            resizeMode: "contain",
            alignSelf: "center",
            marginBottom: 16,
        },
        termsLink: {
            textAlign: "center",
            marginTop: 20,
            color: isDarkMode ? Colors.DARK_MODE_SUBTEXT : Colors.LIGHT_MODE_SUBTEXT,
            textDecorationLine: "underline",
        },
        loginRedirect: {
            textAlign: "center",
            marginTop: 20,
            color: isDarkMode ? "white" : "black",
        },
    });
