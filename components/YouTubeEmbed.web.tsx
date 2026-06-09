import React from "react";
import { View } from "react-native";

interface Props {
  videoId: string;
  height: number;
  width?: number | string;
  autoplay?: boolean;
  onError?: () => void;
}

export default function YouTubeEmbed({ videoId, height, width = "100%", autoplay = true, onError }: Props) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&playsinline=1&rel=0&modestbranding=1&mute=0`;

  return (
    <View style={{ height, width: width as any }}>
      {/* @ts-ignore — iframe is valid DOM in Expo web / React Native Web */}
      <iframe
        src={embedUrl}
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title={`YouTube video ${videoId}`}
        onError={onError}
      />
    </View>
  );
}
