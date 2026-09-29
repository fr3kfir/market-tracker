// "My plants" persistence in localStorage. Every access is guarded: storage can be
// unavailable (private mode) or full, and the app must keep working without it.
const KEY = 'plant-parent:garden:v1'

export function loadGarden() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveGarden(plants) {
  try {
    localStorage.setItem(KEY, JSON.stringify(plants))
    return true
  } catch {
    return false
  }
}

const DAY = 24 * 60 * 60 * 1000

export function waterStatus(plant, now = Date.now()) {
  const interval = Math.max(1, plant.wateringIntervalDays || 7)
  const last = plant.lastWatered ? new Date(plant.lastWatered).getTime() : null
  if (!last) return { label: 'עוד לא סומנה השקיה', tone: 'muted', daysLeft: null }
  const daysLeft = Math.ceil((last + interval * DAY - now) / DAY)
  if (daysLeft < 0) return { label: `איחור של ${-daysLeft} ימים בהשקיה`, tone: 'bad', daysLeft }
  if (daysLeft === 0) return { label: 'להשקות היום', tone: 'warn', daysLeft }
  if (daysLeft === 1) return { label: 'להשקות מחר', tone: 'ok', daysLeft }
  return { label: `השקיה בעוד ${daysLeft} ימים`, tone: 'ok', daysLeft }
}
