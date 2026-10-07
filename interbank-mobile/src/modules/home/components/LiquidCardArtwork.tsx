import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

interface LiquidCardArtworkProps {
  variant: "green" | "blue";
}

const ARTWORK_PALETTES = {
  green: {
    ambient: "#00BA55",
    spill: "#91F2BD",
    edge: "#E4FFF0",
    depth: "#008A49",
  },
  blue: {
    ambient: "#2F8EF4",
    spill: "#A4DBFF",
    edge: "#EAF7FF",
    depth: "#1262B8",
  },
} as const;

export function LiquidCardArtwork({ variant }: LiquidCardArtworkProps) {
  const palette = ARTWORK_PALETTES[variant];
  const isGreen = variant === "green";

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 350 221"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="ambientSpill" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.ambient} stopOpacity={0.2} />
            <Stop offset="0.42" stopColor={palette.spill} stopOpacity={0.07} />
            <Stop offset="0.76" stopColor="#FFFFFF" stopOpacity={0.035} />
            <Stop offset="1" stopColor={palette.depth} stopOpacity={0.12} />
          </LinearGradient>
          <LinearGradient id="edgeLens" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.spill} stopOpacity={0.3} />
            <Stop offset="0.28" stopColor="#FFFFFF" stopOpacity={0.84} />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.24} />
            <Stop offset="0.79" stopColor={palette.edge} stopOpacity={0.62} />
            <Stop offset="1" stopColor={palette.depth} stopOpacity={0.24} />
          </LinearGradient>
          <LinearGradient id="refractedCurve" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.depth} stopOpacity={0.035} />
            <Stop offset="0.5" stopColor={palette.spill} stopOpacity={0.17} />
            <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity={0.22} />
            <Stop offset="1" stopColor={palette.ambient} stopOpacity={0.05} />
          </LinearGradient>
          <RadialGradient id="glassBubble" cx="36%" cy="30%" rx="66%" ry="66%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.12} />
            <Stop offset="0.58" stopColor={palette.spill} stopOpacity={0.045} />
            <Stop offset="0.84" stopColor={palette.depth} stopOpacity={0.025} />
            <Stop offset="1" stopColor={palette.edge} stopOpacity={0.16} />
          </RadialGradient>
          <RadialGradient id="localizedSpecular" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.3} />
            <Stop offset="0.43" stopColor={palette.edge} stopOpacity={0.12} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect
          x={0.8}
          y={0.8}
          width={348.4}
          height={219.4}
          rx={25.2}
          fill="url(#ambientSpill)"
          stroke="url(#edgeLens)"
          strokeWidth={1.6}
        />
        <Circle
          cx={isGreen ? 294 : 66}
          cy={isGreen ? 69 : 158}
          r={78}
          fill="url(#glassBubble)"
        />
        <Circle
          cx={isGreen ? 66 : 292}
          cy={isGreen ? 211 : 42}
          r={91}
          fill="url(#glassBubble)"
          opacity={0.58}
        />
        <Path
          d="M-45 234C35 153 107 137 177 174C245 210 306 179 390 84"
          fill="none"
          stroke="url(#refractedCurve)"
          strokeWidth={24}
          strokeLinecap="round"
        />
        <Ellipse
          cx={isGreen ? 286 : 82}
          cy={isGreen ? 37 : 184}
          rx={62}
          ry={24}
          fill="url(#localizedSpecular)"
          transform={`rotate(${isGreen ? -15 : 14} ${isGreen ? 286 : 82} ${isGreen ? 37 : 184})`}
        />
        <Path
          d="M330 26C342 52 344 93 338 121"
          fill="none"
          stroke={palette.edge}
          strokeOpacity={0.32}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        <Path
          d="M28 207C105 216 214 215 297 205"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.16}
          strokeWidth={1.1}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
