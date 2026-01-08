import Link from "next/link";

const links = [
  { href: "/", label: "Inventory", icon: "🧺" },
  { href: "/alerts", label: "Alerts", icon: "⚠️" },
  { href: "/history", label: "History", icon: "🧾" },
  { href: "/scan", label: "Scan", icon: "📸" },
];

export default function TopNav() {
  return (
    <nav className="k-nav" aria-label="primary">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="k-link">
          <span aria-hidden="true">{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
