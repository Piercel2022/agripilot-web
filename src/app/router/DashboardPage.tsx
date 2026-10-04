import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Map,
  Plus,
  Sprout,
  Tractor,
  TrendingUp,
  Wheat,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

const kpis = [
  {
    label: 'Exploitations',
    value: '1',
    detail: 'exploitation active',
    icon: Tractor,
  },
  {
    label: 'Parcelles',
    value: '1',
    detail: 'parcelle suivie',
    icon: Map,
  },
  {
    label: 'Surface agricole',
    value: '12,5 ha',
    detail: 'surface enregistrée',
    icon: TrendingUp,
  },
  {
    label: 'Campagnes actives',
    value: '1',
    detail: 'campagne en cours',
    icon: Wheat,
  },
]

const upcomingInterventions = [
  {
    title: 'Préparation du sol',
    field: 'Parcelle Nord',
    date: 'Aujourd’hui',
    time: '08:30',
    type: 'Travail du sol',
  },
  {
    title: 'Observation culturale',
    field: 'Parcelle Nord',
    date: 'Demain',
    time: '10:00',
    type: 'Observation',
  },
  {
    title: 'Fertilisation',
    field: 'Parcelle Nord',
    date: '08 oct.',
    time: '14:00',
    type: 'Fertilisation',
  },
]

const recentActivity = [
  {
    title: 'Campagne mise à jour',
    description: 'Blé tendre → Maïs',
    date: 'Aujourd’hui',
  },
  {
    title: 'Parcelle enregistrée',
    description: 'Parcelle Nord · 12,5 ha',
    date: 'Hier',
  },
  {
    title: 'Exploitation créée',
    description: 'Ferme des Trois Vallées',
    date: 'Hier',
  },
]

function DashboardPage() {
  const { user } = useAuth()

  const firstName = user?.firstName || 'agriculteur'
  const organizationName = user?.organization.name || 'votre exploitation'

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="rounded-2xl bg-emerald-700 px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-100">
              Tableau de bord
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Bonjour, {firstName}.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100 sm:text-base">
              Voici l’état actuel de {organizationName}. Gardez une vision
              claire de vos parcelles, cultures et opérations agricoles.
            </p>
          </div>

          <Link
            to="/app/interventions"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
          >
            <Plus className="h-4 w-4" />
            Nouvelle intervention
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon

          return (
            <article
              key={kpi.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {kpi.label}
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {kpi.value}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">{kpi.detail}</p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Prochaines interventions
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Les opérations planifiées sur vos parcelles.
              </p>
            </div>

            <Link
              to="/app/interventions"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingInterventions.map((intervention) => (
              <div
                key={`${intervention.title}-${intervention.date}`}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <CalendarDays className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {intervention.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {intervention.field} · {intervention.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 sm:pl-4">
                  <Clock3 className="h-4 w-4" />
                  <span>
                    {intervention.date} · {intervention.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              État de l’exploitation
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Les principaux éléments à surveiller.
            </p>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Parcelles configurées
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Vos parcelles sont disponibles pour le suivi des cultures.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Sprout className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Campagne en cours
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Blé tendre → Maïs · Ferme des Trois Vallées.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Prochaine étape recommandée
              </p>

              <Link
                to="/app/fields"
                className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Compléter le suivi des parcelles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Activité récente</h2>
          <p className="mt-1 text-xs text-slate-500">
            Les dernières actions enregistrées dans AgriPilot.
          </p>
        </div>

        <div className="grid gap-0 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          {recentActivity.map((activity) => (
            <div key={activity.title} className="px-5 py-5">
              <p className="text-sm font-semibold text-slate-800">
                {activity.title}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {activity.description}
              </p>

              <p className="mt-3 text-xs font-medium text-slate-400">
                {activity.date}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
