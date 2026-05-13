import { Link, Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";
import { LayoutDashboard, Globe, LineChart, Newspaper, ListChecks, LogOut, Search, Bell, Sparkles, GitCompare, Pickaxe, Inbox, Bot, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import PrysmianLogo from "./PrysmianLogo";
import { useGlobalSearch } from "@/lib/queries";

type NavItem = { to: string; label: string; icon: any; end?: boolean; match?: string; badgeKey?: "review" | "alerts"; group?: string };
const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, group: "Workspace" },
  { to: "/review", label: "Review queue", icon: Inbox, badgeKey: "review", group: "Workspace" },
  { to: "/alerts", label: "Alerts", icon: BellRing, badgeKey: "alerts", group: "Workspace" },
  { to: "/agents", label: "AI Agents", icon: Bot, group: "Workspace" },
  { to: "/country/italy", label: "Country ID", icon: Globe, match: "/country", group: "Intelligence" },
  { to: "/compare", label: "Compare", icon: GitCompare, group: "Intelligence" },
  { to: "/trends", label: "Market Trends", icon: LineChart, group: "Intelligence" },
  { to: "/news", label: "News & Reports", icon: Newspaper, group: "Intelligence" },
  { to: "/projects", label: "Projects", icon: ListChecks, group: "Intelligence" },
];

