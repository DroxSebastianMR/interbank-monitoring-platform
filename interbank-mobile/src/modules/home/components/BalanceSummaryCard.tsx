import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Eye, EyeOff, Wifi } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import type {
  HomeAccount,
  HomeBalance,
} from "@/src/infrastructure/api/home/services/home.types";
import { LiquidCardArtwork } from "@/src/modules/home/components/LiquidCardArtwork";
import { HOME_LAYOUT } from "@/src/modules/home/theme/home.theme";

interface BalanceSummaryCardProps {
  accounts: HomeAccount[];
  balances: HomeBalance[];
  ownerName: string;
}

interface DisplayCard {
  currency: HomeBalance["currency"];
  amount: string;
  lastDigits: string;
  expiresAt: string;
}

export function BalanceSummaryCard({
  accounts,
  balances,
  ownerName,
}: BalanceSummaryCardProps) {
  const [showBalance, setShowBalance] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - HOME_LAYOUT.cardWidthOffset, 350);
  const cards = useMemo(
    () => createDisplayCards(accounts, balances),
    [accounts, balances],
  );

  return (
    <View className="pt-4">
      <ScrollView
        horizontal
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + HOME_LAYOUT.cardGap}
        contentContainerStyle={{
          gap: HOME_LAYOUT.cardGap,
          paddingHorizontal: HOME_LAYOUT.horizontalPadding,
        }}
        onMomentumScrollEnd={(event) => {
          const interval = cardWidth + HOME_LAYOUT.cardGap;
          setActiveCard(
            Math.round(event.nativeEvent.contentOffset.x / interval),
          );
        }}
      >
        {cards.map((card, index) => (
          <LiquidBankCard
            key={`${card.currency}-${index}`}
            card={card}
            ownerName={ownerName}
            showBalance={showBalance}
            width={cardWidth}
            onToggleBalance={() => setShowBalance((visible) => !visible)}
          />
        ))}
      </ScrollView>

      {cards.length > 1 ? (
        <View className="mt-3 flex-row justify-center gap-1.5">
          {cards.map((card, index) => (
            <View
              key={`${card.currency}-indicator-${index}`}
              className={`h-1.5 rounded-full ${activeCard === index ? "w-11 bg-white" : "w-7 bg-white/40"}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

interface LiquidBankCardProps {
  card: DisplayCard;
  ownerName: string;
  showBalance: boolean;
  width: number;
  onToggleBalance: () => void;
}

function LiquidBankCard({
  card,
  ownerName,
  showBalance,
  width,
  onToggleBalance,
}: LiquidBankCardProps) {
  const symbol = card.currency === "PEN" ? "S/" : "$";
  const cardKind = card.currency === "PEN" ? "Débito" : "Cuenta dólares";
  const colors =
    card.currency === "PEN"
      ? ([
          "rgba(231,255,239,0.26)",
          "rgba(65,224,132,0.13)",
          "rgba(196,246,226,0.17)",
        ] as const)
      : ([
          "rgba(232,247,255,0.27)",
          "rgba(79,166,245,0.13)",
          "rgba(206,236,255,0.17)",
        ] as const);

  return (
    <View
      className="p-5"
      style={{
        width,
        height: width / 1.58,
        borderRadius: 26,
        overflow: "hidden",
        elevation: 8,
        shadowColor: card.currency === "PEN" ? "#007A3A" : "#145FA8",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.17,
        shadowRadius: 24,
      }}
    >
      <BlurView
        intensity={32}
        tint="light"
        blurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LiquidCardArtwork variant={card.currency === "PEN" ? "green" : "blue"} />
      <View className="flex-1 justify-between">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-white/65">
              <View className="h-3.5 w-3.5 rounded bg-blue-700" />
            </View>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-white">
              {cardKind}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
            onPress={onToggleBalance}
            className="h-8 w-8 items-center justify-center rounded-full bg-white/25"
          >
            {showBalance ? (
              <EyeOff color="#FFFFFF" size={16} />
            ) : (
              <Eye color="#FFFFFF" size={16} />
            )}
          </Pressable>
        </View>

        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-[10px] font-semibold uppercase tracking-[1.8px] text-white/75">
              Saldo disponible
            </Text>
            <Text className="mt-1 text-[30px] font-extrabold tracking-tight text-white">
              {symbol} {showBalance ? card.amount : "••••••"}
            </Text>
          </View>
          <Wifi
            color="rgba(255,255,255,0.82)"
            size={27}
            style={{ transform: [{ rotate: "90deg" }] }}
          />
        </View>

        <View className="flex-row items-center">
          <View className="h-8 w-11 rounded-md bg-amber-200/90" />
          <Text className="ml-3 font-mono text-[13px] tracking-[2px] text-white">
            •••• {card.lastDigits}
          </Text>
        </View>

        <View className="flex-row items-end justify-between">
          <Text className="max-w-[72%] text-[11px] font-semibold uppercase tracking-[2px] text-white/90">
            {ownerName}
          </Text>
          <View className="flex-row items-end gap-2.5">
            <View className="items-end">
              <Text className="text-[7px] font-medium uppercase tracking-wider text-white/65">
                Vence
              </Text>
              <Text className="text-[11px] font-bold text-white">
                {card.expiresAt}
              </Text>
            </View>
            <View className="flex-row">
              <View className="h-7 w-7 rounded-full bg-white/55" />
              <View className="-ml-3 h-7 w-7 rounded-full border border-white/70 bg-white/30" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function createDisplayCards(
  accounts: HomeAccount[],
  balances: HomeBalance[],
): DisplayCard[] {
  if (accounts.length > 0) {
    return accounts.map((account, index) => ({
      currency: account.currency,
      amount: account.availableBalance,
      lastDigits:
        account.maskedAccountNumber.replace(/\D/g, "").slice(-4) || "4471",
      expiresAt: index === 0 ? "09/29" : "03/28",
    }));
  }

  return balances.map((balance) => ({
    currency: balance.currency,
    amount: balance.availableBalance,
    lastDigits: balance.currency === "PEN" ? "4471" : "9082",
    expiresAt: balance.currency === "PEN" ? "09/29" : "03/28",
  }));
}
