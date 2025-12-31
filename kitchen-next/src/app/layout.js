import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import SkyHeader from "@/components/sky/SkyHeader";
import SkyFooter from "@/components/sky/SkyFooter";
import Preloader from "@/components/sky/Preloader";
import RouteProgress from "@/components/sky/RouteProgress";
import FluidCursor from "@/components/sky/FluidCursor";
import BackToTop from "@/components/sky/BackToTop";
import { Analytics } from "@vercel/analytics/react";
import FPSCounter from "@/components/FPSCounter";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";

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
        <CartProvider>
          <FluidCursor />
          <BackToTop />
          <Preloader />
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <div className="flex min-h-dvh flex-col bg-[var(--sky-bg)] text-[var(--sky-fg)]">
            <SkyHeader />
            <main className="flex-1">{children}</main>
            <SkyFooter />
          </div>
          <CartDrawer />
          <Analytics />
          <FPSCounter />
        </CartProvider>
      </body>
    </html>
  );
}
