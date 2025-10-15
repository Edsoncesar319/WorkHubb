import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Briefcase, Users, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block">
            <div className="text-sm font-semibold text-primary mb-4 tracking-wider uppercase">
              Bem-vindo ao WorkHubb
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
            Conectando <span className="text-primary glow-effect-strong">Talentos Tech</span> com Oportunidades
          </h1>

          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
            A plataforma definitiva para profissionais de tecnologia encontrarem as melhores vagas e empresas
            descobrirem os melhores talentos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/jobs">
              <Button size="lg" className="glow-effect text-lg px-8">
                Explorar Vagas
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="text-lg px-8 border-primary/30 bg-transparent">
                Cadastrar Empresa
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition-all hover:glow-effect">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Vagas Exclusivas</h3>
            <p className="text-muted-foreground leading-relaxed">
              Acesse oportunidades exclusivas nas melhores empresas de tecnologia do Brasil.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition-all hover:glow-effect">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Perfil Profissional</h3>
            <p className="text-muted-foreground leading-relaxed">
              Crie seu perfil completo com stack, projetos e experiências para se destacar.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition-all hover:glow-effect">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Candidatura Rápida</h3>
            <p className="text-muted-foreground leading-relaxed">
              Candidate-se às vagas com apenas alguns cliques e acompanhe suas aplicações.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-12 text-center glow-effect">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Pronto para dar o próximo passo na sua carreira?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 text-balance max-w-2xl mx-auto">
            Junte-se a milhares de profissionais que já encontraram suas oportunidades ideais no WorkHubb.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Começar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
