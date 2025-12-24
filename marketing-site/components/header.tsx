"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">26 Diagrams</span>
          </Link>
          
          <div className="hidden md:flex md:gap-6">
            <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
          </div>
        </div>

        <div className="hidden md:flex md:items-center md:gap-4">
          <Button variant="ghost" asChild>
            <Link href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}>
              Sign In
            </Link>
          </Button>
          <Button asChild>
            <Link href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}>
              Get Started
            </Link>
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 flex flex-col gap-4">
            <Link href="/features" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/blog" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Blog
            </Link>
            <Link href="/docs" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Docs
            </Link>
            <div className="flex flex-col gap-2 pt-4 border-t">
              <Button variant="ghost" asChild>
                <Link href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}>
                  Sign In
                </Link>
              </Button>
              <Button asChild>
                <Link href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}>
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
