import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { randomUUID } from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Database
  const db = {
    clients: [
      { id: "1", name: "Alice Johnson", email: "alice@example.com", phone: "+1 555-0101", status: "Active", lastVisit: "2026-05-10" },
      { id: "2", name: "Robert Smith", email: "robert@example.com", phone: "+1 555-0102", status: "Active", lastVisit: "2026-05-18" },
      { id: "3", name: "Maria Garcia", email: "maria@example.com", phone: "+1 555-0103", status: "Inactive", lastVisit: "2026-01-05" },
    ],
    appointments: [
      { id: "1", clientId: "1", title: "Therapy Session", date: new Date().toISOString(), durationMinutes: 60, status: "Confirmed", paymentStatus: "Paid" },
      { id: "2", clientId: "2", title: "Consultation", date: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 30, status: "Pending", paymentStatus: "Unpaid" },
    ],
    stats: {
      revenueToday: 450,
      appointmentsToday: 8,
      newClientsThisWeek: 12,
      retentionRate: 85
    }
  };

  // --- API Routes ---
  const apiRouter = express.Router();

  apiRouter.get("/dashboard/stats", (req, res) => {
    // In a real app, calculate these dynamically
    res.json(db.stats);
  });

  apiRouter.get("/dashboard/chart", (req, res) => {
    // Activity over the last 7 days
    const data = [
      { name: 'Mon', revenue: 400, appointments: 4 },
      { name: 'Tue', revenue: 300, appointments: 3 },
      { name: 'Wed', revenue: 550, appointments: 6 },
      { name: 'Thu', revenue: 200, appointments: 2 },
      { name: 'Fri', revenue: 700, appointments: 8 },
      { name: 'Sat', revenue: 800, appointments: 10 },
      { name: 'Sun', revenue: 0, appointments: 0 },
    ];
    res.json(data);
  });

  apiRouter.get("/clients", (req, res) => {
    res.json(db.clients);
  });

  apiRouter.post("/clients", (req, res) => {
    const newClient = {
      id: randomUUID(),
      ...req.body,
      status: "Active",
      lastVisit: new Date().toISOString().split('T')[0]
    };
    db.clients.push(newClient);
    res.status(201).json(newClient);
  });

  apiRouter.get("/appointments", (req, res) => {
    res.json(db.appointments);
  });
  
  apiRouter.post("/appointments", (req, res) => {
    const newAppt = {
      id: randomUUID(),
      ...req.body,
      status: "Confirmed",
      paymentStatus: "Unpaid"
    };
    db.appointments.push(newAppt);
    res.status(201).json(newAppt);
  });

  app.use("/api", apiRouter);

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Express v4 fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
