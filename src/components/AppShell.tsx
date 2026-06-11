import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { Newspaper, Clapperboard, Radio, User, Search } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/",        label: "News",   icon: Newspaper,    end: true },
  { to: "/reels",   label: "Reels",  icon: Clapperboard, end: false },
  { to: "/live",    label: "Live",   icon: Radio,        end: false },
  { to: "/profile", label: "Profile",icon: User,         end: false },
];

export function AppShell() {
  const { pathname } = useLocation();
  const isReels = pathname.startsWith("/reels");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isReels && <TopBar />}
      <main className={cn("flex-1 w-full", isReels ? "" : "max-w-3xl mx-auto w-full pb-24")}>
        <Outlet />
      </main>
      <BottomNav tabs={TABS} />
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 h-14">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-border" />
          <div className="leading-tight">
            <div className="font-display text-base font-extrabold text-foreground">తెలుగు వార్తలు</div>
            <div className="text-[10px] text-muted-foreground font-semibold tracking-wide uppercase">Live · Reels · News</div>
          </div>
        </Link>
        <div className="ml-auto">
          <button
            aria-label="Search"
            className="h-9 w-9 grid place-items-center rounded-full bg-card hover:bg-card-elevated transition-colors border border-border"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ tabs }: { tabs: typeof TABS }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-lg border-t border-border">
      <div className="max-w-3xl mx-auto grid grid-cols-4 px-2 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))]">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "h-7 px-3 grid place-items-center rounded-full transition-all",
                    isActive ? "bg-primary-soft" : "bg-transparent"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                <span className="text-[10.5px] font-bold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
