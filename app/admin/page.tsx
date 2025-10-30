'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminHomePage() {
  const [counts, setCounts] = useState({
    users: 0,
    blogs: 0,
    payments: 0,
    subscriptions: 0,
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    const [{ data: users }, { data: blogs }, { data: payments }, { data: subs }] =
      await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('blogs').select('id', { count: 'exact' }),
        supabase.from('payments').select('id', { count: 'exact' }),
        supabase.from('subscriptions').select('id', { count: 'exact' }),
      ]);

    setCounts({
      users: users?.length ?? 0,
      blogs: blogs?.length ?? 0,
      payments: payments?.length ?? 0,
      subscriptions: subs?.length ?? 0,
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.users}</div>
            <Link href="/admin/users"><Button className="mt-2">Manage Users</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blogs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.blogs}</div>
            <Link href="/admin/blogs"><Button className="mt-2">Manage Blogs</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.payments}</div>
            <Link href="/admin/payments"><Button className="mt-2">View Payments</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.subscriptions}</div>
            <Link href="/admin/analytics"><Button className="mt-2">View Analytics</Button></Link>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/blogs/new"><Button>Create Blog</Button></Link>
          <Link href="/admin/users"><Button>Manage Users</Button></Link>
          <Link href="/admin/analytics"><Button>Revenue Analytics</Button></Link>
        </div>
      </section>
    </div>
  );
}
