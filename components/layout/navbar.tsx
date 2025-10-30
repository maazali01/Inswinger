'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Video, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  // --- new: derive a single dashboard link based on role ---
  const dashboardLink = profile
    ? profile.role === 'admin'
      ? { href: '/admin', label: 'Admin Panel', icon: LayoutDashboard }
      : profile.role === 'streamer'
      ? { href: '/dashboard/streamer', label: 'Streamer Dashboard', icon: Video }
      : { href: '/dashboard', label: 'Dashboard', icon: User }
    : null;

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Video className="w-8 h-8 text-blue-600" />
              <span className="font-bold text-xl">Inswinger</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/browse"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
              >
                Browse
              </Link>
              <Link
                href="/events"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
              >
                Events
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
              >
                Blog
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{profile.full_name || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    <div className="text-slate-900">{profile.full_name}</div>
                    <div className="text-slate-500 text-xs">{profile.email}</div>
                  </div>
                  <DropdownMenuSeparator />

                  {/* render only the single role-appropriate dashboard link */}
                  {dashboardLink && (() => {
                    const Icon = dashboardLink.icon;
                    return (
                      <DropdownMenuItem asChild key={dashboardLink.href}>
                        <Link href={dashboardLink.href} className="cursor-pointer flex items-center gap-2">
                          <Icon className="w-4 h-4 mr-2" />
                          {dashboardLink.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })()}


                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/browse"
              className="block text-sm font-medium text-slate-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/events"
              className="block text-sm font-medium text-slate-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/blog"
              className="block text-sm font-medium text-slate-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            {user && profile ? (
              <>
                {/* mobile: show only the role-appropriate dashboard link */}
                {dashboardLink && (
                  <Link
                    href={dashboardLink.href}
                    className="block text-sm font-medium text-slate-700 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {dashboardLink.label}
                  </Link>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
