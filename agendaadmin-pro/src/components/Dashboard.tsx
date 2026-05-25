import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '../types';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [statsRes, chartRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/chart')
        ]);
        if (statsRes.ok && chartRes.ok) {
          setStats(await statsRes.json());
          setChartData(await chartRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading dashboard...</div>;
  if (!stats) return <div className="p-8 text-rose-500">Error loading data.</div>;

  const statCards = [
    { label: "Today's Revenue", value: `$${stats.revenueToday}`, icon: DollarSign, trend: "+12%" },
    { label: "Appointments", value: stats.appointmentsToday, icon: CalendarIcon, trend: "+2%" },
    { label: "New Clients", value: stats.newClientsThisWeek, icon: Users, trend: "+5%" },
    { label: "Retention Rate", value: `${stats.retentionRate}%`, icon: TrendingUp, trend: "+1.2%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h2>
        <p className="text-slate-500 dark:text-slate-400">Welcome back. Here is your business activity today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{stat.value}</h3>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full mt-2 inline-block">
                {stat.trend} from last week
              </span>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-slate-700/50 rounded-lg text-indigo-600 dark:text-indigo-400">
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
          <TrendingUp className="w-5 h-5 text-slate-400" />
          Revenue & Activity (7-Day Forecast)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar yAxisId="left" dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
