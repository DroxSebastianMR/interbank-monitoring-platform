import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { AppNavigator } from "@/src/application/navigation/AppNavigator";
import { AuthNavigator } from "@/src/application/navigation/AuthNavigator";
import { SplashScreen } from "@/src/application/navigation/SplashScreen";
import { useAuth } from "@/src/modules/auth/context/AuthProvider";

type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { status } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === "checking" && (
          <Stack.Screen name="Splash" component={SplashScreen} />
        )}

        {status === "unauthenticated" && (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}

        {status === "authenticated" && (
          <Stack.Screen name="App" component={AppNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
