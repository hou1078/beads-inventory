import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata = {
  title: "Beads Inventory",
  description: "Perler beads inventory tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="k-blob" aria-hidden="true" />
        <div className="k-sparkles" aria-hidden="true" />

        <div className="k-app">
          <header className="k-header">
            <div className="k-brand">
              <div className="k-mascot" aria-hidden="true">૮₍˶• ᴗ •˶₎</div>
              <div>
                <div className="k-title">Beads Inventory</div>
                <div className="k-subtitle">cute mode • low stock? no panic ✦</div>
              </div>
            </div>

            <TopNav />
          </header>

          {children}

          <footer className="k-footer">
            Made with ✦ Next.js + Prisma + FastAPI
          </footer>
        </div>
      </body>
    </html>
  );
}
