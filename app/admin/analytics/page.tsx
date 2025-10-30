'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAnalyticsPage() {
  const [totals, setTotals] = useState({
    revenue: 0,
    payments: 0,
    succeeded: 0,
    failed: 0,
  });

  useEffect(() => {
    fetchTotals();
  }, []);

  const fetchTotals = async () => {
    const { data: sumData, error } = await supabase.rpc('sum_payments_amount'); // try rpc, fallback below
    // Fallback if rpc not available:
    if (error || !sumData) {
      const { data } = await supabase.from('payments').select('amount, status');
      const revenue = (data ?? []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const payments = (data ?? []).length;
      const succeeded = (data ?? []).filter((p: any) => p.status === 'succeeded').length;
      const failed = (data ?? []).filter((p: any) => p.status === 'failed').length;
      setTotals({ revenue, payments, succeeded, failed });
      return;
    }

    // If RPC returned a row with sum
    setTotals({
      revenue: Number((sumData as any).sum) || 0,
      payments: 0,
      succeeded: 0,
      failed: 0,
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Revenue & Platform Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${totals.revenue.toFixed(2)}</div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.payments}</div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Succeeded</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.succeeded}</div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Failed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.failed}</div></CardContent>
        </Card>
      </div>

      <section className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Notes</h2>
        <p className="text-sm text-slate-600">This page provides a quick revenue snapshot. For full analytics, connect a BI tool or extend with time-series charts (Chart.js / Recharts).</p>
      </section>
    </div>
  );
}
