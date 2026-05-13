import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Map, Globe, LineChart, Newspaper, ListChecks, LogOut } from "lucide-react";
import PrysmianLogo from "./PrysmianLogo";

export default function Layout() {
  const loc = useLocation();
  const nav = useNavigate();
  const userEmail = sessionStorage.getItem("mi_hub_user");

  const navItems = [
    { to: "/", label: "Landing", icon: Map },
    { to: "/country/italy", label: "Country ID", icon: Globe },
    { to: "/trends", label: "Market Trends", icon: LineChart },
    { to: "/news", label: "News & Reports", icon: Newspaper },
    { to: "/projects", label: "Project List", icon: ListChecks },
  ];

  function handleLogout() {
    sessionStorage.removeItem("mi_hub_user");
    nav("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-ey-navy text-white px-6 py-3 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 shrink-0">
          <PrysmianLogo variant="full" height={32} />
          <span className="text-white/30">|</span>
          <span className="text-sm font-semibold tracking-wide">Market Intelligence Hub</span>
        </div>
        <nav className="flex gap-1 flex-1 justify-center">
          {navItems.map((n) => {
            const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                  active ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <n.icon size={16} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          {userEmail && (
            <>
              <span className="text-xs text-white/60 hidden md:inline">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-white/10"
                aria-label="Logout"
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          )}
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
