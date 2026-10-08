import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  Droplets,
  FlaskConical,
  Leaf,
  Map,
  Menu,
  Sprout,
  Tractor,
  Wheat,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: Tractor,
    title: 'Exploitations',
    description:
      'Centralisez vos exploitations, leurs informations et leur organisation.',
  },
  {
    icon: Map,
    title: 'Parcelles',
    description:
      'Visualisez vos parcelles et gardez une vision claire de vos surfaces agricoles.',
  },
  {
    icon: Sprout,
    title: 'Cultures',
    description:
      'Suivez vos cultures, leurs variétés, leurs périodes et leur état.',
  },
  {
    icon: Wheat,
    title: 'Campagnes',
    description:
      'Structurez chaque campagne agricole et rattachez les opérations au bon contexte.',
  },
  {
    icon: ClipboardList,
    title: 'Interventions',
    description:
      'Planifiez et suivez les interventions réalisées sur vos parcelles.',
  },
  {
    icon: FlaskConical,
    title: 'Fertilisation',
    description:
      'Gardez une trace structurée des apports et des opérations de fertilisation.',
  },
  {
    icon: Leaf,
    title: 'Phytosanitaire',
    description:
      'Centralisez le suivi des interventions phytosanitaires.',
  },
  {
    icon: Droplets,
    title: 'Irrigation',
    description:
      'Suivez les opérations d’irrigation et leur avancement.',
  },
  {
    icon: Bell,
    title: 'Observations',
    description:
      'Enregistrez les observations terrain et identifiez les situations à surveiller.',
  },
  {
    icon: Wheat,
    title: 'Récoltes',
    description:
      'Enregistrez vos récoltes, quantités, unités et rendements.',
  },
  {
    icon: Tractor,
    title: 'Opérations terrain',
    description:
      'Suivez l’exécution réelle des opérations directement dans votre pilotage.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Configurez votre exploitation',
    description:
      'Créez vos exploitations et structurez vos parcelles, cultures et campagnes.',
  },
  {
    number: '02',
    title: 'Planifiez vos opérations',
    description:
      'Organisez les interventions nécessaires au suivi de vos cultures.',
  },
  {
    number: '03',
    title: 'Suivez le terrain',
    description:
      'Enregistrez les opérations réalisées, les observations et les événements agricoles.',
  },
  {
    number: '04',
    title: 'Pilotez votre activité',
    description:
      'Retrouvez les informations essentielles dans un tableau de bord centralisé.',
  },
]

const benefits = [
  'Une vision centralisée de l’exploitation',
  'Un suivi structuré des parcelles et des cultures',
  'Une meilleure traçabilité des opérations',
  'Des informations accessibles au même endroit',
]

