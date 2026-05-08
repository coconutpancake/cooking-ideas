import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cooking Ideas API",
  description: "Headless API for Cooking Ideas",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
