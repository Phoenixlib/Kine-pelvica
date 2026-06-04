"use client";

import { api } from "~/trpc/react";
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  FileText
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = 
    api.stats.getDashboardStats.useQuery(undefined, { staleTime: 0, refetchOnMount: true, refetchOnWindowFocus: true });
  const { data: chartData, isLoading: chartLoading } = 
    api.stats.getServicesChartData.useQuery(undefined, { staleTime: 0, refetchOnMount: true, refetchOnWindowFocus: true });
  const { data: apptData, isLoading: apptsLoading } = 
    api.appointment.getAll.useQuery({ limit: 10 }, { staleTime: 0, refetchOnMount: true, refetchOnWindowFocus: true });

  const appointments = apptData?.appointments;
  const loading = statsLoading || chartLoading || apptsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cream border-t-terracotta rounded-full animate-spin"></div>
          <p className="font-subtitle text-xs uppercase tracking-widest font-bold text-teal/60">
            Cargando Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="p-8 bg-redbrown/10 border border-redbrown/20 rounded-2xl text-redbrown">
        <h3 className="font-subtitle text-lg font-bold uppercase mb-2">Error al cargar datos</h3>
        <p className="font-body text-sm">No se pudieron recuperar las estadísticas. Por favor intenta de nuevo.</p>
      </div>
    );
  }

  const statCards = [
    { 
      label: "Mensajes Pendientes", 
      value: stats.unreadMessages, 
      icon: MessageSquare, 
      trend: "Buzón de Comunidad", 
      color: "border-dustypink/20",
      href: "/admin/buzon"
    },
    { 
      label: "Citas Agendadas Hoy", 
      value: stats.appointmentsToday, 
      icon: CalendarIcon, 
      trend: "Revisar Agenda", 
      color: "border-terracotta/20",
      href: "/admin/citas"
    },
    { 
      label: "Artículos Publicados", 
      value: stats.blogArticles, 
      icon: FileText, 
      trend: "Blog Sanity", 
      color: "border-teal/20",
      href: "/admin/contenido"
    },
    { 
      label: "Tasa de Asistencia", 
      value: `${stats.attendanceRate}%`, 
      icon: CheckCircle2, 
      trend: "Últimos 30 días", 
      color: "border-lightbrown/20",
      href: "/admin/citas"
    },
  ];

  // Get next 5 upcoming appointments
  const upcomingAppts = appointments
    ? appointments
        .filter((appt) => new Date(appt.date) >= new Date())
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title & Greeting */}
      <div>
        <h1 className="font-title text-3xl text-teal">Resumen de Actividad</h1>
        <p className="font-body text-sm text-teal/70 mt-1">
          Bienvenida, Camila. Aquí tienes el estado actual de tu consulta.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link 
              key={i}
              href={stat.href}
              className={`bg-white p-6 rounded-3xl border ${stat.color} shadow-xs flex items-center justify-between hover:shadow-md hover:border-terracotta/40 transition-all duration-300 group`}
            >
              <div>
                <p className="font-subtitle text-[10px] tracking-wider uppercase font-bold text-teal/55 group-hover:text-terracotta transition-colors">
                  {stat.label}
                </p>
                <h3 className="font-title text-3xl text-teal mt-2 group-hover:scale-105 origin-left transition-transform">{stat.value}</h3>
                <span className="text-[10px] font-subtitle font-bold text-[#c48a6a] bg-cream/15 px-2 py-0.5 rounded-full mt-2.5 inline-block tracking-wider uppercase">
                  {stat.trend}
                </span>
              </div>
              <div className="p-4 bg-[#f7f3ef] rounded-2xl text-terracotta group-hover:bg-terracotta group-hover:text-white transition-colors">
                <Icon size={24} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-cream/30 shadow-xs flex flex-col">
          <h3 className="font-subtitle text-xs uppercase tracking-wider font-bold text-[#0f3f3e] mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-terracotta" />
            Servicios Más Solicitados (Últimos 30 días)
          </h3>
          <div className="flex-1 min-h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }: { percent?: number }) => (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                  outerRadius={110}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="count"
                  stroke="#fff"
                  strokeWidth={3}
                >
                  {(chartData || []).map((entry, index) => {
                    const COLORS = ['#0f3f3e', '#c48a6a', '#3d726d', '#e6a885', '#d8c7b4', '#8a6552'];
                    return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                  })}
                </Pie>
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #d8c7b4', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    backgroundColor: '#fff',
                    color: '#0f3f3e',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 'bold'
                  }}
                  formatter={(value: any) => [value, "Citas registradas"]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#0f3f3e'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Appointments List */}
        <div className="bg-white p-6 rounded-3xl border border-cream/30 shadow-xs flex flex-col">
          <h3 className="font-subtitle text-xs uppercase tracking-wider font-bold text-[#0f3f3e] mb-6 flex items-center gap-2">
            <Clock size={16} className="text-terracotta" />
            Próximas Citas
          </h3>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {upcomingAppts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-offwhite/50 rounded-2xl border border-dashed border-cream">
                <CalendarIcon size={32} className="text-teal/30 mb-2" />
                <p className="font-body text-xs text-teal/60">No hay próximas citas programadas</p>
              </div>
            ) : (
              upcomingAppts.map((appt) => {
                const apptDate = new Date(appt.date);
                const timeStr = apptDate.toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const dateStr = apptDate.toLocaleDateString("es-CL", {
                  day: "numeric",
                  month: "short",
                });

                return (
                  <Link 
                    href="/admin/citas"
                    key={appt.id} 
                    className="p-4 rounded-2xl border border-cream/30 hover:border-terracotta/40 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0">
                      <h4 className="font-subtitle text-xs font-bold text-teal truncate group-hover:text-terracotta transition-colors">
                        {appt.patient.firstName} {appt.patient.lastName}
                      </h4>
                      <p className="font-body text-[11px] text-teal/60 mt-1 truncate">
                        {appt.title}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-[10px] font-subtitle font-bold text-terracotta bg-[#f7f3ef] px-2.5 py-1 rounded-full uppercase tracking-wider group-hover:bg-terracotta group-hover:text-white transition-colors">
                        {dateStr} - {timeStr}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
