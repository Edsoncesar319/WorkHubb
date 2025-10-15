import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-xl font-bold mb-4">
              <span className="text-primary">Work</span>
              <span className="text-foreground">Hubb</span>
            </div>
            <p className="text-sm text-muted-foreground">
              A plataforma que conecta talentos tech com as melhores oportunidades do mercado.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/jobs" className="hover:text-primary transition-colors">
                  Vagas
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Cadastrar
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Entrar
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <p className="text-sm text-muted-foreground">contato@workhubb.com</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} WorkHubb. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
