import { StatusBar } from "expo-status-bar";
import React, { ReactNode } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InterbankBrand } from "@/src/modules/auth/components/InterbankBrand";

export function AuthScaffold({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-[#009b3a]" edges={["top", "left", "right"]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-7 pb-8 pt-7">
              <InterbankBrand />
            </View>
            <View className="flex-1 rounded-t-[34px] bg-[#f7f9f8] px-6 pb-10 pt-8">
              <View className="w-full max-w-md self-center">{children}</View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
