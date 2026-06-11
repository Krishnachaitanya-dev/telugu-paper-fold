import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import NewsFeed from "@/pages/NewsFeed";
import NewsArticle from "@/pages/NewsArticle";
import Reels from "@/pages/Reels";
import Live from "@/pages/Live";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<NewsFeed />} />
        <Route path="news/:id" element={<NewsArticle />} />
        <Route path="reels" element={<Reels />} />
        <Route path="live" element={<Live />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
