import type { Metadata } from "next";
import "./globals.css";

export function generateMetadata(): Metadata {
  const metadataBase = new URL("https://www.blocpod.io");
  const title = "BLOCPOD CREATIVE — The NFT Singularity";
  const description = "A living NFT universe where every block converges on BLOCPOD CREATIVE.";

  return {
    metadataBase,
    title,
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/blocpod-og.png", width: 1729, height: 910, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/blocpod-og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
