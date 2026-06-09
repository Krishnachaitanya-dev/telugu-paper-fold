import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ShareDraft } from "./chatClient";

const KEY = "telugu_pending_share_draft_v1";

export async function saveShareDraft(draft: ShareDraft) {
  await AsyncStorage.setItem(KEY, JSON.stringify(draft));
}

export async function readShareDraft(): Promise<ShareDraft | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShareDraft;
  } catch {
    return null;
  }
}

export async function clearShareDraft() {
  await AsyncStorage.removeItem(KEY);
}
