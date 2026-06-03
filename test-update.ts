import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const patient = await prisma.patient.findFirst();
  if (!patient) {
    console.log("No patients found.");
    return;
  }
  
  try {
    const res = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email || null,
        phone: "+56912345678",
        notes: patient.notes || null,
      },
    });
    console.log("Success:", res);
  } catch (err: any) {
    console.error("Prisma Error:");
    console.error(err.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
