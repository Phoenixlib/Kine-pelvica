import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const patients = await prisma.patient.findMany({
    select: { id: true, phone: true }
  });
  
  const phoneCounts = new Map<string, number>();
  for (const p of patients) {
    if (p.phone) {
      phoneCounts.set(p.phone, (phoneCounts.get(p.phone) || 0) + 1);
    }
  }

  const duplicates = Array.from(phoneCounts.entries()).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log("Duplicate phones found:", duplicates);
  } else {
    console.log("No duplicate phones found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
