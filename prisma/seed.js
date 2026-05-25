import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Admin User
  const adminEmail = "admin@estudiopelvico.cl";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "Camila Ortiz",
        email: adminEmail,
        password: hashedPassword,
      },
    });
    console.log(`Created admin user: ${adminEmail} (password: admin123)`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // 2. Create Sample Patients
  const patientsData = [
    {
      name: "María José Valenzuela",
      email: "maria.valenzuela@gmail.com",
      phone: "+56 9 8765 4321",
      rut: "18.345.678-2",
      birthDate: new Date("1992-05-15"),
      notes: "Paciente cursando segundo trimestre de embarazo (semana 24). Presenta dolor en sínfisis púbica de intensidad moderada, dolor se exacerba al caminar o cambiar de posición en la cama. Sin antecedentes quirúrgicos uroginecológicos. Evaluación de piso pélvico muestra tono basal adecuado, pero dificultad para mantener contracción (fuerza 3/5 en escala de Oxford). Plan: Ejercicios de estabilización lumbopélvica, educación sobre ergonomía y masajes perineales preparatorios.",
      status: "Active",
    },
    {
      name: "Valentina Silva Soto",
      email: "v.silvasoto@outlook.com",
      phone: "+56 9 7654 3210",
      rut: "19.876.543-K",
      birthDate: new Date("1996-11-20"),
      notes: "Paciente derivada por ginecólogo por incontinencia urinaria de esfuerzo de 6 meses de evolución. Refiere pérdida de orina al toser, estornudar y realizar ejercicio físico de impacto (crossfit). Evaluación clínica: Hipotonía de piso pélvico (2/5 Oxford), hipermovilidad uretral leve. Sin dolor ni prolapso evidente. Plan de tratamiento: Biofeedback, electroestimulación y reeducación propioceptiva de musculatura perineal. Ejercicios hipopresivos.",
      status: "Active",
    },
    {
      name: "Javiera Contreras",
      email: "javiera.con@gmail.com",
      phone: "+56 9 6543 2109",
      rut: "16.123.456-7",
      birthDate: new Date("1988-08-03"),
      notes: "Postparto de 3 meses. Parto vaginal instrumental con episiotomía mediana. Refiere dolor en cicatriz de episiotomía (dispareunia superficial). Evaluación: Cicatriz retraída y dolorosa a la palpación (EVA 6/10). Espasmo muscular secundario en elevador del ano. Plan: Terapia manual sobre la cicatriz, estiramientos de piso pélvico, lubricante y reintroducción gradual de relaciones sexuales con técnicas de relajación.",
      status: "Active",
    },
    {
      name: "Francisca Rojas",
      email: "fran.rojas@uach.cl",
      phone: "+56 9 5432 1098",
      rut: "20.234.567-8",
      birthDate: new Date("1999-02-28"),
      notes: "Constipación crónica e incontinencia de gases ocasional. Dificultad para relajar piso pélvico durante la defecación. Plan: Educación en postura defecatoria, masajes abdominales y reeducación con balón rectal.",
      status: "Active",
    },
  ];

  const dbPatients = [];
  for (const p of patientsData) {
    let patient = await prisma.patient.findUnique({
      where: { rut: p.rut },
    });

    if (!patient) {
      patient = await prisma.patient.create({ data: p });
      console.log(`Created patient: ${p.name}`);
    } else {
      console.log(`Patient already exists: ${p.name}`);
    }
    dbPatients.push(patient);
  }

  // 3. Create Sample Appointments (Spread over today, yesterday, and future days)
  const apptsData = [
    {
      patientId: dbPatients[0].id,
      title: "Evaluación Kinesiología de Piso Pélvico",
      serviceCategory: "ATENCIONES PÉLVICAS",
      date: (() => {
        const d = new Date();
        d.setHours(9, 0, 0, 0);
        return d;
      })(),
      durationMinutes: 60,
      status: "Confirmed",
      paymentStatus: "Paid",
      amountPaid: 35000,
      notes: "Evaluación inicial de piso pélvico. Se explican objetivos del tratamiento y anatomía.",
    },
    {
      patientId: dbPatients[1].id,
      title: "Tratamiento de Incontinencia de Esfuerzo",
      serviceCategory: "ATENCIONES PÉLVICAS",
      date: (() => {
        const d = new Date();
        d.setHours(11, 30, 0, 0);
        return d;
      })(),
      durationMinutes: 60,
      status: "Confirmed",
      paymentStatus: "Unpaid",
      amountPaid: 30000,
      notes: "Sesión 2. Biofeedback e introducción de ejercicios hipopresivos.",
    },
    {
      patientId: dbPatients[2].id,
      title: "Tratamiento de Cicatriz y Terapia Manual",
      serviceCategory: "DRENAJE-CICATRICES-MASAJES",
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1); // Tomorrow
        d.setHours(15, 0, 0, 0);
        return d;
      })(),
      durationMinutes: 60,
      status: "Confirmed",
      paymentStatus: "Paid",
      amountPaid: 35000,
      notes: "Sesión de elastificación de cicatriz con ultrasonido y terapia manual.",
    },
    {
      patientId: dbPatients[3].id,
      title: "Masaje de Relajación y Drenaje Linfático",
      serviceCategory: "DRENAJE-CICATRICES-MASAJES",
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 1); // Yesterday
        d.setHours(10, 0, 0, 0);
        return d;
      })(),
      durationMinutes: 60,
      status: "Confirmed",
      paymentStatus: "Paid",
      amountPaid: 40000,
      notes: "Sesión completada y pagada.",
    },
    {
      patientId: dbPatients[0].id,
      title: "Kinesiología Obstétrica - Control",
      serviceCategory: "PREPARACIÓN DURANTE EL EMBARAZO",
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 2); // 2 days later
        d.setHours(16, 30, 0, 0);
        return d;
      })(),
      durationMinutes: 60,
      status: "Confirmed",
      paymentStatus: "Partial",
      amountPaid: 20000,
      notes: "Control de preparación del parto, ejercicios con balón y respiración diafragmática.",
    },
  ];

  for (const a of apptsData) {
    const existingAppt = await prisma.appointment.findFirst({
      where: {
        patientId: a.patientId,
        date: a.date,
      },
    });

    if (!existingAppt) {
      await prisma.appointment.create({ data: a });
      console.log(`Created appointment for client ${a.patientId} at ${a.date}`);
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
