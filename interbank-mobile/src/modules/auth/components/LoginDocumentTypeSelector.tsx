import { Check, ChevronDown } from "lucide-react-native";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import React, { useCallback, useMemo, useState } from "react";
import {
  Animated,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  disabled: boolean;
  reduceTransparency?: boolean;
}

// El contrato de autenticación solo admite DNI. Agregar otro documento requiere
// actualizar primero la validación del backend y del formulario.
export function LoginDocumentTypeSelector({
  disabled,
  reduceTransparency = false,
}: Props) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [sheetOffset] = useState(() => new Animated.Value(420));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const useNativeGlass =
    Platform.OS === "ios" &&
    !reduceTransparency &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetOffset, {
        toValue: 420,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [backdropOpacity, sheetOffset]);

  const show = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetOffset, {
        toValue: 0,
        duration: 230,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, sheetOffset]);
  const dragHandle = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) =>
          sheetOffset.setValue(Math.max(0, gesture.dy)),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 72 || gesture.vy > 0.9) {
            close();
          } else {
            Animated.spring(sheetOffset, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [close, sheetOffset],
  );

  const open = () => {
    if (disabled) return;
    Keyboard.dismiss();
    sheetOffset.setValue(420);
    backdropOpacity.setValue(0);
    setVisible(true);
  };

  return (
    <>
      <Pressable
        onPress={open}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Tipo de documento: DNI"
        accessibilityHint="Abre el selector de documento"
        accessibilityState={{ disabled }}
        style={styles.trigger}
      >
        <Text style={styles.triggerText}>DNI</Text>
        <ChevronDown color="#008D3B" size={18} />
      </Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        onRequestClose={close}
        onShow={show}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Animated.View
            pointerEvents="none"
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityLabel="Cerrar selector de documento"
          />
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) + 16 },
              { transform: [{ translateY: sheetOffset }] },
            ]}
          >
            <View style={styles.handleArea} {...dragHandle.panHandlers}>
              <View style={styles.handle} />
            </View>
            <Text style={styles.title}>Tipo de documento</Text>
            <Text style={styles.description}>
              Selecciona el documento con el que ingresarás.
            </Text>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="DNI, seleccionado"
              style={styles.option}
            >
              {useNativeGlass ? (
                <GlassView
                  pointerEvents="none"
                  colorScheme="light"
                  glassEffectStyle="regular"
                  tintColor="#DDF4E7"
                  style={styles.glass}
                />
              ) : (
                <View pointerEvents="none" style={styles.optionFallback} />
              )}
              <Text style={styles.optionText}>DNI</Text>
              <View style={styles.selectedIcon}>
                <Check color="#FFFFFF" size={16} strokeWidth={2.5} />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 94,
    flexShrink: 0,
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DCE6DF",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  triggerText: { fontSize: 16, fontWeight: "600", color: "#17291F" },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(7,29,18,0.24)",
  },
  sheet: {
    backgroundColor: "#FAFCFB",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D7E2DB",
    alignSelf: "center",
  },
  handleArea: { minHeight: 32, justifyContent: "flex-start" },
  title: { fontSize: 22, fontWeight: "600", color: "#17291F" },
  description: { fontSize: 14, lineHeight: 20, color: "#62736A", marginTop: 8 },
  option: {
    minHeight: 58,
    marginTop: 24,
    paddingHorizontal: 18,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E7F6EC",
    borderWidth: 1,
    borderColor: "#BFE5CD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  glass: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
  },
  optionFallback: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    backgroundColor: "#E7F6EC",
  },
  optionText: { fontSize: 16, fontWeight: "600", color: "#17291F" },
  selectedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#009B4D",
    alignItems: "center",
    justifyContent: "center",
  },
});
