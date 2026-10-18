import { Modal, View } from "react-native";

export const GlobalModal = ({ children }: { children: React.ReactNode }) => {
  return (
    <Modal transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center">
        {children}
      </View>
    </Modal>
  );
};
