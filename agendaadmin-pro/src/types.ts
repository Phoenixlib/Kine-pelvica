export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  lastVisit: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  title: string;
  date: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
}

export interface DashboardStats {
  revenueToday: number;
  appointmentsToday: number;
  newClientsThisWeek: number;
  retentionRate: number;
}
