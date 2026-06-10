import { addMinutes } from "date-fns";

export function detectSchedulingClash(
  selectedDate: string,
  selectedTime: string,
  durationMinutes: number,
  dayAppointments: any[] | undefined,
  dayBlocks: any[] | undefined,
  excludeApptId?: string
): boolean {
  if (!selectedDate || !selectedTime || (!dayAppointments && !dayBlocks)) {
    return false;
  }

  const newStart = new Date(`${selectedDate}T${selectedTime}:00`);
  const newEnd = addMinutes(newStart, durationMinutes);

  const hasApptClash = dayAppointments?.some((a) => {
    if (excludeApptId && a.id === excludeApptId) return false;
    const apptStart = new Date(a.date);
    const apptEnd = addMinutes(apptStart, a.durationMinutes);
    return newStart < apptEnd && newEnd > apptStart && a.status !== "CANCELLED";
  }) ?? false;

  const hasBlockClash = dayBlocks?.some((block) => {
    const blockStart = new Date(block.startAt);
    const blockEnd = new Date(block.endAt);
    return newStart < blockEnd && newEnd > blockStart;
  }) ?? false;

  return hasApptClash || hasBlockClash;
}
