import { LogOut, UserRound } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/modules/auth/context/AuthProvider";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <SafeAreaView className="flex-1 bg-background px-6" edges={["top"]}>
      <View className="mt-12 items-center">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-white">
          <UserRound color="#009B3A" size={40} />
        </View>
        <Text className="mt-5 text-2xl font-bold text-textPrimary">
          {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
            "Cliente"}
        </Text>
        <Text className="mt-2 text-textSecondary">{user?.email}</Text>
        <Pressable
          onPress={() => void logout()}
          className="mt-10 flex-row items-center gap-2 rounded-full border border-primary px-6 py-3"
        >
          <LogOut color="#009B3A" size={18} />
          <Text className="font-semibold text-primary">Cerrar sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
