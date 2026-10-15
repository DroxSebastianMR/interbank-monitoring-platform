import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import { HomeStack } from "@/src/application/navigation/stacks/HomeStack";
import { AccountsScreen } from "@/src/modules/accounts/screens/AccountsScreen";
import { PaymentsScreen } from "@/src/modules/payments/screens/PaymentsScreen";
import { ProfileScreen } from "@/src/modules/profile/screens/ProfileScreen";
import { QrPaymentScreen } from "@/src/modules/qr-payments/screens/QrPaymentScreen";
import { CustomTabBar } from "@/src/modules/system/ui/navigation/CustomTabBar";

export type TabParamList = {
  Home: undefined;
  Accounts: undefined;
  QrPayment: undefined;
  Payments: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Accounts" component={AccountsScreen} />
      <Tab.Screen name="QrPayment" component={QrPaymentScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
