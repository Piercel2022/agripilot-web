import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Leaf,
  type LucideIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

type FeatureContent = {
  title: string
  eyebrow: string
  headline: string
  description: string
  benefits: string[]
  steps: { title: string; description: string }[]
  related: { label: string; slug: string }[]
  icon: LucideIcon
}

const features: Record<string, FeatureContent> = {
  exploitations: {
    title: 'Exploitations agricoles',
    eyebrow: 'Organisation de votre activité',
    headline: 'Toutes vos exploitations réunies dans un seul espace.',
    description:
      'Centralisez les informations de vos exploitations pour structurer votre environnement de travail et retrouver plus facilement vos données agricoles.',
    benefits: [
      'Centralisez les informations de vos exploitations.',
      'Structurez vos données agricoles dans un espace organisé.',
      'Retrouvez le contexte de votre activité plus facilement.',
    ],
    steps: [
      {
        title: 'Structurez votre espace',
        description:
          'Organisez les informations essentielles de votre exploitation.',
      },
      {
        title: 'Associez vos parcelles',
        description:
          'Retrouvez vos surfaces et les cultures dans leur contexte.',
      },
      {
        title: 'Suivez votre activité',
        description:
          'Accédez aux modules nécessaires au suivi de vos opérations.',
      },
    ],
    related: [
      { label: 'Parcelles', slug: 'parcelles' },
      { label: 'Cultures', slug: 'cultures' },
    ],
    icon: Leaf,
  },
  parcelles: {
    title: 'Gestion des parcelles',
    eyebrow: 'Votre foncier agricole, structuré',
    headline: 'Toutes vos parcelles, parfaitement organisées.',
    description:
      'Retrouvez les informations de vos parcelles, leurs surfaces et leurs caractéristiques dans un espace conçu pour faciliter le suivi de votre activité agricole.',
    benefits: [
      'Centralisez les informations de vos parcelles.',
      'Retrouvez les surfaces et caractéristiques enregistrées.',
      'Reliez votre suivi parcellaire aux cultures et aux campagnes.',
    ],
    steps: [
      {
        title: 'Enregistrez vos parcelles',
        description:
          'Renseignez leurs informations et leurs caractéristiques.',
      },
      {
        title: 'Associez vos cultures',
        description:
          'Organisez les informations culturales dans leur contexte parcellaire.',
      },
      {
        title: 'Suivez les opérations',
        description:
          'Retrouvez les interventions et les activités associées à vos parcelles.',
      },
    ],
    related: [
      { label: 'Exploitations', slug: 'exploitations' },
      { label: 'Cultures', slug: 'cultures' },
      { label: 'Interventions', slug: 'interventions' },
    ],
    icon: Leaf,
  },
  cultures: {
    title: 'Suivi des cultures',
    eyebrow: 'Du semis au suivi cultural',
    headline: 'Gardez une vision claire de vos cultures.',
    description:
      'Organisez les informations de vos cultures et retrouvez leur contexte dans le suivi de vos parcelles et de vos campagnes agricoles.',
    benefits: [
      'Centralisez les informations de vos cultures.',
      'Reliez les cultures à vos parcelles.',
      'Retrouvez les opérations associées à votre suivi cultural.',
    ],
    steps: [
      {
        title: 'Enregistrez vos cultures',
        description: 'Structurez les informations culturales disponibles.',
      },
      {
        title: 'Organisez vos campagnes',
        description: 'Associez votre suivi aux campagnes agricoles.',
      },
      {
        title: 'Suivez les interventions',
        description: 'Retrouvez les opérations liées à vos cultures.',
      },
    ],
    related: [
      { label: 'Parcelles', slug: 'parcelles' },
      { label: 'Campagnes', slug: 'campagnes' },
    ],
    icon: Leaf,
  },
  campagnes: {
    title: 'Campagnes agricoles',
    eyebrow: 'Planification et suivi',
    headline: 'Structurez vos campagnes agricoles.',
    description:
      'Organisez vos campagnes et rattachez vos opérations à leur contexte pour conserver un suivi plus cohérent de votre activité.',
    benefits: [
      'Structurez les informations de vos campagnes.',
      'Reliez les campagnes aux cultures concernées.',
      'Retrouvez les interventions associées.',
    ],
    steps: [
      {
        title: 'Créez votre campagne',
        description: 'Définissez son contexte dans votre activité agricole.',
      },
      {
        title: 'Associez les cultures',
        description: 'Organisez les cultures suivies dans la campagne.',
      },
      {
        title: 'Centralisez les opérations',
        description: 'Retrouvez les interventions associées à la campagne.',
      },
    ],
    related: [
      { label: 'Cultures', slug: 'cultures' },
      { label: 'Interventions', slug: 'interventions' },
    ],
    icon: Leaf,
  },
  interventions: {
    title: 'Interventions agricoles',
    eyebrow: 'Le suivi opérationnel',
    headline: 'Gardez une trace de vos interventions agricoles.',
    description:
      'Centralisez les informations de vos interventions et retrouvez leur contexte pour mieux suivre les opérations réalisées sur vos parcelles.',
    benefits: [
      'Organisez les informations de vos interventions.',
      'Reliez les opérations aux campagnes concernées.',
      'Conservez un historique structuré de votre activité.',
    ],
    steps: [
      {
        title: 'Enregistrez une intervention',
        description: 'Renseignez les informations utiles à son suivi.',
      },
      {
        title: 'Reliez-la à son contexte',
        description: 'Retrouvez la campagne et la culture concernées.',
      },
      {
        title: 'Suivez son avancement',
        description: 'Consultez les informations de suivi disponibles.',
      },
    ],
    related: [
      { label: 'Campagnes', slug: 'campagnes' },
      { label: 'Fertilisation', slug: 'fertilisation' },
      { label: 'Irrigation', slug: 'irrigation' },
    ],
    icon: Leaf,
  },
  fertilisation: {
    title: 'Fertilisation',
    eyebrow: 'Traçabilité des apports',
    headline: 'Structurez le suivi de vos opérations de fertilisation.',
    description:
      'Centralisez les informations relatives aux apports et aux applications de fertilisation pour retrouver leur historique et leur contexte.',
    benefits: [
      'Enregistrez les informations des applications.',
      'Suivez les quantités et les unités renseignées.',
      'Reliez les applications aux interventions concernées.',
    ],
    steps: [
      {
        title: 'Enregistrez l’application',
        description: 'Renseignez le produit et les informations disponibles.',
      },
      {
        title: 'Précisez les quantités',
        description: 'Consignez les quantités et unités utilisées.',
      },
      {
        title: 'Conservez la traçabilité',
        description: 'Retrouvez les données liées à l’intervention.',
      },
    ],
    related: [
      { label: 'Interventions', slug: 'interventions' },
      { label: 'Cultures', slug: 'cultures' },
    ],
    icon: Leaf,
  },
  phytosanitaire: {
    title: 'Suivi phytosanitaire',
    eyebrow: 'Suivi des traitements',
    headline: 'Centralisez vos informations phytosanitaires.',
    description:
      'Organisez les informations de vos opérations phytosanitaires et retrouvez leur lien avec les interventions agricoles.',
    benefits: [
      'Centralisez les données des opérations enregistrées.',
      'Retrouvez les informations de suivi disponibles.',
      'Reliez les opérations à leur contexte agricole.',
    ],
    steps: [
      {
        title: 'Enregistrez l’opération',
        description: 'Renseignez les informations de suivi disponibles.',
      },
      {
        title: 'Associez l’intervention',
        description: 'Reliez les données à l’intervention concernée.',
      },
      {
        title: 'Consultez l’historique',
        description: 'Retrouvez les informations enregistrées.',
      },
    ],
    related: [
      { label: 'Interventions', slug: 'interventions' },
      { label: 'Observations', slug: 'observations' },
    ],
    icon: Leaf,
  },
  irrigation: {
    title: 'Gestion de l’irrigation',
    eyebrow: 'Suivi des opérations',
    headline: 'Organisez le suivi de vos opérations d’irrigation.',
    description:
      'Retrouvez les informations de vos opérations d’irrigation et suivez leur avancement dans le contexte de votre activité agricole.',
    benefits: [
      'Centralisez les opérations d’irrigation enregistrées.',
      'Consultez leur statut et les informations disponibles.',
      'Reliez le suivi aux interventions concernées.',
    ],
    steps: [
      {
        title: 'Enregistrez l’opération',
        description: 'Renseignez les données utiles au suivi.',
      },
      {
        title: 'Précisez les modalités',
        description: 'Consignez les informations d’irrigation disponibles.',
      },
      {
        title: 'Suivez l’avancement',
        description: 'Retrouvez le statut de l’opération.',
      },
    ],
    related: [
      { label: 'Interventions', slug: 'interventions' },
      { label: 'Parcelles', slug: 'parcelles' },
    ],
    icon: Leaf,
  },
  observations: {
    title: 'Observations terrain',
    eyebrow: 'Observer et documenter',
    headline: 'Conservez une trace structurée de vos observations.',
    description:
      'Enregistrez les observations réalisées sur le terrain pour retrouver les constats et les informations utiles à votre suivi agricole.',
    benefits: [
      'Centralisez les observations enregistrées.',
      'Retrouvez les informations de suivi disponibles.',
      'Reliez les constats à leur contexte agricole.',
    ],
    steps: [
      {
        title: 'Enregistrez une observation',
        description: 'Consignez les constats relevés sur le terrain.',
      },
      {
        title: 'Précisez son contexte',
        description: 'Rattachez les informations au suivi concerné.',
      },
      {
        title: 'Retrouvez les constats',
        description: 'Consultez les données précédemment enregistrées.',
      },
    ],
    related: [
      { label: 'Parcelles', slug: 'parcelles' },
      { label: 'Phytosanitaire', slug: 'phytosanitaire' },
    ],
    icon: Leaf,
  },
  recoltes: {
    title: 'Suivi des récoltes',
    eyebrow: 'Enregistrement de la production',
    headline: 'Centralisez les données de vos récoltes.',
    description:
      'Enregistrez les récoltes, les quantités et les unités renseignées pour retrouver les informations de production de votre activité agricole.',
    benefits: [
      'Consignez les quantités récoltées.',
      'Précisez les unités associées aux enregistrements.',
      'Retrouvez les données de récolte disponibles.',
    ],
    steps: [
      {
        title: 'Enregistrez la récolte',
        description: 'Consignez les informations de la récolte.',
      },
      {
        title: 'Renseignez les quantités',
        description: 'Précisez les quantités et les unités.',
      },
      {
        title: 'Retrouvez les données',
        description: 'Consultez les informations de récolte enregistrées.',
      },
    ],
    related: [
      { label: 'Cultures', slug: 'cultures' },
      { label: 'Campagnes', slug: 'campagnes' },
    ],
    icon: Leaf,
  },
  'operations-terrain': {
    title: 'Opérations terrain',
    eyebrow: 'Du suivi à l’exécution',
    headline: 'Suivez vos opérations au plus près du terrain.',
    description:
      'Centralisez les informations des opérations agricoles et retrouvez leur état d’avancement dans votre environnement de travail.',
    benefits: [
      'Retrouvez les opérations de terrain enregistrées.',
      'Consultez les informations de suivi disponibles.',
      'Conservez un historique structuré des opérations.',
    ],
    steps: [
      {
        title: 'Enregistrez l’opération',
        description: 'Renseignez les informations de l’activité réalisée.',
      },
      {
        title: 'Suivez son état',
        description: 'Consultez les statuts enregistrés.',
      },
      {
        title: 'Retrouvez son historique',
        description: 'Accédez aux informations de suivi disponibles.',
      },
    ],
    related: [
      { label: 'Interventions', slug: 'interventions' },
      { label: 'Récoltes', slug: 'recoltes' },
    ],
    icon: Leaf,
  },
}

function FeatureNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">
          Fonctionnalité introuvable
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Cette page n’existe pas ou n’est pas encore disponible.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l’accueil
        </Link>
      </div>
    </main>
  )
}

export default function FeaturePage() {
  const { slug } = useParams()
  const feature = slug ? features[slug] : undefined

  if (!feature) {
    return <FeatureNotFound />
  }

  const Icon = feature.icon

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              A
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-900">
                AgriPilot
              </span>
              <span className="block text-[11px] text-slate-500">
                Pilotage agricole
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" />
              Accueil
            </Link>
            <Link
              to="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Commencer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="overflow-hidden border-b border-emerald-100 bg-gradient-to-b from-emerald-50 via-white to-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Toutes les fonctionnalités
              </Link>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {feature.eyebrow}
              </div>

              <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {feature.headline}
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                {feature.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Créer mon espace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  J’ai déjà un compte
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-emerald-100/70 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Module AgriPilot
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">
                      {feature.title}
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {feature.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <p className="text-sm leading-6 text-slate-700">
                        {benefit}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-sm font-semibold text-emerald-950">
                    Un espace de travail centralisé
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                    Retrouvez vos informations agricoles et poursuivez votre
                    suivi depuis votre espace AgriPilot.
                  </p>
                </div>
                <p className="mt-4 text-center text-xs text-slate-400">
                  Présentation du module — aperçu illustratif
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-emerald-700">
                Comment ça fonctionne
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Un suivi organisé, étape par étape.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                AgriPilot vous aide à structurer les informations disponibles
                et à les retrouver dans leur contexte métier.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {feature.steps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                    0{index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  Un environnement connecté
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  Découvrez les modules complémentaires.
                </h2>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Voir toutes les fonctionnalités
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {feature.related.map((related) => (
                <Link
                  key={related.slug}
                  to={`/fonctionnalites/${related.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  {related.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>

            <div className="mt-12 rounded-2xl bg-emerald-950 px-6 py-10 text-white sm:px-10 sm:py-12">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-emerald-300">
                  Passez à l’action
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Structurez votre suivi agricole avec AgriPilot.
                </h2>
                <p className="mt-4 leading-7 text-emerald-100/80">
                  Créez votre espace et découvrez les fonctionnalités
                  disponibles pour organiser votre activité.
                </p>
                <Link
                  to="/register"
                  className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
                >
                  Créer mon espace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} AgriPilot</p>
          <Link to="/" className="font-medium hover:text-emerald-700">
            Retour à l’accueil
          </Link>
        </div>
      </footer>
    </div>
  )
}
