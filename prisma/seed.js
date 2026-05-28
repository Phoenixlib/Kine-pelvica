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
      firstName: "María José",
      lastName: "Valenzuela",
      email: "maria.valenzuela@gmail.com",
      phone: "+56 9 8765 4321",
      rut: "18.345.678-2",
      birthDate: new Date("1992-05-15"),
      notes: "Paciente cursando segundo trimestre de embarazo (semana 24). Presenta dolor en sínfisis púbica de intensidad moderada, dolor se exacerba al caminar o cambiar de posición en la cama. Sin antecedentes quirúrgicos uroginecológicos. Evaluación de piso pélvico muestra tono basal adecuado, pero dificultad para mantener contracción (fuerza 3/5 en escala de Oxford). Plan: Ejercicios de estabilización lumbopélvica, educación sobre ergonomía y masajes perineales preparatorios.",
      status: "ACTIVE",
    },
    {
      firstName: "Valentina",
      lastName: "Silva Soto",
      email: "v.silvasoto@outlook.com",
      phone: "+56 9 7654 3210",
      rut: "19.876.543-K",
      birthDate: new Date("1996-11-20"),
      notes: "Paciente derivada por ginecólogo por incontinencia urinaria de esfuerzo de 6 meses de evolución. Refiere pérdida de orina al toser, estornudar y realizar ejercicio físico de impacto (crossfit). Evaluación clínica: Hipotonía de piso pélvico (2/5 Oxford), hipermovilidad uretral leve. Sin dolor ni prolapso evidente. Plan de tratamiento: Biofeedback, electroestimulación y reeducación propioceptiva de musculatura perineal. Ejercicios hipopresivos.",
      status: "ACTIVE",
    },
    {
      firstName: "Javiera",
      lastName: "Contreras",
      email: "javiera.con@gmail.com",
      phone: "+56 9 6543 2109",
      rut: "16.123.456-7",
      birthDate: new Date("1988-08-03"),
      notes: "Postparto de 3 meses. Parto vaginal instrumental con episiotomía mediana. Refiere dolor en cicatriz de episiotomía (dispareunia superficial). Evaluación: Cicatriz retraída y dolorosa a la palpación (EVA 6/10). Espasmo muscular secundario en elevador del ano. Plan: Terapia manual sobre la cicatriz, estiramientos de piso pélvico, lubricante y reintroducción gradual de relaciones sexuales con técnicas de relajación.",
      status: "ACTIVE",
    },
    {
      firstName: "Francisca",
      lastName: "Rojas",
      email: "fran.rojas@uach.cl",
      phone: "+56 9 5432 1098",
      rut: "20.234.567-8",
      birthDate: new Date("1999-02-28"),
      notes: "Constipación crónica e incontinencia de gases ocasional. Dificultad para relajar piso pélvico durante la defecación. Plan: Educación en postura defecatoria, masajes abdominales y reeducación con balón rectal.",
      status: "ACTIVE",
    },
  ];

  const dbPatients = [];
  for (const p of patientsData) {
    let patient = await prisma.patient.findUnique({
      where: { rut: p.rut },
    });

    if (!patient) {
      patient = await prisma.patient.create({ data: p });
      console.log(`Created patient: ${p.firstName} ${p.lastName}`);
    } else {
      console.log(`Patient already exists: ${p.firstName} ${p.lastName}`);
    }
    dbPatients.push(patient);
  }

  // 3. Create Categories and Services
  const categoryPelvica = await prisma.serviceCategory.create({
    data: { name: "Atenciones Pélvicas", order: 1 }
  });
  const categoryCicatrices = await prisma.serviceCategory.create({
    data: { name: "Drenaje, Cicatrices y Masajes", order: 2 }
  });

  const service1 = await prisma.service.create({
    data: {
      name: "Evaluación Kinesiología de Piso Pélvico",
      price: 35000,
      duration: 60,
      description: "Evaluación inicial de piso pélvico. Objetivos de tratamiento y anatomía.",
      categoryId: categoryPelvica.id,
      order: 1
    }
  });

  const service2 = await prisma.service.create({
    data: {
      name: "Tratamiento de Incontinencia de Esfuerzo",
      price: 30000,
      duration: 60,
      description: "Biofeedback e introducción de ejercicios hipopresivos.",
      categoryId: categoryPelvica.id,
      order: 2
    }
  });

  const service3 = await prisma.service.create({
    data: {
      name: "Tratamiento de Cicatriz y Terapia Manual",
      price: 35000,
      duration: 60,
      description: "Sesión de elastificación de cicatriz con ultrasonido y terapia manual.",
      categoryId: categoryCicatrices.id,
      order: 1
    }
  });

  // 4. Create Sample Appointments
  const apptsData = [
    {
      patientId: dbPatients[0].id,
      title: service1.name,
      serviceId: service1.id,
      date: (() => {
        const d = new Date();
        d.setHours(9, 0, 0, 0);
        return d;
      })(),
      durationMinutes: 60,
      status: "ATTENDED",
      paymentMethod: "TRANSFER",
      notes: "Evaluación inicial de piso pélvico realizada con éxito.",
    },
    {
      patientId: dbPatients[1].id,
      title: service2.name,
      serviceId: service2.id,
      date: (() => {
        const d = new Date();
        d.setHours(11, 30, 0, 0);
        return d;
      })(),
      durationMinutes: 60,
      status: "BOOKED",
      paymentMethod: null,
      notes: "Sesión 2 programada.",
    },
    {
      patientId: dbPatients[2].id,
      title: service3.name,
      serviceId: service3.id,
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1); // Tomorrow
        d.setHours(15, 0, 0, 0);
        return d;
      })(),
      durationMinutes: 60,
      status: "CASH_PENDING",
      paymentMethod: "CASH",
      notes: "Sesión de elastificación de cicatriz. Paciente pagará en efectivo el día de la cita.",
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
