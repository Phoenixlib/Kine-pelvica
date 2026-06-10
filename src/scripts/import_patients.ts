import XLSX from 'xlsx';
import { db } from "../server/db";

const filePath = "/home/pablo-finix/DEV/kine pelvica/base de clientes.xlsx";
const shouldWrite = process.argv.includes('--write');

function normalizePhone(phone: any): string {
  if (!phone) return '';
  let clean = String(phone).replace(/\s+/g, '').replace(/[+\-()]/g, '');
  
  if (clean.startsWith('56')) {
    return '+' + clean;
  }
  if (clean.length === 9 && clean.startsWith('9')) {
    return '+56' + clean;
  }
  if (clean.length === 8) {
    return '+569' + clean;
  }
  
  return '+' + clean;
}

function normalizeEmail(email: any): string | null {
  if (!email) return null;
  const clean = String(email).trim().toLowerCase();
  if (!clean || clean === 'null' || !clean.includes('@')) return null;
  return clean;
}

async function main() {
  console.log("========================================");
  console.log("IMPORTADOR DE PACIENTES DESDE EXCEL");
  console.log(`Archivo: ${filePath}`);
  console.log(`Modo: ${shouldWrite ? 'ESCRITURA (Real)' : 'SIMULACIÓN (Dry Run)'}`);
  console.log("========================================");

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("No sheets found in workbook");
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) throw new Error("Worksheet not found");
  
  const rows = XLSX.utils.sheet_to_json<any>(worksheet);
  console.log(`Filas encontradas en Excel: ${rows.length}`);

  const existingPatients = await db.patient.findMany();
  console.log(`Pacientes actuales en DB: ${existingPatients.length}`);

  const dbByPhone = new Map<string, typeof existingPatients[0]>();
  const dbByEmail = new Map<string, typeof existingPatients[0]>();

  for (const p of existingPatients) {
    if (p.phone) dbByPhone.set(p.phone, p);
    if (p.email) dbByEmail.set(p.email, p);
  }

  const toInsert: any[] = [];
  const duplicates: any[] = [];
  const conflicts: any[] = [];
  
  const processedPhones = new Set<string>();
  const processedEmails = new Set<string>();

  for (const row of rows) {
    const firstName = String(row['Nombres'] || '').trim();
    const lastName = String(row['Apellidos'] || '').trim();
    const phone = normalizePhone(row['Teléfono']);
    const email = normalizeEmail(row['Email']);
    const genderVal = row['Género. 1 = Femenino, 2 = Masculino'];
    const createdAtStr = row['Fecha de creación.'];

    if (!firstName && !lastName) continue;
    if (!phone) continue;

    if (processedPhones.has(phone)) {
      duplicates.push({ row, reason: `Teléfono duplicado en el propio Excel (${phone})` });
      continue;
    }
    if (email && processedEmails.has(email)) {
      duplicates.push({ row, reason: `Email duplicado en el propio Excel (${email})` });
      continue;
    }

    const existingByPhone = dbByPhone.get(phone);
    if (existingByPhone) {
      duplicates.push({ row, reason: `Teléfono ya existe en DB (${phone})` });
      continue;
    }

    if (email) {
      const existingByEmail = dbByEmail.get(email);
      if (existingByEmail) {
        duplicates.push({ row, reason: `Email ya existe en DB (${email})` });
        continue;
      }
    }

    processedPhones.add(phone);
    if (email) processedEmails.add(email);

    let notes = '';
    if (createdAtStr) notes += `Fecha registro original: ${createdAtStr}.`;
    if (genderVal !== undefined) {
      const gender = genderVal === 1 ? 'Femenino' : genderVal === 2 ? 'Masculino' : 'No especificado';
      notes += ` Género original: ${gender}.`;
    }

    toInsert.push({
      firstName,
      lastName,
      phone,
      email,
      notes: notes.trim(),
    });
  }

  console.log("\n----------------------------------------");
  console.log("RESUMEN DEL PROCESO:");
  console.log("----------------------------------------");
  console.log(`Pacientes a INSERTAR nuevos : ${toInsert.length}`);
  console.log(`Pacientes DUPLICADOS (omitidos) : ${duplicates.length}`);
  console.log(`Conflictos de datos detectados : ${conflicts.length}`);
  console.log("----------------------------------------\n");

  if (shouldWrite) {
    console.log("Insertando registros en la base de datos...");
    for (const patient of toInsert) {
      await db.patient.create({
        data: patient
      });
    }
    console.log("[✓] ¡Inserción exitosa!");
  } else {
    console.log("[!] Para proceder con la inserción de estos pacientes, vuelve a ejecutar el comando con el argumento: --write");
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());