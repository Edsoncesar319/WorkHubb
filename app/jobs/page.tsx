"use client"

import { useState, useEffect } from "react"
import { JobCard } from "@/components/job-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getJobs } from "@/lib/data"
import type { Job } from "@/lib/types"
import { Search } from "lucide-react"
import {
  jobMatchesWorkModeFilter,
  workModeLabel,
  type WorkModeFilter,
} from "@/lib/work-mode"

const WORK_MODE_FILTERS: WorkModeFilter[] = [
  "all",
  "remote",
  "hybrid",
  "onsite",
]

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [workModeFilter, setWorkModeFilter] = useState<WorkModeFilter>("all")

  useEffect(() => {
    const loadJobs = async () => {
      const jobsData = await getJobs()
      setJobs(jobsData)
    }
    loadJobs()
  }, [])

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesWorkMode = jobMatchesWorkModeFilter(job, workModeFilter)

    return matchesSearch && matchesWorkMode
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Vagas Disponíveis</h1>
        <p className="text-muted-foreground">Encontre a oportunidade perfeita para sua carreira</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, empresa ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {WORK_MODE_FILTERS.map((mode) => (
            <Button
              key={mode}
              variant={workModeFilter === mode ? "default" : "outline"}
              onClick={() => setWorkModeFilter(mode)}
              size="sm"
            >
              {mode === "all" ? "Todas" : workModeLabel(mode)}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredJobs.length} {filteredJobs.length === 1 ? "vaga encontrada" : "vagas encontradas"}
        </p>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-6">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma vaga encontrada com os filtros selecionados.</p>
        </div>
      )}
    </div>
  )
}
