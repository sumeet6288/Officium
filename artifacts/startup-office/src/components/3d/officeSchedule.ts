/* ─── Realistic office schedule ────────────────────────────────────────────
   Uses real wall-clock time so the simulation feels like a real workplace.
   ─────────────────────────────────────────────────────────────────────── */

export const OFFICE_OPEN_HOUR  = 9   // 09:00
export const OFFICE_CLOSE_HOUR = 17  // 17:00

export function isWeekend(d = new Date()): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

export function isOfficeOpen(d = new Date()): boolean {
  if (isWeekend(d)) return false
  const h = d.getHours()
  return h >= OFFICE_OPEN_HOUR && h < OFFICE_CLOSE_HOUR
}

export type ScheduledActivity =
  | 'work'
  | 'standup'     // Mon/Wed/Fri 09:30–10:00
  | 'lunch'       // 12:00–13:00
  | 'coffee_break'// 15:00–15:30
  | 'end_of_day'  // before 9 or after 17

export function getScheduledActivity(d = new Date()): ScheduledActivity {
  if (!isOfficeOpen(d)) return 'end_of_day'
  const totalMin = d.getHours() * 60 + d.getMinutes()
  const day = d.getDay() // 1=Mon 3=Wed 5=Fri
  if ([1, 3, 5].includes(day) && totalMin >= 9 * 60 + 30 && totalMin < 10 * 60) return 'standup'
  if (totalMin >= 12 * 60 && totalMin < 13 * 60) return 'lunch'
  if (totalMin >= 15 * 60 && totalMin < 15 * 60 + 30) return 'coffee_break'
  return 'work'
}

export function getOfficeClock(d = new Date()): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function getOfficeStatusLine(d = new Date()): { text: string; open: boolean } {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const dayName = days[d.getDay()]
  if (isWeekend(d)) return { text: `${dayName} · Weekend — office closed`, open: false }
  if (!isOfficeOpen(d)) {
    const h = d.getHours()
    if (h < OFFICE_OPEN_HOUR) return { text: `${dayName} · Pre-hours (opens 9 AM)`, open: false }
    return { text: `${dayName} · After hours (closed 5 PM)`, open: false }
  }
  const sched = getScheduledActivity(d)
  if (sched === 'standup')      return { text: `${dayName} · 🗣️ Morning standup`, open: true }
  if (sched === 'lunch')        return { text: `${dayName} · 🍱 Lunch break`, open: true }
  if (sched === 'coffee_break') return { text: `${dayName} · ☕ Afternoon break`, open: true }
  return { text: `${dayName} · 💼 Office open  9AM–5PM`, open: true }
}
