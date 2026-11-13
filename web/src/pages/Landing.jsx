import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  PieChart,
  Tags,
  TrendingUp,
  TrendingDown,
  Check,
  ArrowRight,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import '@/landing.css'

/* Recursos exibidos na grade */
const FEATURES = [
  {
    icon: PieChart,
    title: 'Visão geral do mês',
    body: 'Saldo, receitas e despesas de um relance. Saiba exatamente onde você está antes de terminar o mês.',
    highlight: false,
  },
  {
    icon: Tags,
    title: 'Categorias flexíveis',
    body: 'Crie as categorias que fizerem sentido para você e mantenha sua organização sob controle.',
    highlight: true,
  },
  {
    icon: PieChart,
    title: 'Resumo por categoria',
    body: 'Descubra onde está gastando de verdade com um resumo simples por categoria a cada mês.',
    highlight: false,
  },
  {
    icon: TrendingUp,
    title: 'Receitas & despesas',
    body: 'Registre lançamentos de entrada e saída separados, com histórico mensal organizado.',
    highlight: false,
  },
  {
    icon: TrendingDown,
    title: 'Maior despesa & média',
    body: 'Veja automaticamente sua maior despesa e a média mensal para ajudar nas próximas decisões.',
    highlight: false,
  },
  {
    icon: ShieldCheck,
    title: 'Login único e seguro',
    body: 'Sua conta protegida com autenticação JWT. Só você enxerga seus números.',
    highlight: false,
  },
]

const STEPS = [
  {
    n: '1',
    title: 'Crie sua conta',
    body: 'Cadastre seu e-mail e defina uma senha. Nada de cartão, nem de período de teste que cobra depois.',
  },
  {
    n: '2',
    title: 'Registre suas transações',
    body: 'Adicione receitas e despesas categorizadas. O Ledger cuida da contabilidade para você.',
  },
  {
    n: '3',
    title: 'Veja o balanço do mês',
    body: 'Acompanhe saldo, por categoria e tendência. Decida o próximo mês com números, não com achismo.',
  },
]

const FAQS = [
  {
    q: 'O Ledger é gratuito?',
    a: 'Sim. Você cria sua conta e usa o painel sem custo nenhum — sem cartão de crédito e sem cobranças escondidas.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Seus lançamentos ficam atrelados à sua conta, protegidos por autenticação JWT e senha com criptografia forte. Só você acessa.',
  },
  {
    q: 'Posso usar no celular?',
    a: 'Sim. O painel é responsivo e funciona bem no navegador do celular, tablet ou desktop.',
  },
  {
    q: 'Preciso instalar alguma coisa?',
    a: 'Não. Tudo acontece no navegador. E para começar, você só precisa de uma conta.',
  },
]

const REPORT_ROWS = [
  { name: 'Moradia', w: '42%', color: 'var(--warning)', amt: 'R$ 1.898' },
  { name: 'Alimentação', w: '32%', color: 'var(--expense)', amt: 'R$ 1.412' },
  { name: 'Transporte', w: '22%', color: 'var(--primary)', amt: 'R$ 986' },
  { name: 'Lazer', w: '15%', color: 'var(--income)', amt: 'R$ 598' },
]

function Counter({ to, suffix }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      el.textContent = to.toLocaleString('pt-BR') + (suffix || '')
      return
    }
    let raf = 0
    const dur = 700
    let start = null
    function step(ts) {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      el.textContent = Math.round(to * eased).toLocaleString('pt-BR') + (suffix || '')
      if (p < 1) raf = requestAnimationFrame(step)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          raf = requestAnimationFrame(step)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [to, suffix])
  return (
    <span className="num tnum" ref={ref}>
      0
    </span>
  )
}

