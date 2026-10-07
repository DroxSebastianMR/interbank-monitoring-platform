import { QrCode } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export const ScanButton = ({ onPress }: any) => {
  return (
    <View className="items-center justify-center">
      <TouchableOpacity
        onPress={onPress}
        className="w-[60px] h-[60px] bg-primary rounded-full justify-center items-center -mt-16 shadow-2xl"
        style={{
          elevation: 12,
        }}
      >
        <QrCode color="#fff" size={32} />
      </TouchableOpacity>
    </View>
  );
};
