import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Droplets,
  Eye,
  Factory,
  FlaskConical,
  Gauge,
  Leaf,
  Map,
  MapPin,
  Plus,
  Sprout,
  Tractor,
  Wheat,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { getFarms } from '../../lib/api/farms'
import { getFields } from '../../lib/api/fields'
import { getCrops } from '../../lib/api/crops'
import { getCampaigns } from '../../lib/api/campaigns'
import { getInterventions } from '../../lib/api/interventions'
import { getFieldOperations } from '../../lib/api/field-operations'
import { getObservations } from '../../lib/api/observation'
import { getHarvests } from '../../lib/api/harvest'

import type { Campaign } from '../../types/campaign'
import type { Crop } from '../../types/crop'
import type { Farm } from '../../types/farm'
import type { Field } from '../../types/field'
import type { FieldOperation } from '../../types/field-operation'
import type { Harvest } from '../../types/harvest'
import type { Intervention } from '../../types/intervention'
import type { Observation } from '../../types/observation'

type DashboardData = {
  farms: Farm[]
  fields: Field[]
  crops: Crop[]
  campaigns: Campaign[]
  interventions: Intervention[]
  fieldOperations: FieldOperation[]
  observations: Observation[]
  harvests: Harvest[]
}

const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  sowing: 'Semis',
  fertilization: 'Fertilisation',
  phytosanitary: 'Phytosanitaire',
  irrigation: 'Irrigation',
  weeding: 'Désherbage',
  soil_work: 'Travail du sol',
  harvest: 'Récolte',
  observation: 'Observation',
}

const INTERVENTION_STATUS_LABELS: Record<string, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const FIELD_OPERATION_STATUS_LABELS: Record<string, string> = {
  planned: 'Planifiées',
  in_progress: 'En cours',
  completed: 'Terminées',
  cancelled: 'Annulées',
}

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  critical: 'Critique',
}

const SEVERITY_CLASSES: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
}

const formatDate = (value?: string) => {
  if (!value) return '—'

  const date = new Date(
    value.length <= 10 ? `${value}T00:00:00` : value,
  )

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits,
  }).format(value)

const getErrorMessage = (error: unknown) => {
  const requestError = error as {
    response?: {
      data?: {
        message?: string
        error?: string
      }
    }
  }

  return (
    requestError.response?.data?.message ||
    requestError.response?.data?.error ||
    'Impossible de charger les données du dashboard.'
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Factory
  label: string
  value: string | number
  description?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>

        {description && (
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        )}
      </div>
    </div>
  )
}

