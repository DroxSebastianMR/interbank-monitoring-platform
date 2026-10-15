import { Image } from "expo-image";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export function PaymentProviderMark({
  name,
  logoUrl,
  large = false,
}: {
  name: string;
  logoUrl?: string | null;
  large?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <View style={[styles.mark, large && styles.large]}>
      {logoUrl && failedUrl !== logoUrl ? (
        <Image
          source={{ uri: logoUrl }}
          contentFit="contain"
          style={styles.logo}
          onError={() => setFailedUrl(logoUrl)}
          accessibilityLabel={name}
        />
      ) : (
        <Text style={[styles.initials, large && styles.largeInitials]}>
          {name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9EEEB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  large: { width: 64, height: 64, borderRadius: 22 },
  initials: {
    fontSize: 14,
    fontWeight: "700",
    color: "#446752",
    letterSpacing: -0.6,
  },
  largeInitials: { fontSize: 19 },
  logo: { width: "76%", height: "76%" },
});
