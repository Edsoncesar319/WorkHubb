"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Plus, Trash2, Target } from "lucide-react"
import {
  type StackSkill,
  clampStackYears,
  stackYearsLabel,
  stackYearsToPercent,
  MIN_YEARS,
  MAX_YEARS,
} from "@/lib/stack-skills"

type StackSkillsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSkills: StackSkill[]
  onSave: (skills: StackSkill[]) => Promise<void>
}

export function StackSkillsModal({
  open,
  onOpenChange,
  initialSkills,
  onSave,
}: StackSkillsModalProps) {
  const [skills, setSkills] = useState<StackSkill[]>([])
  const [newSkillName, setNewSkillName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSkills(initialSkills.map((s) => ({ ...s, years: clampStackYears(s.years) })))
      setNewSkillName("")
      setError(null)
    }
  }, [open, initialSkills])

  const addSkill = () => {
    const name = newSkillName.trim()
    if (!name) return
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setError("Esta tecnologia já está na lista")
      return
    }
    setSkills([...skills, { name, years: 3 }])
    setNewSkillName("")
    setError(null)
  }

  const updateYears = (index: number, years: number) => {
    setSkills((prev) =>
      prev.map((s, i) => (i === index ? { ...s, years: clampStackYears(years) } : s))
    )
  }

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(skills)
      onOpenChange(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Status das stacks técnicas
          </DialogTitle>
          <DialogDescription>
            Defina anos de experiência em cada tecnologia (escala de {MIN_YEARS} a{" "}
            {MAX_YEARS} anos). A barra reflete o nível de prática em produção.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Ex: React, TypeScript, Node.js..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            />
            <Button type="button" variant="outline" onClick={addSkill}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Adicione tecnologias para montar seu perfil técnico
            </p>
          ) : (
            <ul className="space-y-5">
              {skills.map((skill, index) => (
                <li key={`${skill.name}-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {stackYearsLabel(skill.years)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSkill(index)}
                        aria-label={`Remover ${skill.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={stackYearsToPercent(skill.years)} className="h-2" />
                  <div className="flex items-center gap-3">
                    <Slider
                      min={MIN_YEARS}
                      max={MAX_YEARS}
                      step={1}
                      value={[skill.years]}
                      onValueChange={([v]) => updateYears(index, v)}
                      className="flex-1"
                    />
                    <span className="text-sm font-semibold text-primary w-6 text-center tabular-nums">
                      {skill.years}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="button" className="glow-effect" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar stacks"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
