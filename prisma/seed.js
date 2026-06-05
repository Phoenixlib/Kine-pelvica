import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper to create Cal.com Event Type using fetch
async function createCalComEventType(title, lengthInMinutes, description, apiKey, apiUrl) {
  if (!apiKey) {
    console.log(`[Cal.com] API Key missing. Skipping event creation for: ${title}`);
    return null;
  }

  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const baseUrl = apiUrl || "https://api.cal.com/v2";
  const url = `${baseUrl}/event-types`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-06-14",
      },
      body: JSON.stringify({
        title,
        slug,
        lengthInMinutes,
        description: description || "",
        disableGuests: true,
        bookingFields: [
          { type: "name", label: "Nombre completo", required: true },
          { type: "email", label: "Correo electrónico", required: true },
          { type: "phone", slug: "phone", label: "Número de teléfono", required: true },
          { type: "textarea", slug: "notes", label: "Notas adicionales", required: false },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Cal.com] Error creating event type ${title}:`, errText);
      return null;
    }

    const payload = await res.json();
    return payload.data;
  } catch (error) {
    console.error(`[Cal.com] Request failed for ${title}:`, error);
    return null;
  }
}

async function main() {
  console.log("Seeding database...");

  const apiKey = process.env.CALCOM_API_KEY;
  const apiUrl = process.env.CALCOM_API_URL;

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
      notes: "Paciente cursando segundo trimestre de embarazo (semana 24). Presenta dolor en sínfisis púbica de intensidad moderada, dolor se exacerba al caminar o cambiar de posición en la cama. Sin antecedentes quirúrgicos uroginecológicos. Evaluación de piso pélvico muestra tono basal adecuado, pero dificultad para mantener contracción (fuerza 3/5 en escala de Oxford). Plan: Ejercicios de estabilización lumbopélvica, educación sobre ergonomía y masajes perineales preparatorios.",
    },
    {
      firstName: "Valentina",
      lastName: "Silva Soto",
      email: "v.silvasoto@outlook.com",
      phone: "+56 9 7654 3210",
      notes: "Paciente derivada por ginecólogo por incontinencia urinaria de esfuerzo de 6 meses de evolución. Refiere pérdida de orina al toser, estornudar y realizar ejercicio físico de impacto (crossfit). Evaluación clínica: Hipotonía de piso pélvico (2/5 Oxford), hepermovilidad uretral leve. Sin dolor ni prolapso evidente. Plan de tratamiento: Biofeedback, electroestimulación y reeducación propioceptiva de musculatura perineal. Ejercicios hipopresivos.",
    },
    {
      firstName: "Javiera",
      lastName: "Contreras",
      email: "javiera.con@gmail.com",
      phone: "+56 9 6543 2109",
      notes: "Postparto de 3 meses. Parto vaginal instrumental con episiotomía mediana. Refiere dolor en cicatriz de episiotomía (dispareunia superficial). Evaluación: Cicatriz retraída y dolorosa a la palpación (EVA 6/10). Espasmo muscular secundario en elevador del ano. Plan: Terapia manual sobre la cicatriz, estiramientos de piso pélvico, lubricante y reintroducción gradual de relaciones sexuales con técnicas de relajación.",
    },
    {
      firstName: "Francisca",
      lastName: "Rojas",
      email: "fran.rojas@uach.cl",
      phone: "+56 9 5432 1098",
      notes: "Constipación crónica e incontinencia de gases ocasional. Dificultad para relajar piso pélvico durante la defecación. Plan: Educación en postura defecatoria, masajes abdominales y reeducación con balón rectal.",
    },
  ];

  const dbPatients = [];
  for (const p of patientsData) {
    let patient = await prisma.patient.findUnique({
      where: { email: p.email },
    });

    if (!patient) {
      patient = await prisma.patient.create({ data: p });
      console.log(`Created patient: ${p.firstName} ${p.lastName}`);
    } else {
      console.log(`Patient already exists: ${p.firstName} ${p.lastName}`);
    }
    dbPatients.push(patient);
  }

  // 3. Define Fallback Categories and Services to Seed
  const fallbackCategories = [
    {
      name: "Atenciones Pélvicas",
      services: [
        { name: "Evaluación pélvica", price: 35000, duration: 60, details: "Primera sesión pélvica. Conoceremos el enfoque del tratamiento según las necesidades..." },
        { name: "Hipopresivos", price: 30000, duration: 40, details: "Clase individual o grupal" },
        { name: "Control pélvico", price: 30000, duration: 60, details: "Sesión posterior a una evaluación pélvica 👩🏻‍⚕️" }
      ]
    },
    {
      name: "Preparación Durante el Embarazo",
      services: [
        { name: "Evaluación pélvica en el embarazo", price: 35000, duration: 40, details: "Se realiza una evaluación pélvica abdominal completa. Realizando ademas una evaluación de ph vaginal que permite conocer el estado..." },
        { name: "Gimnasia pre natal", price: 30000, duration: 40, details: "Clase grupal de 1-3 personas, la sesión se puede compartir con personas no embarazadas y le aumentamos las cargas." },
        { name: "Control embarazo", price: 30000, duration: 60, details: "Prepara tu cuerpo para que quede con los menos daños posibles durante tu embarazo ✨" },
        { name: "Taller embarazo: práctica de pujos", price: 30000, duration: 60, details: "Sesión dedicada a la educación del puño fisiológico y cómo podemos evitar desgarros durante la realización de ellos..." },
        { name: "Taller junto a pareja: manejo del dolor y qué hacer el día del nacimiento", price: 30000, duration: 40, details: "Sesión dedicada a entregar herramientas al acompañante..." }
      ]
    },
    {
      name: "Drenaje, Cicatrices y Masajes",
      services: [
        { name: "Manejo de cicatrices", price: 30000, duration: 60, details: "Tratamiento de cicatrices de cualquier zona del cuerpo." },
        { name: "Drenaje linfático", price: 30000, duration: 60, details: "- Post operatorios\n- Embarazos" },
        { name: "Masaje descontracturante", price: 30000, duration: 60, details: "Justo y necesario 🙌🏻" }
      ]
    },
    {
      name: "Respiratorio",
      services: [
        { name: "Kinesiterapia respiratoria infantil", price: 30000, duration: 40, details: "Realizadas con amor y cariño + educación a padres y manejo en casa" }
      ]
    },
    {
      name: "Servicios Empresas",
      services: [
        { name: "Charla corporativa educativa", price: 40000, duration: 60, details: "" }
      ]
    }
  ];

  const activeServiceIds = [];

  // Seed Categories & Services
  for (let i = 0; i < fallbackCategories.length; i++) {
    const cat = fallbackCategories[i];
    let dbCategory = await prisma.serviceCategory.findFirst({
      where: { name: { equals: cat.name, mode: "insensitive" } }
    });

    if (!dbCategory) {
      dbCategory = await prisma.serviceCategory.create({
        data: {
          name: cat.name,
          order: i + 1,
          isActive: true
        }
      });
      console.log(`Created category: ${cat.name}`);
    } else {
      dbCategory = await prisma.serviceCategory.update({
        where: { id: dbCategory.id },
        data: { order: i + 1, isActive: true }
      });
      console.log(`Updated category: ${cat.name}`);
    }

    for (let j = 0; j < cat.services.length; j++) {
      const srv = cat.services[j];
      let dbService = await prisma.service.findFirst({
        where: { name: { equals: srv.name, mode: "insensitive" } }
      });

      let calComEventTypeId = null;
      let calComBookingUrl = null;
      let calComSlug = null;

      if (!dbService) {
        // Try creating on Cal.com
        const calEvent = await createCalComEventType(srv.name, srv.duration, srv.details, apiKey, apiUrl);
        if (calEvent) {
          calComEventTypeId = calEvent.id;
          calComBookingUrl = calEvent.bookingUrl || `https://cal.com/camila-ortiz/${calEvent.slug}`;
          calComSlug = calEvent.slug;
          console.log(`[Cal.com] Created event type for new service: ${srv.name}`);
        } else {
          calComBookingUrl = `https://cal.com/camila-ortiz/${srv.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        }

        dbService = await prisma.service.create({
          data: {
            name: srv.name,
            price: srv.price,
            duration: srv.duration,
            description: srv.details || null,
            categoryId: dbCategory.id,
            order: j + 1,
            isActive: true,
            calComEventTypeId,
            calComBookingUrl,
            calComSlug
          }
        });
        console.log(`Created service: ${srv.name}`);
      } else {
        calComEventTypeId = dbService.calComEventTypeId;
        calComBookingUrl = dbService.calComBookingUrl;
        calComSlug = dbService.calComSlug;

        // If it doesn't have Cal.com linked, try linking it now
        if (!calComEventTypeId && apiKey) {
          const calEvent = await createCalComEventType(srv.name, srv.duration, srv.details, apiKey, apiUrl);
          if (calEvent) {
            calComEventTypeId = calEvent.id;
            calComBookingUrl = calEvent.bookingUrl || `https://cal.com/camila-ortiz/${calEvent.slug}`;
            calComSlug = calEvent.slug;
            console.log(`[Cal.com] Created & linked event type for existing service: ${srv.name}`);
          }
        }

        dbService = await prisma.service.update({
          where: { id: dbService.id },
          data: {
            price: srv.price,
            duration: srv.duration,
            description: srv.details || null,
            categoryId: dbCategory.id,
            order: j + 1,
            isActive: true,
            calComEventTypeId,
            calComBookingUrl,
            calComSlug
          }
        });
        console.log(`Updated service: ${srv.name}`);
      }

      activeServiceIds.push(dbService.id);
    }
  }

  // Deactivate any services not in the fallback list (keeps DB clean)
  const deactivatedCount = await prisma.service.updateMany({
    where: {
      id: { notIn: activeServiceIds }
    },
    data: {
      isActive: false
    }
  });
  if (deactivatedCount.count > 0) {
    console.log(`Deactivated ${deactivatedCount.count} legacy services.`);
  }

  // 4. Create Sample Appointments
  // Fetch services for appointment links
  const evalPelvica = await prisma.service.findFirst({ where: { name: { equals: "Evaluación pélvica", mode: "insensitive" } } });
  const hipopresivos = await prisma.service.findFirst({ where: { name: { equals: "Hipopresivos", mode: "insensitive" } } });
  const cicatrices = await prisma.service.findFirst({ where: { name: { equals: "Manejo de cicatrices", mode: "insensitive" } } });

  if (evalPelvica && hipopresivos && cicatrices) {
    const apptsData = [
      {
        patientId: dbPatients[0].id,
        title: evalPelvica.name,
        serviceId: evalPelvica.id,
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
        title: hipopresivos.name,
        serviceId: hipopresivos.id,
        date: (() => {
          const d = new Date();
          d.setHours(11, 30, 0, 0);
          return d;
        })(),
        durationMinutes: 40,
        status: "BOOKED",
        paymentMethod: null,
        notes: "Sesión 2 programada.",
      },
      {
        patientId: dbPatients[2].id,
        title: cicatrices.name,
        serviceId: cicatrices.id,
        date: (() => {
          const d = new Date();
          d.setDate(d.getDate() + 1); // Tomorrow
          d.setHours(15, 0, 0, 0);
          return d;
        })(),
        durationMinutes: 60,
        status: "BOOKED",
        paymentMethod: "CASH_PENDING",
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
  }

  // 5. Create 8 Community Messages
  const communityMessagesData = [
    {
      name: "Constanza R.",
      email: "coni.r@gmail.com",
      type: "EXPERIENCE",
      message: "¡Excelente profesional! Asistí a mis sesiones de kinesiología postparto con Camila y la diferencia fue increíble. Su empatía y dedicación me ayudaron a recuperarme por completo y a retomar mi vida deportiva sin miedos ni molestias.",
      status: "PUBLISHED_IN_BLOG",
      createdAt: new Date("2026-05-10T14:30:00Z"),
    },
    {
      name: "Andrea Toledo",
      email: "andrea.toledo@live.cl",
      type: "QUESTION",
      message: "Hola Camila, quería consultar si es posible iniciar la preparación de piso pélvico para el parto si ya estoy en la semana 32 de gestación, o si ya es muy tarde. ¡Quedo atenta!",
      status: "PENDING",
      createdAt: new Date("2026-06-01T09:15:00Z"),
    },
    {
      name: "Javiera Ignacia",
      email: "javi.ignacia@outlook.com",
      type: "EXPERIENCE",
      message: "Fui por una cicatriz de cesárea que estaba muy adherida y dolorosa. Desde la segunda sesión de terapia manual sentí un alivio enorme. Súper recomendada, explica todo con mucha paciencia.",
      status: "READ",
      createdAt: new Date("2026-05-20T17:45:00Z"),
    },
    {
      name: "Camila V.",
      email: "camilav@gmail.com",
      type: "QUESTION",
      message: "Estimada, sufro de dolor constante en la zona pélvica al estar sentada por mucho tiempo en el trabajo. ¿La evaluación kinésica me podría ayudar a identificar si es muscular?",
      status: "PENDING",
      createdAt: new Date("2026-06-03T11:00:00Z"),
    },
    {
      name: "María Francisca",
      email: "fran.rojas@gmail.com",
      type: "EXPERIENCE",
      message: "Estuve meses con incontinencia de esfuerzo al reírme o toser y me daba mucha vergüenza. Con el entrenamiento guiado por Cami logré resolverlo. Me cambió la vida y recuperé mi seguridad.",
      status: "PUBLISHED_IN_BLOG",
      createdAt: new Date("2026-05-15T10:00:00Z"),
    },
    {
      name: "Pilar Osorio",
      email: "pilar.o@gmail.com",
      type: "QUESTION",
      message: "Hola Camila, ¿los talleres de pujos e información para el parto se pueden realizar junto con la pareja? ¿Tiene algún costo adicional si va acompañado?",
      status: "PENDING",
      createdAt: new Date("2026-06-04T15:20:00Z"),
    },
    {
      name: "Lorena Sepúlveda",
      email: "lore.sepul@gmail.com",
      type: "EXPERIENCE",
      message: "Asistí a las clases de gimnasia prenatal y fueron lo máximo. Camila adapta cada ejercicio a cómo te sientes ese día, cuidando siempre tu piso pélvico. Llegué fuerte y preparada al parto.",
      status: "READ",
      createdAt: new Date("2026-05-28T16:10:00Z"),
    },
    {
      name: "Valentina G.",
      email: "valeg@gmail.com",
      type: "QUESTION",
      message: "Hola, una consulta. ¿Tienen convenio directo con Isapres o emiten boleta de honorarios para que yo gestione el reembolso de forma manual?",
      status: "PENDING",
      createdAt: new Date("2026-06-04T18:40:00Z"),
    },
  ];

  for (const msg of communityMessagesData) {
    const existingMsg = await prisma.communityMessage.findFirst({
      where: {
        email: msg.email,
        message: { startsWith: msg.message.substring(0, 30) }
      }
    });

    if (!existingMsg) {
      await prisma.communityMessage.create({ data: msg });
      console.log(`Created community message from: ${msg.name}`);
    } else {
      console.log(`Community message from ${msg.name} already exists.`);
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
