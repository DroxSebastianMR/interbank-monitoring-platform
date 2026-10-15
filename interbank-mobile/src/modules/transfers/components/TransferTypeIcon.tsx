import React from "react";
import Svg, { G, Path, Rect } from "react-native-svg";
import { TransferMode } from "@/src/domain/transfers/transfer.types";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function TransferTypeIcon({ mode }: { mode: TransferMode }) {
  return (
    <Svg width={52} height={52} viewBox="0 0 64 64" accessible={false}>
      {mode === TransferMode.OWN ? (
        <G transform="rotate(22 32 32)">
          <Path
            d="M32 15H17V8L3 22l14 13v-8h15Z"
            fill="#004D29"
            transform="translate(1 2)"
          />
          <Path d="M32 13H17V6L3 20l14 13v-8h15Z" fill={C.greenDeep} />
          <Path
            d="M32 39h15v-8l14 14-14 13v-7H32Z"
            fill="#005C30"
            transform="translate(1 2)"
          />
          <Path d="M32 37h15v-8l14 14-14 13v-7H32Z" fill={C.greenBright} />
        </G>
      ) : (
        <G>
          <Rect x={12} y={25} width={40} height={32} rx={3} fill={C.green} />
          <Rect
            x={18}
            y={31}
            width={28}
            height={26}
            rx={2}
            fill={C.greenBright}
          />
          <Rect
            x={26}
            y={36}
            width={12}
            height={21}
            rx={2}
            fill={C.greenDeep}
          />
          <Path
            d="m11 10-7 18c0 5 7 7 10 2 3 5 9 5 12 0 3 5 9 5 12 0 3 5 9 5 12 0 3 5 10 3 10-2l-7-18a4 4 0 0 0-4-3H15a4 4 0 0 0-4 3Z"
            fill={C.greenDeep}
          />
          <Rect
            x={5}
            y={56}
            width={54}
            height={5}
            rx={2.5}
            fill={C.greenDeep}
          />
        </G>
      )}
    </Svg>
  );
}
