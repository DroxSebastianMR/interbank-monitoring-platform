import React from "react";
import { Dimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

export const TabBarBackground = () => {
  const height = 80;
  const curveWidth = 90;
  const curveDepth = 35;

  const center = width / 2;

  const path = `
    M0 ${curveDepth}
    H${center - curveWidth}
    C${center - curveWidth / 2} ${curveDepth} ${center - curveWidth / 2} 0 ${center} 0
    C${center + curveWidth / 2} 0 ${center + curveWidth / 2} ${curveDepth} ${center + curveWidth} ${curveDepth}
    H${width}
    V${height + curveDepth}
    H0
    Z
  `;

  return (
    <Svg
      width={width}
      height={height + curveDepth}
      style={{
        position: "absolute",
        bottom: 0,
      }}
    >
      <Path d={path} fill="white" />
    </Svg>
  );
};
