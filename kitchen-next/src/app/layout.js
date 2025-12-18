import { Inter } from "next/font/google";
import "./globals.css";
import SkyHeader from "@/components/sky/SkyHeader";
import SkyFooter from "@/components/sky/SkyFooter";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "SKY Kitchens",
    template: "%s · SKY Kitchens",
  },
  description: "Luxury minimal kitchens with a live 3D configurator.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        {/* Prevent FOUC: set theme + palette before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem('sky-theme');
              var p=localStorage.getItem('sky-palette');
              if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
              document.documentElement.dataset.theme=t||'dark';
              document.documentElement.dataset.palette=p||'mono';
            }catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-dvh flex-col bg-[var(--sky-bg)] text-[var(--sky-fg)]">
          <SkyHeader />
          <main className="flex-1">{children}</main>
          <SkyFooter />
        </div>
      </body>
    </html>
  );
}