export default function Landing() {
  const headRef = useRef(null)
  const glow1 = useRef(null)
  const glow2 = useRef(null)
  const reportRef = useRef(null)
  const trustRef = useRef(null)

  // Header sólido + parallax dos glows
  useEffect(() => {
    const head = headRef.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const onScroll = () => {
      head.classList.toggle('scrolled', window.scrollY > 24)
      raf = raf || requestAnimationFrame(applyPar)
    }
    function applyPar() {
      raf = 0
      if (reduce) return
      const y = window.scrollY
      if (glow1.current) glow1.current.style.transform = `translateY(${y * 0.1}px)`
      if (glow2.current) glow2.current.style.transform = `translateY(${y * -0.06}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Reveal por scroll (data-lreveal) + barras do relatório
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.18 },
    )
    document.querySelectorAll('[data-lreveal]').forEach((el) => io.observe(el))
    const rep = reportRef.current
    if (rep) io.observe(rep)
    return () => io.disconnect()
  }, [])

  // trustRef guarda a área de confiança (usado por <Counter> de forma independente)
  useEffect(() => {
    // apenas mantém a referência de trustBar viva para futura expansão.
    void trustRef
  }, [])

  return (
    <div className="lp">
      {/* ===== Header ===== */}
      <header className="lp-head" ref={headRef}>
        <div className="wrap lp-header-inner">
          <Link to="/" aria-label="Ledger· — início" className="flex items-center gap-2.5 text-foreground no-underline">
            <Logo />
          </Link>

          <nav className="lp-nav">
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#relatorio">Relatório</a>
            <a href="#faq">Perguntas</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button variant="primary" asChild>
              <Link to="/register">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <main>
        <section className="lp-hero">
          <div className="lp-glow lp-glow-1" ref={glow1} />
          <div className="lp-glow lp-glow-2" ref={glow2} />
          <div className="wrap lp-grid">
            <div>
              <span className="lp-eyebrow lp-rise lp-d1">
                <span className="dot" /> Finanças pessoais, sem planilha
              </span>
              <h1 className="display lp-h1 lp-rise lp-d2">
                A saúde das suas contas, num só <span className="serif">lugar</span>
              </h1>
              <p className="lp-sub lp-rise lp-d3">
                Controle despesas, organize categorias e encerre cada mês com clareza.
                Receitas, despesas e saldo — tudo em um painel simples e direto.
              </p>

              <div className="lp-cta lp-rise lp-d4">
                <Button variant="primary" size="lg" asChild>
                  <Link to="/register">
                    Começar grátis <ArrowRight size={16} />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#como-funciona">Ver como funciona</a>
                </Button>
              </div>
              <p className="lp-note lp-rise lp-d4">Sem cartão de crédito. Cria sua conta em menos de um minuto.</p>

              <div className="lp-trust lp-rise lp-d5" ref={trustRef}>
                <div className="trust">
                  <div className="num tnum">
                    <Counter to={12000} suffix="+" />
                  </div>
                  <div className="lbl">contas organizadas</div>
                </div>
                <div className="trust">
                  <div className="num tnum">
                    <Counter to={98} suffix="%" />
                  </div>
                  <div className="lbl">de satisfação</div>
                </div>
                <div className="trust">
                  <div className="num tnum">&lt; 1 min</div>
                  <div className="lbl">para começar</div>
                </div>
              </div>
            </div>

            {/* Dashboard mock */}
            <div className="lp-mock">
              <div className="lp-mock-card lp-mock-card-anim">
                <div className="lp-mock-top">
                  <span className="lp-mock-title">Visão geral · Outubro 2024</span>
                  <span className="lp-month-chip">Out 2024</span>
                </div>

                <div className="lp-stats">
                  <div className="lp-stat">
                    <div className="lbl">Saldo</div>
                    <div className="val tnum lp-val-gold">R$ 2.174</div>
                  </div>
                  <div className="lp-stat">
                    <div className="lbl">Receitas</div>
                    <div className="val tnum lp-val-green">R$ 8.420</div>
                  </div>
                  <div className="lp-stat">
                    <div className="lbl">Despesas</div>
                    <div className="val tnum lp-val-red">R$ 6.246</div>
                  </div>
                </div>

                <div className="lp-chart">
                  <div className="lp-chart-head">
                    <span className="t">Evolução do saldo</span>
                    <span className="lp-legend">
                      <span>
                        Saldo diário
                        <i className="dot gold" />
                      </span>
                    </span>
                  </div>
                  <div className="relative h-[115px] w-full pt-1">
                    <svg viewBox="0 0 400 120" className="size-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lpHeroGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="30" x2="400" y2="30" stroke="currentColor" strokeDasharray="3 3" className="text-border/50" strokeWidth="1" />
                      <line x1="0" y1="75" x2="400" y2="75" stroke="currentColor" strokeDasharray="3 3" className="text-border/50" strokeWidth="1" />
                      
                      <path
                        d="M 0,95 Q 40,88 80,65 T 160,75 T 240,42 T 320,32 T 400,14 L 400,120 L 0,120 Z"
                        fill="url(#lpHeroGrad)"
                      />
                      <path
                        d="M 0,95 Q 40,88 80,65 T 160,75 T 240,42 T 320,32 T 400,14"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="240" cy="42" r="3.5" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
                      <circle cx="400" cy="14" r="3.5" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="lp-bar-x">
                    <span>Sem 1</span>
                    <span>Sem 2</span>
                    <span>Sem 3</span>
                    <span>Sem 4</span>
                  </div>
                </div>

                {/* Minicards alinhados logo abaixo do gráfico */}
                <div className="lp-chips-row">
                  <div className="lp-chip">
                    <span className="ic inc">
                      <TrendingUp size={14} />
                    </span>
                    <div>
                      <span className="lbl">Receitas do mês</span>
                      <div className="val tnum">+R$ 8.420</div>
                    </div>
                  </div>

                  <div className="lp-chip">
                    <span className="ic chg">
                      <TrendingDown size={14} />
                    </span>
                    <div>
                      <span className="lbl">Saldo deste mês</span>
                      <div className="val tnum">R$ 2.174</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Recursos ===== */}
        <section id="recursos" className="lp-sec">
          <div className="wrap">
            <div className="lp-sec-head" data-lreveal>
              <div className="lp-kicker">Recursos</div>
              <h2 className="display lp-sec-title">
                Tudo o que você precisa para encerrar o mês com clareza
              </h2>
              <p className="lp-sec-sub">
                Sem excesso de gráficos nem configuração complicada. Só o essencial
                para entender para onde seu dinheiro vai.
              </p>
            </div>

            <div className="lp-feat-grid">
              {FEATURES.map((f, i) => {
                const Icon = f.icon
                return (
                  <div
                    className="lp-feat"
                    style={{ transitionDelay: `${[0, 0.05, 0.1, 0.05, 0.1, 0.15][i]}s` }}
                    data-lreveal
                    key={f.title}
                  >
                    <div className={`ic ${f.highlight ? 'hl' : 'soft'}`}>
                      <Icon size={20} strokeWidth={1.6} />
                    </div>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== Como funciona ===== */}
        <section
          id="como-funciona"
          className="lp-sec"
          style={{ background: 'var(--surface)', borderBlock: '1px solid var(--border)' }}
        >
          <div className="wrap">
            <div className="lp-sec-head" data-lreveal>
              <div className="lp-kicker">Como funciona</div>
              <h2 className="display lp-sec-title">Três passos e você está no controle</h2>
              <p className="lp-sec-sub">
                Um fluxo simples, do cadastro ao primeiro relatório — sem curva de aprendizado.
              </p>
            </div>

            <div className="lp-steps">
              {STEPS.map((s, i) => (
                <div
                  className="lp-step"
                  style={{ transitionDelay: `${[0, 0.08, 0.16][i]}s` }}
                  data-lreveal
                  key={s.title}
                >
                  <div className="n">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Relatório (highlight) ===== */}
        <section id="relatorio" className="lp-sec">
          <div className="wrap">
            <div className="lp-highlight" data-lreveal>
              <div className="lp-hl-inner">
                <div className="lp-hl-text">
                  <div className="lp-kicker">Na prática</div>
                  <h2 className="display" style={{ marginTop: 14 }}>
                    Dos números ao entendimento
                  </h2>
                  <p>
                    Em vez de uma pilha de lançamentos, o Ledger entrega o que importa: quanto
                    entrou, quanto saiu e para onde foi.
                  </p>
                  <div className="lp-hl-list">
                    {[
                      'Maior despesa e média mensal calculadas para você.',
                      'Resumo por categoria para enxergar os maiores vilões do orçamento.',
                      'Relatório mensal pronto — sem montar fórmula nenhuma.',
                    ].map((t) => (
                      <div className="lp-hl-item" key={t}>
                        <span className="check">
                          <Check size={18} strokeWidth={2.2} />
                        </span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lp-hl-visual">
                  <div className="lp-report" ref={reportRef}>
                    <div className="lp-report-title">Despesas por categoria · Out 2024</div>
                    <div className="lp-report-big tnum" style={{ color: 'var(--expense)' }}>
                      R$ 6.246
                    </div>
                    <div className="lp-report-rows">
                      {REPORT_ROWS.map((r) => (
                        <div className="lp-report-row" key={r.name}>
                          <span className="name">{r.name}</span>
                          <span className="track" style={{ '--w': r.w }}>
                            <i style={{ background: r.color }} />
                          </span>
                          <span className="amt tnum">{r.amt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section
          id="faq"
          className="lp-sec"
          style={{ background: 'var(--surface)', borderBlock: '1px solid var(--border)' }}
        >
          <div className="wrap">
            <div className="lp-sec-head" data-lreveal>
              <div className="lp-kicker">Perguntas frequentes</div>
              <h2 className="display lp-sec-title">Antes de começar</h2>
            </div>

            <div style={{ maxWidth: 700, margin: '0 auto', display: 'grid', gap: 14 }}>
              {FAQS.map((f, i) => (
                <details className="lp-faq" key={f.q} open={i === 0}>
                  <summary>
                    {f.q}
                    <svg
                      className="ic"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </summary>
                  <div className="body">
                    <div className="body-in">
                      <p>{f.a}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="lp-cta-section">
          <div className="lp-cta-band" data-lreveal>
            <div className="wrap">
              <h2 className="display">
                Pronto para encerrar o mês
                <br />
                com clareza?
              </h2>
              <p>
                Leva menos de um minuto para criar sua conta e registrar a primeira despesa.
                Seus números agradecem.
              </p>
              <div className="lp-cta-actions">
                <Button variant="primary" size="lg" asChild>
                  <Link to="/register">Criar conta grátis</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="lp-foot">
        <div className="wrap">
          <div className="lp-foot-inner">
            <div className="lp-foot-brand">
              <Link to="/" className="inline-block">
                <Logo />
              </Link>
              <p>
                Ferramenta simples de finanças pessoais: registre, categorize e entenda seu mês.
              </p>
            </div>

            <div className="lp-foot-cols">
              <div className="lp-foot-col">
                <h4>Produto</h4>
                <a href="#recursos">Recursos</a>
                <a href="#como-funciona">Como funciona</a>
                <a href="#relatorio">Relatório</a>
              </div>
              <div className="lp-foot-col">
                <h4>Conta</h4>
                <Link to="/login">Entrar</Link>
                <Link to="/register">Criar conta</Link>
              </div>
            </div>
          </div>

          <div className="lp-foot-bottom">
            <span>© 2024 Ledger</span>
            <span>Feito para suas contas ficarem sob controle.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}