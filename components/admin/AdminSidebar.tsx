'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Menu,
  X,
  Home,
  Video,
  List,
  Settings,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: FileText, label: 'Blogs', href: '/admin/blogs' },
  { icon: Calendar, label: 'Events', href: '/admin/events' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Video, label: 'Streams', href: '/admin/streams' },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn('pb-12 min-h-screen', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mb-4 px-4">
            <h2 className="text-2xl font-bold tracking-tight">Admin Panel</h2>
            <p className="text-sm text-slate-500">Manage your platform</p>
          </div>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    pathname === item.href && 'bg-slate-100'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileAdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <ScrollArea className="h-full">
          <div className="space-y-4 py-4">
            <div className="px-3 py-2">
              <div className="mb-4 px-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Admin</h2>
                  <p className="text-xs text-slate-500">Control Panel</p>
                </div>
              </div>
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                    <Button
                      variant={pathname === item.href ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start',
                        pathname === item.href && 'bg-slate-100'
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
