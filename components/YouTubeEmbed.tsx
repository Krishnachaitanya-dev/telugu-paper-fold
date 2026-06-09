import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

interface Props {
  videoId: string;
  height: number;
  width?: number | string;
  autoplay?: boolean;
  onError?: () => void;
}

const APP_REFERER_ORIGIN = "https://com.telugu.enewspaper";
const APP_REFERER_URL = `${APP_REFERER_ORIGIN}/`;
const YOUTUBE_HOST = "https://www.youtube.com";
const YOUTUBE_NOCOOKIE_HOST = "https://www.youtube-nocookie.com";
const WEBVIEW_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";

function thumb(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function buildEmbedSrc(videoId: string, autoplay: boolean, host: string) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    mute: "0",
    enablejsapi: "1",
    origin: APP_REFERER_ORIGIN,
    widget_referrer: APP_REFERER_URL,
  });

  return `${host}/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

function buildHTML(videoId: string, autoplay: boolean, host: string) {
  const embedSrc = buildEmbedSrc(videoId, autoplay, host);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;width:100%;background:#000;overflow:hidden}
iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
</style>
</head>
<body>
<iframe
  id="player"
  src="${embedSrc}"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>
<script>
function post(msg){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(msg));}catch(e){}}
var s=document.createElement('script');
s.src='https://www.youtube.com/iframe_api';
document.head.appendChild(s);
function onYouTubeIframeAPIReady(){
  try{
    new YT.Player('player',{
      events:{
        onReady:function(e){post({type:'yt-ready'});try{e.target.unMute();e.target.setVolume(100);e.target.playVideo();}catch(err){}},
        onError:function(e){post({type:'yt-error',code:e.data});}
      }
    });
  }catch(e){}
}
</script>
</body>
</html>`;
}

function YouTubeEmbed({ videoId, height, width = "100%", autoplay = true, onError }: Props) {
  const [failed, setFailed] = useState(false);
  const [host, setHost] = useState(YOUTUBE_HOST);
  const html = useMemo(() => buildHTML(videoId, autoplay, host), [videoId, autoplay, host]);

  const retryWithNoCookieHost = useCallback(() => {
    if (host !== YOUTUBE_NOCOOKIE_HOST) {
      setHost(YOUTUBE_NOCOOKIE_HOST);
      return true;
    }
    setFailed(true);
    onError?.();
    return false;
  }, [host, onError]);

  useEffect(() => {
    setFailed(false);
    setHost(YOUTUBE_HOST);
  }, [videoId]);

  const openYouTube = useCallback(() => {
    WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`).catch(() => {});
  }, [videoId]);

  if (failed) {
    return (
      <View style={[styles.fallback, { height, width } as any]}>
        <Image source={{ uri: thumb(videoId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.scrim} />
        <TouchableOpacity style={styles.card} onPress={openYouTube} activeOpacity={0.85}>
          <Feather name="youtube" size={24} color="#fff" />
          <Text style={styles.title}>Open on YouTube</Text>
          <Text style={styles.sub}>YouTube blocked embedded playback for this stream.</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <WebView
      key={`${videoId}-${host}`}
      source={{ html, baseUrl: APP_REFERER_URL }}
      style={{ height, width } as any}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo
      javaScriptEnabled
      domStorageEnabled
      cacheEnabled
      thirdPartyCookiesEnabled
      sharedCookiesEnabled
      mixedContentMode="always"
      userAgent={WEBVIEW_USER_AGENT}
      androidLayerType="hardware"
      setSupportMultipleWindows={false}
      originWhitelist={["*"]}
      onError={() => {
        if (!retryWithNoCookieHost()) setFailed(true);
      }}
      onHttpError={() => {
        if (!retryWithNoCookieHost()) setFailed(true);
      }}
      onMessage={(event) => {
        try {
          const payload = JSON.parse(event.nativeEvent.data);
          if (payload?.type === "yt-error") {
            if (!retryWithNoCookieHost()) setFailed(true);
          }
        } catch {}
      }}
    />
  );
}

export default memo(YouTubeEmbed);

const styles = StyleSheet.create({
  fallback: { backgroundColor: "#000", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  card: { alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.72)", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 14 },
  title: { color: "#fff", fontSize: 15, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.75)", fontSize: 11, textAlign: "center" },
});
