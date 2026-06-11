import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path, Circle, Polyline, Line, Rect } from "react-native-svg";

import {
  getIconFontStatus,
  subscribeIconFontStatus,
} from "@/lib/iconFontStatus";

type Family = "feather" | "mci";

interface Props {
  name: string;
  size?: number;
  color?: string;
  family?: Family;
  style?: any;
}

/**
 * Drop-in replacement for <Feather/> and <MaterialCommunityIcons/>.
 * Shows a pulsing skeleton circle while icon fonts are loading and
 * falls back to an inline SVG (for known names) if font loading fails.
 */
export function SafeIcon({
  name,
  size = 18,
  color = "#fff",
  family = "feather",
  style,
}: Props) {
  const [status, setStatus] = useState(getIconFontStatus());

  useEffect(() => subscribeIconFontStatus(setStatus), []);

  if (status === "loading") {
    return <SkeletonCircle size={size} style={style} />;
  }

  if (status === "loaded") {
    if (family === "mci") {
      return (
        <MaterialCommunityIcons
          name={name as any}
          size={size}
          color={color}
          style={style}
        />
      );
    }
    return (
      <Feather name={name as any} size={size} color={color} style={style} />
    );
  }

  // failed → inline SVG fallback
  return <FallbackSvg name={name} size={size} color={color} style={style} />;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCircle({ size, style }: { size: number; style?: any }) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.8,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View
      style={[
        { width: size, height: size, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: size * 0.85,
          height: size * 0.85,
          borderRadius: size,
          backgroundColor: "rgba(255,255,255,0.22)",
          opacity: pulse,
        }}
      />
    </View>
  );
}

// ─── SVG fallback ────────────────────────────────────────────────────────────

function FallbackSvg({
  name,
  size,
  color,
  style,
}: {
  name: string;
  size: number;
  color: string;
  style?: any;
}) {
  // stroke-based icons inspired by Feather (24x24 viewbox)
  const stroke = color;
  const sw = 2;
  const wrap = (children: React.ReactNode) => (
    <View style={style}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </Svg>
    </View>
  );

  switch (name) {
    case "heart":
      return wrap(
        <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      );
    case "bookmark":
      return wrap(<Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />);
    case "share-2":
      return wrap(
        <>
          <Circle cx="18" cy="5" r="3" />
          <Circle cx="6" cy="12" r="3" />
          <Circle cx="18" cy="19" r="3" />
          <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </>
      );
    case "send":
      return wrap(
        <>
          <Line x1="22" y1="2" x2="11" y2="13" />
          <Path d="M22 2L15 22l-4-9-9-4 20-7z" />
        </>
      );
    case "message-circle":
      return wrap(
        <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      );
    case "book-open":
      return wrap(
        <>
          <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </>
      );
    case "sliders":
      return wrap(
        <>
          <Line x1="4" y1="21" x2="4" y2="14" />
          <Line x1="4" y1="10" x2="4" y2="3" />
          <Line x1="12" y1="21" x2="12" y2="12" />
          <Line x1="12" y1="8" x2="12" y2="3" />
          <Line x1="20" y1="21" x2="20" y2="16" />
          <Line x1="20" y1="12" x2="20" y2="3" />
          <Line x1="1" y1="14" x2="7" y2="14" />
          <Line x1="9" y1="8" x2="15" y2="8" />
          <Line x1="17" y1="16" x2="23" y2="16" />
        </>
      );
    case "chevron-up":
      return wrap(<Polyline points="18 15 12 9 6 15" />);
    case "chevron-down":
      return wrap(<Polyline points="6 9 12 15 18 9" />);
    case "check":
      return wrap(<Polyline points="20 6 9 17 4 12" />);
    case "wifi-off":
      return wrap(
        <>
          <Line x1="1" y1="1" x2="23" y2="23" />
          <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <Path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <Line x1="12" y1="20" x2="12.01" y2="20" />
        </>
      );
    case "loader":
      return wrap(
        <>
          <Line x1="12" y1="2" x2="12" y2="6" />
          <Line x1="12" y1="18" x2="12" y2="22" />
          <Line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
          <Line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
          <Line x1="2" y1="12" x2="6" y2="12" />
          <Line x1="18" y1="12" x2="22" y2="12" />
          <Line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
          <Line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </>
      );
    case "inbox":
      return wrap(
        <>
          <Polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <Path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </>
      );
    // MaterialCommunityIcons: whatsapp — simple chat bubble fallback
    case "whatsapp":
      return wrap(
        <Path
          d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z"
          fill={color}
          stroke="none"
        />
      );
    default:
      // generic dot fallback
      return wrap(<Circle cx="12" cy="12" r="3" fill={color} stroke="none" />);
  }
}
