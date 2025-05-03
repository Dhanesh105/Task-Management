'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: You'll need to create a separate metadata.ts file for your metadata
// since you can't export metadata from a client component

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    // Apply theme
    const applyTheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = settings.theme === 'system' 
        ? (prefersDark ? 'dark' : 'light')
        : settings.theme;
      
      // Set data-theme attribute for CSS variable selection
      document.documentElement.setAttribute('data-theme', theme);
      
      // Add/remove dark-theme class for any class-based styling
      if (theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        // Add this console log to debug theme application
        console.log('Applied dark theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
        console.log('Applied light theme');
      }
    };
    
    applyTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  return (
    <html lang={settings.language || 'en'} data-theme={settings.theme}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}