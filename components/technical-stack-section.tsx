"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Award, Clock, Edit, Plus, Target } from "lucide-react"
import { StackSkillsModal } from "@/components/stack-skills-modal"
import {
  type StackSkill,
  parseStackSkills,
  stackYearsLabel,
  stackYearsToPercent,
} from "@/lib/stack-skills"
import { formatDateShort } from "@/lib/format-date"

type TechnicalStackSectionProps = {
  stackSkillsJson?: string | null
  legacyStack?: string | null
  updatedAt?: string
  editable?: boolean
  onSave?: (skills: StackSkill[]) => Promise<void>
}

export function TechnicalStackSection({
  stackSkillsJson,
  legacyStack,
  updatedAt,
  editable = false,
  onSave,
}: TechnicalStackSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const skills = useMemo(
    () => parseStackSkills(stackSkillsJson, legacyStack),
    [stackSkillsJson, legacyStack]
  )

  const handleSave = async (next: StackSkill[]) => {
    if (!onSave) return
    await onSave(next)
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Experiência em stacks técnicas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Proficiência por anos de experiência em projetos (escala {1}–{10} anos)
              </p>
            </div>
          </div>
          {updatedAt && (
            <Badge variant="outline" className="shrink-0 gap-1">
              <Clock className="w-3 h-3" />
              Atualizado {formatDateShort(updatedAt)}
            </Badge>
          )}
        </div>

        {skills.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-4">
              {editable
                ? "Cadastre suas tecnologias e anos de prática"
                : "Nenhuma stack cadastrada"}
            </p>
            {editable && onSave && (
              <Button onClick={() => setModalOpen(true)} className="glow-effect">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar stacks
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {skills.map((skill, index) => (
              <div key={`${skill.name}-${index}`} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{skill.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {stackYearsLabel(skill.years)}
                  </span>
                </div>
                <Progress value={stackYearsToPercent(skill.years)} className="h-2.5" />
              </div>
            ))}

            {editable && onSave && (
              <Button
                variant="outline"
                className="w-full sm:w-auto mt-2"
                onClick={() => setModalOpen(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Gerenciar stacks
              </Button>
            )}
          </div>
        )}
      </Card>

      {editable && onSave && (
        <StackSkillsModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initialSkills={skills}
          onSave={handleSave}
        />
      )}
    </>
  )
}
