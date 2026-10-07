import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

import type { HomeTransaction } from "@/src/infrastructure/api/home/services/home.types";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";

export function RecentTransactions({ items }: { items: HomeTransaction[] }) {
  return (
    <View className="px-5 pt-2">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-extrabold text-green-950">
          Últimos movimientos
        </Text>
        <View className="flex-row items-center">
          <Text className="text-xs font-semibold text-green-800">
            Ver todos
          </Text>
          <ChevronRight color="#006B32" size={15} />
        </View>
      </View>
      <LiquidGlassSurface className="rounded-[26px] px-4" tone="neutral">
        {items.length === 0 ? (
          <Text className="py-8 text-center text-sm text-green-950/55">
            Aún no tienes movimientos
          </Text>
        ) : (
          items.map((item, index) => {
            const incoming = item.direction === "CREDIT";
            const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
            const prefix = incoming ? "+" : "-";
            const currency = item.currency === "PEN" ? "S/" : "$";
            return (
              <View
                key={item.id}
                className={`flex-row items-center py-4 ${index ? "border-t border-white/50" : ""}`}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/60">
                  <Icon color={incoming ? "#00A844" : "#637168"} size={19} />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className="font-semibold text-green-950"
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                  <Text
                    className="mt-1 text-xs text-green-950/55"
                    numberOfLines={1}
                  >
                    {item.accountName}
                  </Text>
                </View>
                <Text
                  className={`font-bold ${incoming ? "text-green-700" : "text-green-950"}`}
                >
                  {prefix}
                  {currency} {item.amount}
                </Text>
              </View>
            );
          })
        )}
      </LiquidGlassSurface>
    </View>
  );
}
