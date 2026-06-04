import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { sanityClient } from "~/lib/sanity";

export const statsRouter = createTRPCRouter({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const thirtyDaysAgo = subDays(today, 30);

    // 1. Appointments Today
    const appointmentsTodayCount = await ctx.db.appointment.count({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 2. Unread Community Messages
    const unreadMessagesCount = await ctx.db.communityMessage.count({
      where: {
        status: "PENDING",
      },
    });

    // 3. Blog Articles Count from Sanity
    let blogArticlesCount = 0;
    try {
      if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== "placeholder") {
        blogArticlesCount = await sanityClient.fetch<number>('count(*[_type == "post"])');
      }
    } catch (error) {
      console.error("Error fetching blog post count from Sanity:", error);
    }

    // 4. Attendance vs Cancellation Rate (Last 30 days)
    const appointmentsLast30Days = await ctx.db.appointment.findMany({
      where: {
        date: { gte: thirtyDaysAgo, lte: todayEnd },
      },
    });
    
    let attendedCount = 0;
    let cancelledCount = 0;
    let noShowCount = 0;

    appointmentsLast30Days.forEach(appt => {
      if (appt.status === "ATTENDED") attendedCount++;
      else if (appt.status === "CANCELLED") cancelledCount++;
      else if (appt.status === "NO_SHOW") noShowCount++;
    });

    const totalFinished = attendedCount + cancelledCount + noShowCount;
    const attendanceRate = totalFinished > 0 
      ? Math.round((attendedCount / totalFinished) * 100) 
      : 0;

    return {
      appointmentsToday: appointmentsTodayCount,
      unreadMessages: unreadMessagesCount,
      blogArticles: blogArticlesCount,
      attendanceRate,
    };
  }),

  getServicesChartData: protectedProcedure.query(async ({ ctx }) => {
    // Get appointments from the last 30 days to see requested services
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentAppointments = await ctx.db.appointment.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        serviceId: { not: null },
      },
      include: {
        service: true,
      },
    });

    const serviceCounts: Record<string, number> = {};
    recentAppointments.forEach((appt) => {
      if (appt.service?.name) {
        serviceCounts[appt.service.name] = (serviceCounts[appt.service.name] || 0) + 1;
      }
    });

    // Format for Recharts
    const chartData = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5 services

    return chartData;
  }),
});