export default function Layout() {
  const loc = useLocation();
  const nav = useNavigate();
  const userEmail = sessionStorage.getItem("mi_hub_user") || "";

  const [searchOpen, setSearchOpen] = useState(false);

  const reviewStats = useQuery({
    queryKey: ["review-stats-nav"],
    queryFn: async () => (await api.get<{ by_status: Record<string, number> }>("/review/stats")).data,
    refetchInterval: 20000,
  });
  const alertsCount = useQuery({
    queryKey: ["alerts-count-nav"],
    queryFn: async () => (await api.get<{ unread: number }>("/alerts/stats").then(r => r.data).catch(() => ({ unread: 0 }))),
    refetchInterval: 30000,
  });
  const badgeMap: Record<string, number> = {
    review: reviewStats.data?.by_status?.draft ?? 0,
    alerts: alertsCount.data?.unread ?? 0,
  };
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("mi_hub_user");
    nav("/login", { replace: true });
  }

  const initials = userEmail.split("@")[0].slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-surface-muted flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-line flex flex-col">
        <div className="h-16 px-5 flex items-center border-b border-line">
          <Link to="/" className="flex items-center gap-2.5 focus-ring rounded">
            <div className="w-8 h-8 rounded-lg bg-ey-navy flex items-center justify-center">
              <Sparkles size={16} className="text-prysmian-green-light" />
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-ink">MI Hub</div>
              <div className="text-[10px] text-ink-subtle uppercase tracking-wider">Prysmian × EY</div>
            </div>
          </Link>
        </div>
        <nav className="p-3 flex-1 overflow-y-auto">
          {(["Workspace", "Intelligence"] as const).map((group) => (
            <div key={group} className="mb-3">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{group}</div>
              <div className="space-y-0.5">
                {NAV.filter((n) => n.group === group).map((n) => {
                  const active = n.end
                    ? loc.pathname === n.to
                    : (n.match ? loc.pathname.startsWith(n.match) : loc.pathname.startsWith(n.to));
                  const badge = n.badgeKey ? badgeMap[n.badgeKey] : 0;
                  return (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-prysmian-green/8 text-prysmian-green"
                          : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
                      }`}
                      end={n.end as any}
                    >
                      <span className="flex items-center gap-2.5">
                        <n.icon size={16} className={active ? "text-prysmian-green" : "text-ink-faint group-hover:text-ink-muted"} />
                        {n.label}
                      </span>
                      {badge > 0 && (
                        <span className={`chip text-[10px] ${active ? "bg-prysmian-green text-white" : n.badgeKey === "alerts" ? "bg-accent-red-light text-accent-red" : "bg-accent-amber-light text-accent-amber"}`}>
                          {badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-line">
          <div className="px-3 py-2 rounded-lg bg-surface-muted flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-ey-navy text-white text-[11px] font-semibold flex items-center justify-center">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-ink truncate">{userEmail.split("@")[0]}</div>
              <div className="text-[10px] text-ink-subtle truncate">{userEmail}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-white text-ink-subtle hover:text-ink focus-ring"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-line flex items-center px-6 gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 max-w-lg flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-line bg-surface-muted text-ink-subtle hover:border-line-strong hover:bg-white transition-colors text-sm focus-ring"
          >
            <Search size={15} />
            <span>Search news, projects, countries...</span>
            <span className="ml-auto flex items-center gap-1">
              <span className="kbd">⌘</span><span className="kbd">K</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-2" title="Notifications">
              <Bell size={16} />
            </button>
            <div className="w-px h-6 bg-line" />
            <PrysmianLogo variant="full" height={28} />
          </div>
        </header>
        <main className="flex-1 p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

function SearchPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 180);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isFetching } = useGlobalSearch(debounced);

  const items: { type: "news" | "project" | "country"; label: string; sub: string; onSelect: () => void }[] = [];
  data?.countries.forEach((c) => items.push({
    type: "country", label: c.name, sub: "Country profile",
    onSelect: () => { nav(`/country/${c.id}`); onClose(); },
  }));
  data?.projects.forEach((p) => items.push({
    type: "project", label: p.name, sub: `${p.country ?? "—"} · ${p.status ?? "—"}${p.owner ? " · " + p.owner : ""}`,
    onSelect: () => { nav(`/projects/${p.id}`); onClose(); },
  }));
  data?.news.forEach((n) => items.push({
    type: "news", label: n.title, sub: `${n.source} · ${(n.countries ?? []).join(", ")}`,
    onSelect: () => { window.open(n.url, "_blank"); onClose(); },
  }));

  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => { setActiveIdx(0); }, [debounced]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, items.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && items[activeIdx]) { e.preventDefault(); items[activeIdx].onSelect(); }
  }

  const ICON: Record<string, any> = { news: Newspaper, project: Pickaxe, country: Globe };

  return (
    <div className="fixed inset-0 z-50 bg-ey-navy/30 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-xl shadow-elevated border border-line overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
          <Search size={16} className="text-ink-subtle" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search news, projects, countries..."
            className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-faint"
          />
          {isFetching && <span className="text-[10px] text-ink-faint animate-pulse-soft">searching…</span>}
          <span className="kbd">ESC</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {q.length < 2 && (
            <div className="px-4 py-8 text-center text-xs text-ink-subtle">
              Type at least 2 characters. Try <span className="kbd">copper</span> · <span className="kbd">Italy</span> · <span className="kbd">EV</span>
            </div>
          )}
          {q.length >= 2 && items.length === 0 && !isFetching && (
            <div className="px-4 py-8 text-center text-xs text-ink-subtle">No results for "{q}"</div>
          )}
          {items.length > 0 && (
            <ul className="py-1.5">
              {items.map((it, i) => {
                const Icon = ICON[it.type];
                const active = i === activeIdx;
                return (
                  <li key={i}>
                    <button
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={it.onSelect}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 ${active ? "bg-surface-subtle" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-subtle text-ink-muted flex items-center justify-center shrink-0">
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-ink truncate">{it.label}</div>
                        <div className="text-[11px] text-ink-subtle truncate">{it.sub}</div>
                      </div>
                      <span className="chip bg-white border border-line text-ink-subtle uppercase">{it.type}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-line px-4 py-2 flex items-center gap-3 text-[10px] text-ink-subtle">
          <span className="flex items-center gap-1"><span className="kbd">↑↓</span> navigate</span>
          <span className="flex items-center gap-1"><span className="kbd">↵</span> open</span>
          <span className="flex items-center gap-1 ml-auto"><span className="kbd">ESC</span> close</span>
        </div>
      </div>
    </div>
  );
}
