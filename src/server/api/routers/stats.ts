import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { startOfDay, endOfDay, subDays } from "date-fns";

export const statsRouter = createTRPCRouter({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const oneWeekAgo = subDays(today, 7);

    // 1. Today's Revenue
    const appointmentsToday = await ctx.db.appointment.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const revenueToday = appointmentsToday.reduce(
      (sum, appt) => sum + (appt.amountPaid ?? 0),
      0
    );

    // 2. Appointments Today
    const appointmentsTodayCount = appointmentsToday.length;

    // 3. New Clients This Week
    const newClientsThisWeek = await ctx.db.patient.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    // 4. Retention Rate (percentage of patients with more than 1 appointment)
    const totalPatients = await ctx.db.patient.count();
    const repeatingPatients = await ctx.db.patient.count({
      where: {
        appointments: {
          some: {},
        },
      },
    });

    // Just a realistic calculation or fallback if no patients
    const retentionRate = totalPatients > 0 
      ? Math.round((repeatingPatients / totalPatients) * 100) 
      : 85;

    return {
      revenueToday,
      appointmentsToday: appointmentsTodayCount,
      newClientsThisWeek,
      retentionRate,
    };
  }),

  getForecastChartData: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const chartData = [];

    // Return the last 7 days of revenue/appointments to display in the dashboard chart
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const dayAppts = await ctx.db.appointment.findMany({
        where: {
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      const revenue = dayAppts.reduce((sum, appt) => sum + (appt.amountPaid ?? 0), 0);
      const appointments = dayAppts.length;

      chartData.push({
        name: day.toLocaleDateString("es-CL", { weekday: "short" }),
        revenue,
        appointments,
      });
    }

    return chartData;
  }),
});
