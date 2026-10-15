import { ErrorType } from "@/src/modules/system/error/ErrorTypes";
import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  type?: ErrorType;
  onRetry: () => void;
};

export const ErrorFallback = ({ type, onRetry }: Props) => {
  const message = getMessage(type);

  return (
    <View className="flex-1 items-center justify-center px-6 bg-white dark:bg-black">
      <Text className="text-xl font-bold text-black dark:text-white mb-2">
        Algo salió mal
      </Text>

      <Text className="text-center text-gray-600 dark:text-gray-400 mb-6">
        {message}
      </Text>

      <Pressable
        onPress={onRetry}
        className="px-6 py-3 rounded-xl bg-black dark:bg-white"
      >
        <Text className="text-white dark:text-black font-semibold">
          Reintentar
        </Text>
      </Pressable>
    </View>
  );
};

function getMessage(type?: ErrorType) {
  switch (type) {
    case ErrorType.NETWORK:
      return "Problemas de conexión. Verifica tu internet.";
    case ErrorType.AUTH:
      return "Tu sesión expiró. Vuelve a iniciar sesión.";
    default:
      return "Ocurrió un error inesperado.";
  }
}
