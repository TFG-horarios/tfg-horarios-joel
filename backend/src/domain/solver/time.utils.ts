export interface ShiftConfig {
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

// Convierte un slot en una hora real
export function slotToTime(slotIndex: number, config: ShiftConfig): string {
  const [hours, minutes] = config.startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + slotIndex * config.slotDurationMinutes;
  
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  
  return `${h}:${m}`;
}

// Calcula cuántos slots totales hay en el turno
export function calculateTotalSlots(config: ShiftConfig): number {
  const [startH, startM] = config.startTime.split(':').map(Number);
  const [endH, endM] = config.endTime.split(':').map(Number);

  const startTotalMinutes = startH * 60 + startM;
  const endTotalMinutes = endH * 60 + endM;

  return Math.floor((endTotalMinutes - startTotalMinutes) / config.slotDurationMinutes);
}