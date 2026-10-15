import { TabNavigator } from "@/src/application/navigation/TabNavigator";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { TransferMode } from "@/src/domain/transfers/transfer.types";
import { TransferTypeScreen } from "@/src/modules/transfers/screens/TransferTypeScreen";
import { TransferDestinationScreen } from "@/src/modules/transfers/screens/TransferDestinationScreen";

export type AppStackParamList = {
  MainTabs: undefined;
  Transfers: undefined;
  TransferDestination: { mode: TransferMode };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Transfers" component={TransferTypeScreen} />
      <Stack.Screen
        name="TransferDestination"
        component={TransferDestinationScreen}
      />
    </Stack.Navigator>
  );
};
