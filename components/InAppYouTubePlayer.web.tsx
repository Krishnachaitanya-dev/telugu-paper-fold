import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SCREEN_W = Dimensions.get("window").width;

interface Props {
  videoId: string;
  isVisible: boolean;
  height: number;
}

export default function InAppYouTubePlayer({ videoId, isVisible, height }: Props) {
  const iframeRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  // Scale 16:9 iframe to fill portrait height, crop sides (overflow:hidden on parent)
  // Controls rendered after iframe in DOM = always above it in CSS stacking
  const iframeW = Math.ceil(height * (16 / 9));
  const iframeLeft = -Math.floor((iframeW - SCREEN_W) / 2);

  function sendCmd(func: string) {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args: [] }),
        "*"
      );
    } catch {}
  }

  useEffect(() => {
    if (isVisible) {
      sendCmd("playVideo");
      setPlaying(true);
    } else {
      sendCmd("pauseVideo");
      setPlaying(false);
    }
  }, [isVisible]);

  function togglePlay() {
    if (playing) {
      sendCmd("pauseVideo");
      setPlaying(false);
    } else {
      sendCmd("playVideo");
      setPlaying(true);
    }
  }

  function toggleMute() {
    if (muted) {
      sendCmd("unMute");
      setMuted(false);
    } else {
      sendCmd("mute");
      setMuted(true);
    }
  }

  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${videoId}`;

  return (
    <View style={{ height, width: SCREEN_W, overflow: "hidden" as any }}>
      {/* @ts-ignore */}
      <iframe
        ref={iframeRef}
        src={src}
        style={{
          position: "absolute",
          top: 0,
          left: iframeLeft,
          width: iframeW,
          height,
          border: "none",
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title={`YouTube ${videoId}`}
      />

      {/* Full-screen tap-to-toggle overlay — rendered after iframe */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={togglePlay}
        activeOpacity={1}
      />

      {/* Pause indicator — pointerEvents none so taps fall through to overlay */}
      {!playing && (
        <View style={styles.pauseWrap} pointerEvents="none">
          <View style={styles.pauseCircle}>
            <Feather name="play" size={34} color="#fff" />
          </View>
        </View>
      )}

      {/* YouTube attribution */}
      <View style={styles.ytBadge} pointerEvents="none">
        <Feather name="youtube" size={11} color="rgba(255,255,255,0.65)" />
        <Text style={styles.ytText}>YouTube</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pauseWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  muteBtn: {
    position: "absolute",
    bottom: 150,
    right: 14,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  ytBadge: {
    position: "absolute",
    bottom: 104,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ytText: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "600" },
});