function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              A
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">AgriPilot</p>
              <p className="text-[11px] text-slate-500">Pilotage agricole</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#fonctionnalites"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Fonctionnalités
            </a>

            <a
              href="#fonctionnement"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Comment ça marche
            </a>

            <a
              href="#pourquoi"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Pourquoi AgriPilot
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Se connecter
            </Link>

            <Link
              to="/login"
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Commencer
            </Link>
          </div>

          <button
            type="button"
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <nav className="space-y-1">
              <a
                href="#fonctionnalites"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Fonctionnalités
              </a>

              <a
                href="#fonctionnement"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Comment ça marche
              </a>

              <a
                href="#pourquoi"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Pourquoi AgriPilot
              </a>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold text-slate-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Se connecter
                </Link>

                <Link
                  to="/login"
                  className="rounded-lg bg-emerald-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Commencer
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="overflow-hidden border-b border-slate-200 bg-gradient-to-b from-emerald-50/70 via-white to-white">
          <div className="mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Plateforme de pilotage agricole
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Pilotez votre exploitation agricole depuis un seul endroit.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Centralisez vos exploitations, parcelles, cultures, campagnes
                et opérations pour garder une vision claire de votre activité
                agricole.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Commencer avec AgriPilot
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#fonctionnalites"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Découvrir les fonctionnalités
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {benefits.slice(0, 2).map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-emerald-100/50 blur-3xl" />

              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Aperçu de la plateforme
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      Tableau de bord
                    </p>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ['Exploitations', '—'],
                      ['Parcelles', '—'],
                      ['Cultures actives', '—'],
                      ['Campagnes', '—'],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="text-[11px] font-medium text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Prochaines interventions
                      </p>
                      <span className="text-xs font-medium text-emerald-600">
                        Cette semaine
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {[
                        ['Fertilisation', 'Blé tendre · Parcelle Nord', 'Demain'],
                        ['Irrigation', 'Maïs · Parcelle Est', 'Jeudi'],
                        ['Observation', 'Colza · Parcelle Sud', 'Vendredi'],
                      ].map(([type, context, date]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {type}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {context}
                            </p>
                          </div>

                          <span className="shrink-0 text-xs font-medium text-slate-500">
                            {date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                       ['Planifiées', '—'],
                       ['En cours', '—'],
                       ['Terminées', '—'],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl bg-slate-50 p-3 text-center"
                      >
                        <p className="text-lg font-bold text-slate-900">
                          {value}
                        </p>
                        <p className="text-[11px] text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
                  <p className="text-center text-[11px] text-slate-500">
                    Exemple d’interface AgriPilot
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold text-emerald-600">
                Une plateforme pensée pour l’exploitation
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Toutes vos données agricoles, au même endroit.
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                AgriPilot rassemble les informations essentielles de votre
                exploitation pour vous aider à organiser, suivre et piloter
                votre activité.
              </p>
            </div>

            <div
              id="fonctionnalites"
              className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature) => {
                const Icon = feature.icon

                return (
                  <article
                    key={feature.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-900/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="mt-4 text-base font-bold text-slate-900">
                      {feature.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {feature.description}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="fonctionnement"
          className="border-b border-slate-200 bg-slate-50"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold text-emerald-600">
                  Comment ça marche
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Une gestion structurée, du champ au tableau de bord.
                </h2>

                <p className="mt-4 text-base leading-7 text-slate-600">
                  Construisez progressivement votre environnement de travail
                  et conservez une vision cohérente de vos activités agricoles.
                </p>
              </div>

              <div className="space-y-3">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                      {step.number}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        {step.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pourquoi" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
              <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold text-emerald-400">
                    Pourquoi AgriPilot
                  </p>

                  <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    Passez d’une gestion dispersée à un pilotage agricole
                    structuré.
                  </h2>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Au lieu de multiplier les informations et les outils,
                    retrouvez vos données d’exploitation, vos opérations et
                    votre suivi agricole dans un environnement conçu pour
                    travailler avec une logique terrain.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {benefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-start gap-2 text-sm text-slate-200"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <BarChart3 className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-bold">Pilotage centralisé</p>
                      <p className="text-xs text-slate-400">
                        Une vision claire de votre activité
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      'Exploitations et parcelles',
                      'Cultures et campagnes',
                      'Interventions et opérations terrain',
                      'Observations et récoltes',
                    ].map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400">
                          {index + 1}
                        </span>

                        <span className="text-sm text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-emerald-50">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Prêt à mieux piloter votre exploitation ?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Centralisez vos données agricoles et donnez à votre exploitation
              une organisation plus claire.
            </p>

            <div className="mt-7">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Commencer avec AgriPilot
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                A
              </div>

              <p className="text-sm font-bold text-slate-900">AgriPilot</p>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Plateforme de pilotage agricole.
            </p>
          </div>

          <div className="flex items-center gap-5 text-sm text-slate-500">
            <a
              href="#fonctionnalites"
              className="transition hover:text-slate-900"
            >
              Fonctionnalités
            </a>

            <a
              href="#fonctionnement"
              className="transition hover:text-slate-900"
            >
              Fonctionnement
            </a>

            <Link to="/login" className="transition hover:text-slate-900">
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
