import { Link } from "react-router-dom";
import { Globe, LineChart, Newspaper, ListChecks } from "lucide-react";
import { useProjects, useNews } from "@/lib/queries";
import PrysmianLogo from "@/components/PrysmianLogo";

export default function LandingPage() {
  const projects = useProjects();
  const news = useNews();
  return (
    <div>
      <div className="flex justify-end mb-4">
        <PrysmianLogo variant="full" height={48} />
      </div>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
        <div className="rounded-lg overflow-hidden bg-ey-navy" style={{ height: 300 }}>
          <img
            src="/mockup-reference/image1.jpg"
            alt="Europe map"
            className="w-full block"
            style={{ marginTop: "-13%", height: "auto" }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <KpiCard label="Mining projects" value={String(projects.data?.total ?? "—")} />
          <KpiCard label="News articles" value={String(news.data?.length ?? "—")} />
          <KpiCard label="Countries" value="5" />
          <KpiCard label="Last update" value={new Date().toLocaleDateString()} />
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NavCard to="/country/italy" label="Country ID" Icon={Globe} />
        <NavCard to="/trends" label="Market Trends" Icon={LineChart} />
        <NavCard to="/news" label="News & Reports" Icon={Newspaper} />
        <NavCard to="/projects" label="Project List" Icon={ListChecks} />
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-insight-bg p-4">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function NavCard({ to, label, Icon }: { to: string; label: string; Icon: React.ComponentType<{size?: number}> }) {
  return (
    <Link to={to} className="rounded-lg border p-4 hover:border-ey-navy">
      <Icon size={24} />
      <div className="mt-2 font-semibold">{label}</div>
    </Link>
  );
}