function Section({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string
  description?: string
  icon: typeof Factory
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Icon className="h-4.5 w-4.5" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>

            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
        </div>

        {action}
      </div>

      <div className="p-5">{children}</div>
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === 'completed'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'in_progress'
        ? 'bg-blue-50 text-blue-700'
        : status === 'cancelled'
          ? 'bg-red-50 text-red-700'
          : 'bg-amber-50 text-amber-700'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {INTERVENTION_STATUS_LABELS[status] || status}
    </span>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    farms: [],
    fields: [],
    crops: [],
    campaigns: [],
    interventions: [],
    fieldOperations: [],
    observations: [],
    harvests: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [
          farmsData,
          fieldsData,
          cropsData,
          campaignsData,
          interventionsData,
          fieldOperationsData,
          observationsData,
          harvestsData,
        ] = await Promise.all([
          getFarms(),
          getFields(),
          getCrops(),
          getCampaigns(),
          getInterventions(),
          getFieldOperations(),
          getObservations(),
          getHarvests(),
        ])

        if (cancelled) return

        setData({
          farms: Array.isArray(farmsData) ? farmsData : [],
          fields: Array.isArray(fieldsData) ? fieldsData : [],
          crops: Array.isArray(cropsData) ? cropsData : [],
          campaigns: Array.isArray(campaignsData)
            ? campaignsData
            : [],
          interventions: Array.isArray(interventionsData)
            ? interventionsData
            : [],
          fieldOperations: Array.isArray(fieldOperationsData)
            ? fieldOperationsData
            : [],
          observations: Array.isArray(observationsData)
            ? observationsData
            : [],
          harvests: Array.isArray(harvestsData)
            ? harvestsData
            : [],
        })
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const totalSurface = useMemo(() => {
    return data.fields.reduce((total, field) => {
      return total + field.areaHectares
    }, 0)
  }, [data.fields])

  const activeCrops = useMemo(() => {
    return data.crops.filter((crop) => crop.status === 'active')
  }, [data.crops])

  const activeCampaigns = useMemo(() => {
    return data.campaigns.filter(
      (campaign) => campaign.status === 'active',
    )
  }, [data.campaigns])

  const plannedInterventions = useMemo(
    () =>
      data.interventions.filter(
        (intervention) => intervention.status === 'planned',
      ),
    [data.interventions],
  )

  const inProgressFieldOperations = useMemo(
    () =>
      data.fieldOperations.filter(
        (operation) => operation.status === 'in_progress',
      ),
    [data.fieldOperations],
  )

  const completedInterventions = useMemo(
    () =>
      data.interventions.filter(
        (intervention) => intervention.status === 'completed',
      ),
    [data.interventions],
  )

  const recentObservations = useMemo(() => {
    return [...data.observations]
      .sort((a, b) => {
        const dateA = new Date(
          a.observedAt || a.createdAt || 0,
        ).getTime()

        const dateB = new Date(
          b.observedAt || b.createdAt || 0,
        ).getTime()

        return dateB - dateA
      })
      .slice(0, 5)
  }, [data.observations])

  const upcomingInterventions = useMemo(() => {
    return [...data.interventions]
      .filter(
        (intervention) =>
          Boolean(intervention.scheduledDate) &&
          intervention.status !== 'completed' &&
          intervention.status !== 'cancelled',
      )
      .sort((a, b) => {
        const dateA = new Date(a.scheduledDate || 0).getTime()
        const dateB = new Date(b.scheduledDate || 0).getTime()

        return dateA - dateB
      })
      .slice(0, 6)
  }, [data.interventions])

  const fieldOperationStats = useMemo(() => {
    return {
      planned: data.fieldOperations.filter(
        (operation) => operation.status === 'planned',
      ).length,
      inProgress: data.fieldOperations.filter(
        (operation) => operation.status === 'in_progress',
      ).length,
      completed: data.fieldOperations.filter(
        (operation) => operation.status === 'completed',
      ).length,
      cancelled: data.fieldOperations.filter(
        (operation) => operation.status === 'cancelled',
      ).length,
    }
  }, [data.fieldOperations])

  const observationStats = useMemo(() => {
    return {
      low: data.observations.filter(
        (observation) => observation.severity === 'low',
      ).length,
      medium: data.observations.filter(
        (observation) => observation.severity === 'medium',
      ).length,
      high: data.observations.filter(
        (observation) => observation.severity === 'high',
      ).length,
      critical: data.observations.filter(
        (observation) => observation.severity === 'critical',
      ).length,
    }
  }, [data.observations])

  const recentHarvests = useMemo(() => {
    return [...data.harvests]
      .sort((a, b) => {
        const dateA = new Date(a.harvestDate || 0).getTime()
        const dateB = new Date(b.harvestDate || 0).getTime()

        return dateB - dateA
      })
      .slice(0, 5)
  }, [data.harvests])

  const irrigationStats = useMemo(() => {
    const irrigationInterventions = data.interventions.filter(
      (intervention) => intervention.type === 'irrigation',
    )

    return {
      planned: irrigationInterventions.filter(
        (intervention) => intervention.status === 'planned',
      ).length,
      inProgress: irrigationInterventions.filter(
        (intervention) => intervention.status === 'in_progress',
      ).length,
      completed: irrigationInterventions.filter(
        (intervention) => intervention.status === 'completed',
      ).length,
    }
  }, [data.interventions])

  const activityStats = useMemo(() => {
    return {
      planned: plannedInterventions.length,
      inProgress: inProgressFieldOperations.length,
      completed: completedInterventions.length,
      observations: data.observations.length,
    }
  }, [
    plannedInterventions.length,
    inProgressFieldOperations.length,
    completedInterventions.length,
    data.observations.length,
  ])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
          </div>

          <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Pilotage agricole
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Vue synthétique de vos exploitations, parcelles,
            cultures et opérations agricoles.
          </p>
        </div>

        <Link
          to="/app/interventions/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle intervention
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />

          <div>
            <p className="font-medium">
              Impossible de charger le dashboard
            </p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          icon={Factory}
          label="Exploitations"
          value={data.farms.length}
        />

        <KpiCard
          icon={Map}
          label="Parcelles"
          value={data.fields.length}
        />

        <KpiCard
          icon={Gauge}
          label="Surface agricole"
          value={`${formatNumber(totalSurface)} ha`}
        />

        <KpiCard
          icon={Sprout}
          label="Cultures actives"
          value={activeCrops.length}
        />

        <KpiCard
          icon={CalendarDays}
          label="Campagnes actives"
          value={activeCampaigns.length}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <Section
            title="Activité opérationnelle"
            description="État actuel des principales activités agricoles."
            icon={Tractor}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Interventions planifiées
                  </span>
                </div>

                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {activityStats.planned}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Tractor className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Opérations en cours
                  </span>
                </div>

                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {activityStats.inProgress}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Interventions terminées
                  </span>
                </div>

                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {activityStats.completed}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Observations
                  </span>
                </div>

                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {activityStats.observations}
                </p>
              </div>
            </div>
          </Section>
        </div>

        <Section
          title="Irrigation"
          description="Interventions d'irrigation par statut."
          icon={Droplets}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Planifiées</span>
              <span className="font-semibold text-slate-900">
                {irrigationStats.planned}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">En cours</span>
              <span className="font-semibold text-slate-900">
                {irrigationStats.inProgress}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Terminées</span>
              <span className="font-semibold text-slate-900">
                {irrigationStats.completed}
              </span>
            </div>

            <Link
              to="/app/irrigations"
              className="mt-3 inline-flex text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Voir les irrigations →
            </Link>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section
          title="Prochaines interventions"
          description="Interventions triées par date planifiée."
          icon={CalendarDays}
          action={
            <Link
              to="/app/interventions"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Voir tout
            </Link>
          }
        >
          {upcomingInterventions.length === 0 ? (
            <EmptyState message="Aucune intervention à venir." />
          ) : (
            <div className="space-y-3">
              {upcomingInterventions.map((intervention) => {
                const campaign = intervention.campaign
                const crop = campaign.crop
                const field = crop.field
                const farm = field.farm

                return (
                  <div
                    key={intervention.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {intervention.name}
                          </span>

                          <StatusBadge
                            status={intervention.status}
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            {INTERVENTION_TYPE_LABELS[
                              intervention.type
                            ] || intervention.type}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Sprout className="h-3.5 w-3.5" />
                            {crop.name}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {field.name}
                          </span>

                          <span>{farm.name}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-xs text-slate-400">
                          Date
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-slate-700">
                          {formatDate(intervention.scheduledDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        <Section
          title="Opérations terrain"
          description="Répartition réelle des opérations terrain."
          icon={Tractor}
          action={
            <Link
              to="/app/field-operations"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Voir tout
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
              <p className="text-xs font-medium text-amber-700">
                {FIELD_OPERATION_STATUS_LABELS.planned}
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {fieldOperationStats.planned}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-xs font-medium text-blue-700">
                {FIELD_OPERATION_STATUS_LABELS.in_progress}
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {fieldOperationStats.inProgress}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-xs font-medium text-emerald-700">
                {FIELD_OPERATION_STATUS_LABELS.completed}
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {fieldOperationStats.completed}
              </p>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
              <p className="text-xs font-medium text-red-700">
                {FIELD_OPERATION_STATUS_LABELS.cancelled}
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {fieldOperationStats.cancelled}
              </p>
            </div>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section
          title="Suivi agricole"
          description="Cultures, campagnes et niveau de vigilance."
          icon={Leaf}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700">
                  Cultures actives
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {activeCrops.length}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-600">
                  Campagnes actives
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {activeCampaigns.length}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-slate-800">
                  Observations par gravité
                </p>
              </div>

              <div className="space-y-2">
                {(
                  ['low', 'medium', 'high', 'critical'] as const
                ).map((severity) => (
                  <div
                    key={severity}
                    className="flex items-center justify-between"
                  >
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_CLASSES[severity]}`}
                    >
                      {SEVERITY_LABELS[severity]}
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {observationStats[severity]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Observations récentes"
          description="Dernières observations enregistrées."
          icon={Eye}
          action={
            <Link
              to="/app/observations"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Voir tout
            </Link>
          }
        >
          {recentObservations.length === 0 ? (
            <EmptyState message="Aucune observation récente." />
          ) : (
            <div className="space-y-3">
              {recentObservations.map((observation) => (
                <div
                  key={observation.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-slate-50/70 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {observation.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {observation.field.name}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {observation.severity && (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${
                          SEVERITY_CLASSES[
                            observation.severity
                          ] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {SEVERITY_LABELS[
                          observation.severity
                        ] || observation.severity}
                      </span>
                    )}

                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatDate(
                        observation.observedAt ||
                          observation.createdAt,
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Dernières récoltes"
          description="Suivi des récoltes et rendements disponibles."
          icon={Wheat}
          action={
            <Link
              to="/app/harvests"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Voir tout
            </Link>
          }
        >
          {recentHarvests.length === 0 ? (
            <EmptyState message="Aucune récolte enregistrée." />
          ) : (
            <div className="space-y-3">
              {recentHarvests.map((harvest) => {
                const cropName = harvest.crop.name

                return (
                  <div
                    key={harvest.id}
                    className="rounded-xl bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {cropName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatNumber(harvest.quantity)}{' '}
                          {harvest.unit}
                        </p>
                      </div>

                      <div className="text-right">
                        {harvest.yield !== undefined ? (
                          <p className="text-sm font-semibold text-emerald-700">
                            Rendement :{' '}
                            {formatNumber(harvest.yield, 2)}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Rendement non renseigné
                          </p>
                        )}

                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatDate(harvest.harvestDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>
      </div>

      <Section
        title="Opérations agricoles"
        description="Accès rapide aux modules opérationnels."
        icon={FlaskConical}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/app/interventions"
            className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-emerald-600" />

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Interventions
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Planning agricole
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/app/fertilisations"
            className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
          >
            <div className="flex items-center gap-3">
              <FlaskConical className="h-5 w-5 text-emerald-600" />

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Fertilisation
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Opérations de fertilisation
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/app/phytosanitary"
            className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
          >
            <div className="flex items-center gap-3">
              <Leaf className="h-5 w-5 text-emerald-600" />

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Phytosanitaire
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Traitements agricoles
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/app/irrigations"
            className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
          >
            <div className="flex items-center gap-3">
              <Droplets className="h-5 w-5 text-emerald-600" />

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Irrigation
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Gestion de l'irrigation
                </p>
              </div>
            </div>
          </Link>
        </div>
      </Section>
    </div>
  )
}
