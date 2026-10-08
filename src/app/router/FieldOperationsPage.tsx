import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Loader2,
  MapPin,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'

import { getInterventions } from '../../lib/api/interventions'
import {
  createFieldOperation,
  deleteFieldOperation,
  getFieldOperations,
  updateFieldOperation,
} from '../../lib/api/field-operations'
import type {
  Intervention,
  InterventionType,
} from '../../types/intervention'
import type {
  CreateFieldOperationPayload,
  FieldOperation,
  FieldOperationIntervention,
  FieldOperationStatus,
  UpdateFieldOperationPayload,
} from '../../types/field-operation'

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

const STATUS_LABELS: Record<FieldOperationStatus, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const STATUS_STYLES: Record<FieldOperationStatus, string> = {
  planned: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

const INITIAL_FORM = {
  interventionId: '',
  startedAt: '',
  completedAt: '',
  durationMinutes: '',
  status: 'planned' as FieldOperationStatus,
  notes: '',
}

function formatDateTime(value?: string) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDuration(minutes?: number) {
  if (minutes === undefined || minutes === null) return '—'

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} h`
  }

  return `${hours} h ${remainingMinutes} min`
}

function toDateTimeLocal(value?: string) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)

  return localDate.toISOString().slice(0, 16)
}

function parseDateTimeLocal(value: string) {
  if (!value) return undefined

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export default function FieldOperationsPage() {
  const [operations, setOperations] = useState<FieldOperation[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | FieldOperationStatus
  >('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOperation, setEditingOperation] =
    useState<FieldOperation | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [operationsData, interventionsData] = await Promise.all([
          getFieldOperations(),
          getInterventions(),
        ])

        if (!isMounted) return

        setOperations(operationsData)
        setInterventions(interventionsData)
      } catch {
        if (!isMounted) return
        setError('Impossible de charger les opérations terrain.')
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

  const availableInterventions = useMemo(() => {
    const operationInterventionIds = new Set(
      operations.map((operation) => operation.intervention.id),
    )

    return interventions.filter(
      (intervention) => !operationInterventionIds.has(intervention.id),
    )
  }, [interventions, operations])

  const filteredOperations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return operations.filter((operation) => {
      const matchesStatus =
        statusFilter === 'all' || operation.status === statusFilter

      if (!matchesStatus) return false
      if (!normalizedSearch) return true

      const intervention = operation.intervention
      const crop = intervention.campaign.crop
      const field = crop.field

      const searchableText = [
        intervention.name,
        TYPE_LABELS[intervention.type],
        intervention.campaign.name,
        crop.name,
        crop.variety ?? '',
        field.name,
        field.farm.name,
        operation.notes ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })
  }, [operations, search, statusFilter])

  const stats = useMemo(
    () => ({
      total: operations.length,
      planned: operations.filter(
        (operation) => operation.status === 'planned',
      ).length,
      inProgress: operations.filter(
        (operation) => operation.status === 'in_progress',
      ).length,
      completed: operations.filter(
        (operation) => operation.status === 'completed',
      ).length,
    }),
    [operations],
  )

  function openCreateModal() {
    setEditingOperation(null)
    setForm({
      ...INITIAL_FORM,
      interventionId: availableInterventions[0]?.id ?? '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function openEditModal(operation: FieldOperation) {
    setEditingOperation(operation)
    setForm({
      interventionId: operation.intervention.id,
      startedAt: toDateTimeLocal(operation.startedAt),
      completedAt: toDateTimeLocal(operation.completedAt),
      durationMinutes:
        operation.durationMinutes !== undefined
          ? String(operation.durationMinutes)
          : '',
      status: operation.status,
      notes: operation.notes ?? '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return

    setIsModalOpen(false)
    setEditingOperation(null)
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
    if (!form.interventionId) {
      return 'L’intervention est obligatoire.'
    }

    if (
      form.startedAt &&
      form.completedAt &&
      new Date(form.completedAt) < new Date(form.startedAt)
    ) {
      return 'La date de fin ne peut pas être antérieure à la date de début.'
    }

    if (
      form.durationMinutes &&
      (!Number.isInteger(Number(form.durationMinutes)) ||
        Number(form.durationMinutes) < 0)
    ) {
      return 'La durée doit être un nombre entier positif ou nul.'
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

      if (editingOperation) {
        const payload: UpdateFieldOperationPayload = {
          startedAt: parseDateTimeLocal(form.startedAt),
          completedAt: parseDateTimeLocal(form.completedAt),
          durationMinutes: form.durationMinutes
            ? Number(form.durationMinutes)
            : undefined,
          status: form.status,
          notes: form.notes.trim() || undefined,
        }

        const updated = await updateFieldOperation(
          editingOperation.id,
          payload,
        )

        setOperations((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        )
      } else {
        const payload: CreateFieldOperationPayload = {
          interventionId: form.interventionId,
          startedAt: parseDateTimeLocal(form.startedAt),
          completedAt: parseDateTimeLocal(form.completedAt),
          durationMinutes: form.durationMinutes
            ? Number(form.durationMinutes)
            : undefined,
          status: form.status,
          notes: form.notes.trim() || undefined,
        }

        const created = await createFieldOperation(payload)

        setOperations((current) => [created, ...current])
      }

      closeModal()
    } catch {
      setFormError(
        editingOperation
          ? 'Impossible de modifier cette opération terrain.'
          : 'Impossible de créer cette opération terrain.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(operation: FieldOperation) {
    const confirmed = window.confirm(
      `Supprimer l’opération « ${operation.intervention.name} » ?`,
    )

    if (!confirmed) return

    try {
      setDeletingId(operation.id)
      await deleteFieldOperation(operation.id)

      setOperations((current) =>
        current.filter((item) => item.id !== operation.id),
      )
    } catch {
      setError('Impossible de supprimer cette opération terrain.')
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
            Opérations terrain
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivez l’exécution réelle des interventions sur vos parcelles.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={availableInterventions.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Nouvelle opération
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardCheck size={20} />}
          label="Total"
          value={stats.total}
        />
        <StatCard
          icon={<Clock3 size={20} />}
          label="Planifiées"
          value={stats.planned}
        />
        <StatCard
          icon={<PlayCircle size={20} />}
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
              placeholder="Rechercher une opération, parcelle, culture..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="relative lg:w-56">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as 'all' | FieldOperationStatus,
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
      ) : filteredOperations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <ClipboardCheck
            size={42}
            className="mx-auto text-slate-300"
          />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {operations.length === 0
              ? 'Aucune opération terrain'
              : 'Aucun résultat'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {operations.length === 0
              ? availableInterventions.length === 0
                ? 'Créez d’abord une intervention pour pouvoir enregistrer son exécution terrain.'
                : 'Commencez par enregistrer votre première opération terrain.'
              : 'Modifiez votre recherche ou votre filtre pour afficher des opérations.'}
          </p>

          {operations.length === 0 && availableInterventions.length > 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus size={18} />
              Enregistrer une opération
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredOperations.map((operation) => (
            <FieldOperationCard
              key={operation.id}
              operation={operation}
              deleting={deletingId === operation.id}
              onEdit={() => openEditModal(operation)}
              onDelete={() => void handleDelete(operation)}
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
                  {editingOperation
                    ? 'Modifier l’opération terrain'
                    : 'Nouvelle opération terrain'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingOperation
                    ? 'Mettez à jour les informations d’exécution.'
                    : 'Enregistrez l’exécution d’une intervention existante.'}
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

              <Field label="Intervention" required>
                <select
                  value={form.interventionId}
                  onChange={(event) =>
                    updateField('interventionId', event.target.value)
                  }
                  disabled={Boolean(editingOperation)}
                  className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">Sélectionner une intervention</option>
                  {(editingOperation
                    ? [editingOperation.intervention]
                    : availableInterventions
                  ).map((intervention) => (
                    <option key={intervention.id} value={intervention.id}>
                      {intervention.name} ·{' '}
                      {TYPE_LABELS[intervention.type]} ·{' '}
                      {intervention.campaign.name} ·{' '}
                      {intervention.campaign.crop.field.name}
                    </option>
                  ))}
                </select>

                {editingOperation && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    L’intervention ne peut pas être modifiée après création.
                  </p>
                )}
              </Field>

              {form.interventionId && (
                <OperationContext
                  intervention={
                    editingOperation?.intervention ??
                    (() => {
                      const selected = interventions.find(
                        (item) => item.id === form.interventionId,
                      )

                      if (!selected) return undefined

                      return {
                        id: selected.id,
                        name: selected.name,
                        type: selected.type,
                        scheduledDate: selected.scheduledDate,
                        status: selected.status,
                        campaign: selected.campaign,
                      }
                    })()
                  }
                />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Début">
                  <input
                    type="datetime-local"
                    value={form.startedAt}
                    onChange={(event) =>
                      updateField('startedAt', event.target.value)
                    }
                    className="form-input"
                  />
                </Field>

                <Field label="Fin">
                  <input
                    type="datetime-local"
                    value={form.completedAt}
                    onChange={(event) =>
                      updateField('completedAt', event.target.value)
                    }
                    className="form-input"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Durée (minutes)">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.durationMinutes}
                    onChange={(event) =>
                      updateField('durationMinutes', event.target.value)
                    }
                    placeholder="Ex. 120"
                    className="form-input"
                  />
                </Field>

                <Field label="Statut">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        'status',
                        event.target.value as FieldOperationStatus,
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
              </div>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateField('notes', event.target.value)
                  }
                  rows={4}
                  placeholder="Compte rendu ou informations complémentaires..."
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
                  {editingOperation ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function OperationContext({
  intervention,
}: {
  intervention?: FieldOperationIntervention
}) {
  if (!intervention) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <MapPin size={18} className="mt-0.5 shrink-0 text-emerald-600" />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {intervention.campaign.crop.name}
            {intervention.campaign.crop.variety
              ? ` · ${intervention.campaign.crop.variety}`
              : ''}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {intervention.campaign.crop.field.name} ·{' '}
            {intervention.campaign.crop.field.farm.name}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {intervention.campaign.name} ·{' '}
            {TYPE_LABELS[intervention.type]}
          </p>
        </div>
      </div>
    </div>
  )
}

function FieldOperationCard({
  operation,
  deleting,
  onEdit,
  onDelete,
}: {
  operation: FieldOperation
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const intervention = operation.intervention
  const crop = intervention.campaign.crop
  const field = crop.field

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[operation.status]}`}
            >
              {STATUS_LABELS[operation.status]}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {TYPE_LABELS[intervention.type]}
            </span>
          </div>

          <h2 className="mt-3 truncate text-base font-bold text-slate-900">
            {intervention.name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {intervention.campaign.name} · {crop.name}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Modifier"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label="Supprimer"
          >
            {deleting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Trash2 size={17} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <InfoItem
          label="Parcelle"
          value={`${field.name} · ${field.farm.name}`}
        />
        <InfoItem
          label="Début"
          value={formatDateTime(operation.startedAt)}
        />
        <InfoItem
          label="Fin"
          value={formatDateTime(operation.completedAt)}
        />
        <InfoItem
          label="Durée"
          value={formatDuration(operation.durationMinutes)}
        />
      </div>

      {operation.notes && (
        <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
          {operation.notes}
        </div>
      )}
    </div>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  )
}
