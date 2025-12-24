import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "26 Diagrams - C4 Model Architecture Diagrams Made Easy",
  description: "Create beautiful C4 model architecture diagrams with real-time collaboration. The ease of Miro meets the structure of Structurizr.",
  keywords: ["C4 model", "architecture diagrams", "software architecture", "system diagrams", "collaboration"],
  authors: [{ name: "26 Diagrams" }],
  openGraph: {
    title: "26 Diagrams - C4 Model Architecture Diagrams Made Easy",
    description: "Create beautiful C4 model architecture diagrams with real-time collaboration.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
