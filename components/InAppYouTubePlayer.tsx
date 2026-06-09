import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { WebView } from "react-native-webview";

interface Props {
  videoId: string;
  isVisible: boolean;
  height: number;
  isMuted?: boolean;
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

function watchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function buildEmbedSrc(videoId: string, host: string) {
  const params = new URLSearchParams({
    autoplay: "0",
    controls: "0",
    playsinline: "1",
    rel: "0",
    mute: "0",
    loop: "1",
    playlist: videoId,
    modestbranding: "1",
    iv_load_policy: "3",
    fs: "0",
    enablejsapi: "1",
    origin: APP_REFERER_ORIGIN,
    widget_referrer: APP_REFERER_URL,
  });

  return `${host}/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

function buildHTML(videoId: string, host: string) {
  const embedSrc = buildEmbedSrc(videoId, host);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;width:100%;background:#000;overflow:hidden}
#playerWrap{position:absolute;inset:0;background:#000;overflow:hidden}
#player{position:absolute;inset:0;height:100vh;width:100vw;border:0;background:#000}
iframe{display:block}
</style>
</head>
<body>
<div id="playerWrap">
  <iframe
    id="player"
    src="${embedSrc}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"
  ></iframe>
</div>
<script>
var player;
var ready=false;
function post(msg){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(msg));}catch(e){}}
function loadApi(){
  var s=document.createElement('script');
  s.src='https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
}
function onYouTubeIframeAPIReady(){
  player=new YT.Player('player',{
    events:{
      onReady:function(e){
        ready=true;
        post({type:'yt-ready'});
        try{e.target.pauseVideo();}catch(err){}
      },
      onError:function(e){post({type:'yt-error',code:e.data});},
      onStateChange:function(e){post({type:'yt-state',state:e.data});}
    }
  });
}
function safeCall(fn){try{if(player&&ready){fn();}}catch(e){}}
function handleMessage(raw){
  try{
    var d=typeof raw==='string'?JSON.parse(raw):raw;
    if(d.func==='playVideo')safeCall(function(){player.playVideo();});
    else if(d.func==='pauseVideo')safeCall(function(){player.pauseVideo();});
    else if(d.func==='mute')safeCall(function(){player.mute();});
    else if(d.func==='unMute')safeCall(function(){player.unMute();});
  }catch(ex){}
}
document.addEventListener('message',function(e){handleMessage(e.data);});
window.addEventListener('message',function(e){handleMessage(e.data);});
loadApi();
</script>
</body>
</html>`;
}

function InAppYouTubePlayer({ videoId, isVisible, height, isMuted = false }: Props) {
  const { width } = useWindowDimensions();
  const webRef = useRef<WebView>(null);
  const [playing, setPlaying] = useState(isVisible);
  const [muted, setMuted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [host, setHost] = useState(YOUTUBE_HOST);
  const html = useMemo(() => buildHTML(videoId, host), [videoId, host]);

  const sendCmd = useCallback((func: string) => {
    webRef.current?.injectJavaScript(
      `try{window.postMessage(JSON.stringify({func:'${func}'}),'*');document.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({func:'${func}'})}));}catch(e){} true;`
    );
  }, []);

  const retryWithNoCookieHost = useCallback(() => {
    if (host !== YOUTUBE_NOCOOKIE_HOST) {
      setHost(YOUTUBE_NOCOOKIE_HOST);
      return true;
    }
    return false;
  }, [host]);

  useEffect(() => {
    setFailed(false);
    setPlayerReady(false);
    setHost(YOUTUBE_HOST);
  }, [videoId]);

  useEffect(() => {
    if (failed) return;
    if (isVisible && playerReady) {
      sendCmd(isMuted ? "mute" : "unMute");
      sendCmd("playVideo");
      setPlaying(true);
      setMuted(isMuted);
    } else {
      sendCmd("pauseVideo");
      setPlaying(false);
    }
  }, [isVisible, sendCmd, failed, playerReady, isMuted]);

  // Sync external mute changes while playing
  useEffect(() => {
    if (!playerReady || !isVisible) return;
    sendCmd(isMuted ? "mute" : "unMute");
    setMuted(isMuted);
  }, [isMuted, playerReady, isVisible, sendCmd]);

  const togglePlay = useCallback(() => {
    if (failed) {
      WebBrowser.openBrowserAsync(watchUrl(videoId)).catch(() => {});
      return;
    }
    if (playing) {
      sendCmd("pauseVideo");
      setPlaying(false);
    } else {
      sendCmd("playVideo");
      setPlaying(true);
    }
  }, [failed, playing, sendCmd, videoId]);

  const toggleMute = useCallback(() => {
    if (muted) {
      sendCmd("unMute");
      setMuted(false);
    } else {
      sendCmd("mute");
      setMuted(true);
    }
  }, [muted, sendCmd]);

  const openYouTube = useCallback(() => {
    WebBrowser.openBrowserAsync(watchUrl(videoId)).catch(() => {});
  }, [videoId]);

  return (
    <View style={{ height, width, overflow: "hidden", backgroundColor: "#000" }}>
      {!failed ? (
        <WebView
          key={`${videoId}-${host}`}
          ref={webRef}
          source={{ html, baseUrl: APP_REFERER_URL }}
          style={StyleSheet.absoluteFill}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={false}
          scrollEnabled={false}
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
              if (payload?.type === "yt-ready") {
                setPlayerReady(true);
                if (isVisible) {
                  sendCmd("unMute");
                  sendCmd("playVideo");
                  setPlaying(true);
                  setMuted(false);
                }
              }
              if (payload?.type === "yt-error") {
                if (!retryWithNoCookieHost()) setFailed(true);
              }
            } catch {}
          }}
        />
      ) : (
        <>
          <Image source={{ uri: thumb(videoId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={styles.fallbackScrim} />
          <TouchableOpacity style={styles.fallbackCard} onPress={openYouTube} activeOpacity={0.85}>
            <Feather name="youtube" size={24} color="#fff" />
            <Text style={styles.fallbackTitle}>Open on YouTube</Text>
            <Text style={styles.fallbackSub}>YouTube blocked embedded playback for this video.</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={togglePlay} activeOpacity={1} />

      {!playing && !failed && (
        <View style={styles.pauseWrap} pointerEvents="none">
          <View style={styles.pauseCircle}>
            <Feather name="play" size={34} color="#fff" />
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.ytBadge} onPress={openYouTube} activeOpacity={0.8}>
        <Feather name="youtube" size={11} color="rgba(255,255,255,0.75)" />
        <Text style={styles.ytText}>YouTube</Text>
      </TouchableOpacity>
    </View>
  );
}

export default memo(InAppYouTubePlayer);

const styles = StyleSheet.create({
  pauseWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
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
  ytText: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "600" },
  fallbackScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  fallbackCard: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  fallbackTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  fallbackSub: { color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: "600" },
});
