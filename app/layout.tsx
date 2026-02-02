import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Celtic Tiles - Premium Tiles & Flooring",
    description: "Discover premium tiles, outdoor flooring, wall panelling, and bathroom accessories. Find tiles that fit your look and budget.",
    keywords: ["tiles", "flooring", "bathroom", "outdoor", "wall panelling", "clearance"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={[inter.variable, playfair.variable].join(' ')} suppressHydrationWarning>
            <body className={[inter.className, 'antialiased'].join(' ')} suppressHydrationWarning>
                <AuthProvider>
                    {children}
                </AuthProvider>
                <Toaster 
                    position="top-right"
                    theme="light"
                    toastOptions={{
                        style: {
                            background: 'white',
                            color: 'black',
                            border: '1px solid #E2E8F0',
                        },
                        className: 'group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                    }}
                    richColors
                    closeButton
                    expand
                />
            </body>
        </html>
    );
}

