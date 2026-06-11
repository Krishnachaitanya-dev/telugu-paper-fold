/**
 * Web-only fallback: explicitly inject @font-face for @expo/vector-icons.
 * useFonts() works on native, but in some web environments the fonts never
 * register and icons render as empty boxes. This guarantees they load.
 */
import { Platform } from "react-native";

function resolveUrl(asset: unknown): string | null {
  if (!asset) return null;
  if (typeof asset === "string") return asset;
  if (typeof asset === "object") {
    const a = asset as { uri?: string; default?: string };
    if (typeof a.uri === "string") return a.uri;
    if (typeof a.default === "string") return a.default;
  }
  return null;
}

export function loadIconFontsWeb() {
  if (Platform.OS !== "web") return;
  if (typeof document === "undefined") return;
  if (document.getElementById("lovable-icon-fonts")) return;

  const entries: { name: string; asset: unknown }[] = [];
  try {
    entries.push({ name: "Feather", asset: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf") });
  } catch {}
  try {
    entries.push({ name: "MaterialCommunityIcons", asset: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf") });
  } catch {}
  try {
    entries.push({ name: "Ionicons", asset: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf") });
  } catch {}
  try {
    entries.push({ name: "MaterialIcons", asset: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf") });
  } catch {}
  try {
    entries.push({ name: "FontAwesome", asset: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf") });
  } catch {}

  const css = entries
    .map(({ name, asset }) => {
      const url = resolveUrl(asset);
      if (!url) return "";
      return `@font-face { font-family: '${name}'; src: url('${url}') format('truetype'); font-display: block; }`;
    })
    .filter(Boolean)
    .join("\n");

  if (!css) return;
  const style = document.createElement("style");
  style.id = "lovable-icon-fonts";
  style.textContent = css;
  document.head.appendChild(style);
}
