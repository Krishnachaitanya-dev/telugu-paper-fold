import { Bookmark, History, Bell, Languages, Info, ChevronRight, Settings, LogIn } from "lucide-react";
import logo from "@/assets/logo.jpeg";

const ITEMS = [
  { icon: Bookmark,  label: "సేవ్ చేసిన వార్తలు", hint: "Saved articles & reels" },
  { icon: History,   label: "మీ చదివిన చరిత్ర",   hint: "Reading history" },
  { icon: Bell,      label: "నోటిఫికేషన్‌లు",     hint: "Push & breaking alerts" },
  { icon: Languages, label: "భాష",                hint: "తెలుగు · English" },
  { icon: Settings,  label: "డిస్‌ప్లే & థీమ్",   hint: "Dark mode is on" },
  { icon: Info,      label: "మా గురించి",          hint: "About this app" },
];

export default function Profile() {
  return (
    <div className="pb-10">
      {/* Header card */}
      <div className="relative px-5 pt-6">
        <div className="rounded-3xl bg-gradient-to-br from-primary-soft via-card to-card-elevated border border-border p-5 overflow-hidden relative">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-primary/40">
              <img src={logo} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-extrabold">అతిథి వీక్షకుడు</h1>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                సైన్ ఇన్ చేసి మీ ఇష్టమైన వార్తలు సేవ్ చేయండి
              </p>
            </div>
          </div>
          <button className="mt-4 w-full h-11 rounded-full bg-primary text-primary-foreground font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 transition">
            <LogIn className="h-4 w-4" /> సైన్ ఇన్
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mt-5 grid grid-cols-3 gap-2">
        {[
          { n: "0", l: "Saved" },
          { n: "0", l: "History" },
          { n: "ON", l: "Alerts" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl bg-card border border-border p-3 text-center">
            <div className="font-display text-lg font-extrabold text-primary">{s.n}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Menu list */}
      <div className="px-5 mt-5">
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          {ITEMS.map(({ icon: Icon, label, hint }) => (
            <button
              key={label}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-card-elevated transition"
            >
              <span className="h-9 w-9 rounded-xl bg-primary-soft text-primary grid place-items-center">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="flex-1 min-w-0">
                <div className="font-bold text-sm">{label}</div>
                <div className="text-[11px] text-muted-foreground font-semibold">{hint}</div>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <p className="text-center text-[11px] text-muted-foreground font-semibold mt-6">
          v1.0 · తెలుగు వార్తలు ❤️ 9+ కోట్ల ప్రజల కోసం
        </p>
      </div>
    </div>
  );
}
