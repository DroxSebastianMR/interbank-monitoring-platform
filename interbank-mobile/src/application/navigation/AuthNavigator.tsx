import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "@/src/modules/auth/screens/LoginScreen";
import { DeviceLoginScreen } from "@/src/modules/auth/screens/DeviceLoginScreen";
import { useAuth } from "@/src/modules/auth/context/AuthProvider";

export type AuthStackParamList = {
  Login: undefined;
  DeviceLogin: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { entryMode } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {entryMode === "device-login" ? (
        <Stack.Screen name="DeviceLogin" component={DeviceLoginScreen} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
