import { Stack } from "expo-router";
import Toast from 'react-native-toast-message'

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: "none"}}>
        <Stack.Screen name="WelcomeScreen" />
        <Stack.Screen name="index" />
        <Stack.Screen name="Signup" />
        <Stack.Screen name="Login" />
        <Stack.Screen name="ResetPassword" />
        <Stack.Screen name="HomeScreen" />
        <Stack.Screen name="AddPet" />
        <Stack.Screen name="EditPet" />
        <Stack.Screen name="ReportMissingScreen" />
        <Stack.Screen name="LocationHistory" />
        <Stack.Screen name="TrackerPetMap" />
        <Stack.Screen name="SettingScreen" />
      </Stack>
      <Toast />
    </>
  );
}
