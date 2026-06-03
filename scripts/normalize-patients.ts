import { db as prisma } from "../src/server/db";

const formatPhone = (phone: string): string | null => {
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    cleanPhone = '+56' + cleanPhone;
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('569')) {
    cleanPhone = '+' + cleanPhone;
  } else if (cleanPhone.length === 8) {
     cleanPhone = '+569' + cleanPhone;
  }
  
  if (/^\+569\d{8}$/.test(cleanPhone)) return cleanPhone;
  if (/^\+\d{10,15}$/.test(cleanPhone)) return cleanPhone;
  
  return null;
};

async function main() {
  console.log('Iniciando normalización de pacientes...');
  const patients = await prisma.patient.findMany();
  
  let updatedCount = 0;

  for (const patient of patients) {
    let updateData: any = {};
    
    if (patient.phone) {
      const newPhone = formatPhone(patient.phone);
      if (newPhone && newPhone !== patient.phone) {
        updateData.phone = newPhone;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: updateData
      });
      console.log(`Actualizado paciente ${patient.firstName} ${patient.lastName}:`, updateData);
      updatedCount++;
    }
  }

  console.log(`\n¡Normalización completada! Se actualizaron ${updatedCount} pacientes.`);
}

main()
  .catch(e => {
    console.error('Error durante la normalización:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

