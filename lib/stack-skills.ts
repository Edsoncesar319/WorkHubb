/** Habilidades técnicas com anos de experiência (escala 1–10) */

export interface StackSkill {
  name: string
  years: number
}

const MIN_YEARS = 1
const MAX_YEARS = 10

export function clampStackYears(years: number): number {
  const n = Math.round(Number(years))
  if (!Number.isFinite(n)) return MIN_YEARS
  return Math.min(MAX_YEARS, Math.max(MIN_YEARS, n))
}

export function parseStackSkills(
  stackSkillsJson: string | null | undefined,
  legacyStack?: string | null
): StackSkill[] {
  if (stackSkillsJson?.trim()) {
    try {
      const parsed = JSON.parse(stackSkillsJson) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (!item || typeof item !== "object") return null
            const row = item as { name?: unknown; years?: unknown }
            const name = String(row.name ?? "").trim()
            if (!name) return null
            const years = clampStackYears(Number(row.years) || MIN_YEARS)
            return { name, years }
          })
          .filter((s): s is StackSkill => s !== null)
      }
    } catch {
      /* fallback legacy */
    }
  }

  if (legacyStack?.trim()) {
    return legacyStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, years: 3 }))
  }

  return []
}

export function serializeStackSkills(skills: StackSkill[]): string {
  return JSON.stringify(
    skills
      .map((s) => ({
        name: s.name.trim(),
        years: clampStackYears(s.years),
      }))
      .filter((s) => s.name.length > 0)
  )
}

export function stackSkillsToLegacyStack(skills: StackSkill[]): string {
  return skills.map((s) => s.name).join(", ")
}

/** Porcentagem da barra (1 ano = 10%, 10 anos = 100%) */
export function stackYearsToPercent(years: number): number {
  return clampStackYears(years) * 10
}

export function stackYearsLabel(years: number): string {
  const y = clampStackYears(years)
  return y === 1 ? "1 ano" : `${y} anos`
}

export { MIN_YEARS, MAX_YEARS }
