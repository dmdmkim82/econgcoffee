// Tiny stable hash to map a name to a hue between 0-360.
// Used to give each attendee a consistent pastel avatar color.
export function hueFromName(name: string): number {
  if (!name) return 28
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff
  }
  return hash % 360
}

export function pastelFromName(name: string): string {
  return `hsl(${hueFromName(name)} 36% 70%)`
}
