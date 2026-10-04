import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'

import { getCampaigns } from '../../lib/api/campaigns'
import {
  createIntervention,
  deleteIntervention,
  getInterventions,
  updateIntervention,
} from '../../lib/api/interventions'
import type { Campaign } from '../../types/campaign'
import type {
  CreateInterventionPayload,
  Intervention,
  InterventionStatus,
  InterventionType,
  UpdateInterventionPayload,
} from '../../types/intervention'

const TYPE_LABELS: Record<InterventionType, string> = {
  sowing: 'Semis',
  fertilization: 'Fertilisation',
  phytosanitary: 'Phytosanitaire',
  irrigation: 'Irrigation',
  weeding: 'Désherbage',
  soil_work: 'Travail du sol',
  harvest: 'Récolte',
  observation: 'Observation',
}

const STATUS_LABELS: Record<InterventionStatus, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const STATUS_STYLES: Record<InterventionStatus, string> = {
  planned: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

const INITIAL_FORM = {
  name: '',
  type: 'observation' as InterventionType,
  scheduledDate: '',
  completedDate: '',
  status: 'planned' as InterventionStatus,
  notes: '',
  campaignId: '',
}

function formatDate(value?: string) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
  }).format(new Date(`${value}T00:00:00`))
}

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | InterventionStatus>(
    'all',
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIntervention, setEditingIntervention] =
    useState<Intervention | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [interventionsData, campaignsData] = await Promise.all([
          getInterventions(),
          getCampaigns(),
        ])

        if (!isMounted) return

        setInterventions(interventionsData)
        setCampaigns(campaignsData)
      } catch {
        if (!isMounted) return
        setError('Impossible de charger les interventions.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredInterventions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return interventions.filter((intervention) => {
      const matchesStatus =
        statusFilter === 'all' || intervention.status === statusFilter

      if (!matchesStatus) return false
      if (!normalizedSearch) return true

      const searchableText = [
        intervention.name,
        TYPE_LABELS[intervention.type],
        intervention.campaign.name,
        intervention.campaign.crop.name,
        intervention.campaign.crop.field.name,
        intervention.campaign.crop.field.farm.name,
        intervention.notes ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })
  }, [interventions, search, statusFilter])

  const stats = useMemo(
    () => ({
      total: interventions.length,
      planned: interventions.filter(
        (intervention) => intervention.status === 'planned',
      ).length,
      inProgress: interventions.filter(
        (intervention) => intervention.status === 'in_progress',
      ).length,
      completed: interventions.filter(
        (intervention) => intervention.status === 'completed',
      ).length,
    }),
    [interventions],
  )

  function openCreateModal() {
    setEditingIntervention(null)
    setForm({
      ...INITIAL_FORM,
      campaignId: campaigns[0]?.id ?? '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function openEditModal(intervention: Intervention) {
    setEditingIntervention(intervention)
    setForm({
      name: intervention.name,
      type: intervention.type,
      scheduledDate: intervention.scheduledDate ?? '',
      completedDate: intervention.completedDate ?? '',
      status: intervention.status,
      notes: intervention.notes ?? '',
      campaignId: intervention.campaign.id,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setIsModalOpen(false)
    setEditingIntervention(null)
    setFormError('')
  }

  function updateField<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function validateForm() {
    if (!form.name.trim()) {
      return 'Le nom de l’intervention est obligatoire.'
    }

    if (!form.campaignId) {
      return 'La campagne est obligatoire.'
    }

    if (form.scheduledDate && form.completedDate) {
      if (form.completedDate < form.scheduledDate) {
        return 'La date de fin ne peut pas être antérieure à la date prévue.'
      }
    }

    return ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      setSaving(true)
      setFormError('')

      if (editingIntervention) {
        const payload: UpdateInterventionPayload = {
          name: form.name.trim(),
          type: form.type,
          scheduledDate: form.scheduledDate || undefined,
          completedDate: form.completedDate || undefined,
          status: form.status,
          notes: form.notes.trim() || undefined,
        }

        const updated = await updateIntervention(
          editingIntervention.id,
          payload,
        )

        setInterventions((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        )
      } else {
        const payload: CreateInterventionPayload = {
          name: form.name.trim(),
          type: form.type,
          scheduledDate: form.scheduledDate || undefined,
          completedDate: form.completedDate || undefined,
          status: form.status,
          notes: form.notes.trim() || undefined,
          campaignId: form.campaignId,
        }

        const created = await createIntervention(payload)

        setInterventions((current) => [created, ...current])
      }

      closeModal()
    } catch {
      setFormError(
        editingIntervention
          ? 'Impossible de modifier l’intervention.'
          : 'Impossible de créer l’intervention.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(intervention: Intervention) {
    const confirmed = window.confirm(
      `Supprimer l’intervention « ${intervention.name} » ?`,
    )

    if (!confirmed) return

    try {
      setDeletingId(intervention.id)
      await deleteIntervention(intervention.id)
      setInterventions((current) =>
        current.filter((item) => item.id !== intervention.id),
      )
    } catch {
      setError('Impossible de supprimer cette intervention.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">Opérations</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Interventions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Planifiez et suivez les interventions liées à vos campagnes.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={campaigns.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Nouvelle intervention
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Total"
          value={stats.total}
        />
        <StatCard
          icon={<Clock3 size={20} />}
          label="Planifiées"
          value={stats.planned}
        />
        <StatCard
          icon={<CalendarDays size={20} />}
          label="En cours"
          value={stats.inProgress}
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Terminées"
          value={stats.completed}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une intervention, campagne, culture..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="relative lg:w-56">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as 'all' | InterventionStatus,
                )
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Tous les statuts</option>
              <option value="planned">Planifiées</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminées</option>
              <option value="cancelled">Annulées</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="animate-spin text-emerald-600" size={28} />
        </div>
      ) : filteredInterventions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <ClipboardList
            size={42}
            className="mx-auto text-slate-300"
          />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {interventions.length === 0
              ? 'Aucune intervention'
              : 'Aucun résultat'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {interventions.length === 0
              ? campaigns.length === 0
                ? 'Créez d’abord une campagne pour pouvoir planifier une intervention.'
                : 'Commencez par créer votre première intervention.'
              : 'Modifiez votre recherche ou votre filtre pour afficher des interventions.'}
          </p>

          {interventions.length === 0 && campaigns.length > 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus size={18} />
              Créer une intervention
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredInterventions.map((intervention) => (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
              deleting={deletingId === intervention.id}
              onEdit={() => openEditModal(intervention)}
              onDelete={() => void handleDelete(intervention)}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingIntervention
                    ? 'Modifier l’intervention'
                    : 'Nouvelle intervention'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingIntervention
                    ? 'Mettez à jour les informations de l’intervention.'
                    : 'Planifiez une intervention sur une campagne existante.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom" required>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField('name', event.target.value)
                    }
                    placeholder="Ex. Semis du blé tendre"
                    className="form-input"
                  />
                </Field>

                <Field label="Type" required>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      updateField(
                        'type',
                        event.target.value as InterventionType,
                      )
                    }
                    className="form-input"
                  >
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Campagne" required>
                <select
                  value={form.campaignId}
                  onChange={(event) =>
                    updateField('campaignId', event.target.value)
                  }
                  disabled={Boolean(editingIntervention)}
                  className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">Sélectionner une campagne</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name} · {campaign.crop.name} ·{' '}
                      {campaign.crop.field.name}
                    </option>
                  ))}
                </select>
                {editingIntervention && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    La campagne ne peut pas être modifiée après création.
                  </p>
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date prévue">
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(event) =>
                      updateField('scheduledDate', event.target.value)
                    }
                    className="form-input"
                  />
                </Field>

                <Field label="Date de réalisation">
                  <input
                    type="date"
                    value={form.completedDate}
                    onChange={(event) =>
                      updateField('completedDate', event.target.value)
                    }
                    className="form-input"
                  />
                </Field>
              </div>

              <Field label="Statut">
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      'status',
                      event.target.value as InterventionStatus,
                    )
                  }
                  className="form-input"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateField('notes', event.target.value)
                  }
                  rows={4}
                  placeholder="Observations ou informations complémentaires..."
                  className="form-input resize-none"
                />
              </Field>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}
                  {editingIntervention ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
          {icon}
        </div>
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}

function InterventionCard({
  intervention,
  deleting,
  onEdit,
  onDelete,
}: {
  intervention: Intervention
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-bold text-slate-900">
              {intervention.name}
            </h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[intervention.status]}`}
            >
              {STATUS_LABELS[intervention.status]}
            </span>
          </div>

          <p className="mt-1 text-sm font-medium text-emerald-700">
            {TYPE_LABELS[intervention.type]}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Modifier ${intervention.name}`}
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label={`Supprimer ${intervention.name}`}
          >
            {deleting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Trash2 size={17} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">
          {intervention.campaign.name}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {intervention.campaign.crop.name} ·{' '}
          {intervention.campaign.crop.field.name} ·{' '}
          {intervention.campaign.crop.field.farm.name}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoItem
          icon={<CalendarDays size={16} />}
          label="Date prévue"
          value={formatDate(intervention.scheduledDate)}
        />
        <InfoItem
          icon={<CheckCircle2 size={16} />}
          label="Réalisation"
          value={formatDate(intervention.completedDate)}
        />
      </div>

      {intervention.notes && (
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
          {intervention.notes}
        </p>
      )}
    </article>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
}
