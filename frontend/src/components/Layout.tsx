import { Link, Outlet, useLocation } from "react-router-dom";
import { Map, Globe, LineChart, Newspaper, ListChecks } from "lucide-react";

export default function Layout() {
  const loc = useLocation();
  const nav = [
    { to: "/", label: "Landing", icon: Map },
    { to: "/country/italy", label: "Country ID", icon: Globe },
    { to: "/trends", label: "Market Trends", icon: LineChart },
    { to: "/news", label: "News & Reports", icon: Newspaper },
    { to: "/projects", label: "Project List", icon: ListChecks },
  ];
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-ey-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold">Market Intelligence Hub</span>
        </div>
        <nav className="flex gap-1">
          {nav.map((n) => {
            const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to}
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${active ? "bg-white/10" : "hover:bg-white/5"}`}>
                <n.icon size={16} /> {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
