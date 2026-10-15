import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TabParamList } from "@/src/application/navigation/TabNavigator";
import { PaymentStep } from "@/src/domain/payments/payment.types";
import { useAccessibilityPreferences } from "@/src/shared/hooks/useAccessibilityPreferences";
import { PaymentCatalog } from "@/src/modules/payments/components/PaymentCatalog";
import { PaymentForm } from "@/src/modules/payments/components/PaymentForm";
import { PaymentHomeSections } from "@/src/modules/payments/components/PaymentHomeSections";
import { PaymentScheduleBanner } from "@/src/modules/payments/components/PaymentScheduleBanner";
import { PaymentSearch } from "@/src/modules/payments/components/PaymentSearch";
import { PaymentNotice } from "@/src/modules/payments/components/PaymentPrimitives";
import { usePaymentHome } from "@/src/modules/payments/hooks/usePaymentHome";
import { useServicePayments } from "@/src/modules/payments/hooks/useServicePayments";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function PaymentsScreen() {
  const flow = useServicePayments();
  const navigation = useNavigation<NavigationProp<TabParamList>>();
  const insets = useSafeAreaInsets();
  const { reduceTransparency, reduceMotion } = useAccessibilityPreferences();
  const scroll = useRef<ScrollView>(null);
  const catalog = flow.step === PaymentStep.CATALOG;
  const home = usePaymentHome(catalog);
  const goBack = () => {
    if (flow.busy || flow.uncertain) return;
    if (catalog) navigation.navigate("Home");
    else if (flow.step === PaymentStep.RECEIPT) flow.reset();
    else flow.back();
  };
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [flow.step]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!navigation.isFocused()) return false;
        if (flow.busy || flow.uncertain) return true;
        if (flow.step !== PaymentStep.CATALOG) {
          if (flow.step === PaymentStep.RECEIPT) flow.reset();
          else flow.back();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [flow, navigation]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scroll}
          bounces={false}
          overScrollMode="never"
          alwaysBounceVertical={false}
          contentInsetAdjustmentBehavior="never"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View
            style={[
              styles.headerBackground,
              catalog && styles.catalogHeader,
              { paddingTop: insets.top + 8 },
            ]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[C.green, "#08B94C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.container,
                styles.header,
                catalog && styles.catalogHeading,
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  catalog ? "Volver al inicio" : "Volver al paso anterior"
                }
                accessibilityState={{ disabled: flow.busy || flow.uncertain }}
                disabled={flow.busy || flow.uncertain}
                onPress={goBack}
                activeOpacity={0.8}
              >
                <LiquidGlassSurface
                  intensity={12}
                  tone="neutral"
                  opaque={reduceTransparency}
                  style={styles.back}
                >
                  <View style={styles.foreground}>
                    <ArrowLeft
                      color={reduceTransparency ? C.greenDeep : "#FFFFFF"}
                      size={22}
                      strokeWidth={1.8}
                    />
                  </View>
                </LiquidGlassSurface>
              </TouchableOpacity>
              <Text
                style={[styles.headerTitle, catalog && styles.catalogTitle]}
              >
                {catalog ? "Paga tus Servicios" : "Pago de servicios"}
              </Text>
            </View>
            {catalog ? (
              <View style={[styles.container, styles.search]}>
                <PaymentSearch value={flow.query} onChange={flow.setQuery} />
              </View>
            ) : null}
          </View>
          <View
            style={[
              styles.sheet,
              catalog && styles.catalogSheet,
              { paddingBottom: Math.max(insets.bottom, 16) + 106 },
            ]}
          >
            <View style={[styles.container, styles.content]}>
              {catalog ? (
                <PaymentScheduleBanner
                  opaque={reduceTransparency}
                  reduceMotion={reduceMotion}
                />
              ) : null}
              {!catalog && flow.step !== PaymentStep.RECEIPT ? (
                <View style={styles.stepHeader}>
                  <Text style={styles.stepText}>
                    {flow.step === PaymentStep.REFERENCE
                      ? "Datos del servicio"
                      : "Confirmación"}
                  </Text>
                  <Text style={styles.stepNumber}>
                    {flow.step === PaymentStep.REFERENCE ? "01" : "02"}
                    <Text style={styles.stepCount}> / 02</Text>
                  </Text>
                </View>
              ) : null}
              {catalog ? (
                <PaymentCatalog
                  categories={flow.categories}
                  providers={flow.providers}
                  query={flow.query}
                  category={flow.category}
                  loading={flow.catalogLoading}
                  error={flow.catalogError}
                  disabled={flow.busy}
                  onCategory={flow.setCategory}
                  onSelect={flow.selectProvider}
                  onRetry={flow.reload}
                >
                  <PaymentHomeSections
                    recommended={home.recommended}
                    saved={home.saved}
                    loading={home.loading}
                    error={home.error}
                    disabled={flow.busy}
                    onProvider={flow.selectProvider}
                    onSaved={(item) => void flow.openSaved(item)}
                    onRetry={home.reload}
                  />
                  {flow.error ? (
                    <PaymentNotice
                      title="No pudimos abrir el servicio"
                      description={flow.error}
                    />
                  ) : null}
                </PaymentCatalog>
              ) : (
                <PaymentForm flow={flow} opaque={reduceTransparency} />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FBF9" },
  flex: { flex: 1 },
  container: { width: "100%", maxWidth: 500, alignSelf: "center" },
  headerBackground: {
    backgroundColor: C.green,
    paddingHorizontal: 18,
    paddingBottom: 34,
    overflow: "hidden",
  },
  catalogHeader: {
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingBottom: 59,
  },
  catalogTitle: {
    flex: 0,
    marginTop: 14,
    paddingHorizontal: 6,
    textAlign: "left",
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.5,
  },
  catalogHeading: { flexDirection: "column", alignItems: "flex-start", gap: 0 },
  search: { marginTop: 18, paddingHorizontal: 6 },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 42,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  foreground: { zIndex: 1 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  sheet: {
    flex: 1,
    paddingTop: 25,
    marginTop: -22,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  catalogSheet: {
    marginTop: -32,
    paddingTop: 0,
    backgroundColor: "transparent",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: "visible",
  },
  scroll: { flexGrow: 1 },
  content: { paddingHorizontal: 24 },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 22,
    gap: 12,
  },
  stepText: { fontSize: 12, color: "#7A8A80", fontWeight: "500" },
  stepNumber: { fontSize: 12, color: C.greenDeep, fontWeight: "700" },
  stepCount: { color: "#9BA79F", fontWeight: "400" },
});
