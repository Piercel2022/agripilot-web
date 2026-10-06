import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  Droplets,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Waves,
  X,
  XCircle,
} from 'lucide-react'

import {
  createIrrigation,
  deleteIrrigation,
  getIrrigations,
  updateIrrigation,
} from '../../lib/api/irrigation'
import { getInterventions } from '../../lib/api/interventions'
import type {
  CreateIrrigationPayload,
  Irrigation,
  IrrigationMethod,
  IrrigationStatus,
  UpdateIrrigationPayload,
} from '../../types/irrigation'
import type { Intervention } from '../../types/intervention'

const METHOD_LABELS: Record<IrrigationMethod, string> = {
  drip: 'Goutte-à-goutte',
  sprinkler: 'Aspersion',
  pivot: 'Pivot',
  flood: 'Gravitaire',
  manual: 'Manuelle',
  other: 'Autre',
}

const STATUS_LABELS: Record<IrrigationStatus, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const STATUS_CLASSES: Record<IrrigationStatus, string> = {
  planned: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

const emptyForm: CreateIrrigationPayload = {
  name: '',
  method: 'drip',
  scheduledDate: '',
  completedDate: '',
  durationMinutes: undefined,
  waterVolumeLiters: '',
  status: 'planned',
  notes: '',
  interventionId: '',
}

const formatDate = (value?: string) => {
  if (!value) return '—'

  return new Intl.DateTimeFormat('fr-FR').format(
    new Date(`${value.slice(0, 10)}T00:00:00`),
  )
}

const formatDuration = (minutes?: number) => {
  if (!minutes) return '—'

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!hours) return `${remainingMinutes} min`
  if (!remainingMinutes) return `${hours} h`

  return `${hours} h ${remainingMinutes} min`
}

const formatVolume = (value?: string) => {
  if (!value) return '—'

  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) return `${value} L`

  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  }).format(numericValue)} L`
}

const getInterventionLabel = (intervention: Intervention) => {
  const campaign = intervention.campaign?.name ?? 'Campagne inconnue'
  const crop = intervention.campaign?.crop?.name ?? 'Culture inconnue'

  return `${intervention.name} · ${campaign} · ${crop}`
}

export default function IrrigationPage() {
  const [irrigations, setIrrigations] = useState<Irrigation[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | IrrigationStatus>(
    'all',
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIrrigation, setEditingIrrigation] =
    useState<Irrigation | null>(null)
  const [form, setForm] = useState<CreateIrrigationPayload>(emptyForm)
  const [formError, setFormError] = useState('')


    useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const [irrigationsData, interventionsData] = await Promise.all([
          getIrrigations(),
          getInterventions(),
        ])

        if (cancelled) return

        setIrrigations(irrigationsData)
        setInterventions(interventionsData)
      } catch {
        if (cancelled) return

        setError('Impossible de charger les données d’irrigation.')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredIrrigations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return irrigations.filter((irrigation) => {
      const intervention = irrigation.intervention
      const campaign = intervention?.campaign
      const crop = campaign?.crop
      const field = crop?.field
      const farm = field?.farm

      const matchesSearch =
        !normalizedSearch ||
        [
          irrigation.name,
          METHOD_LABELS[irrigation.method],
          irrigation.notes,
          intervention?.name,
          intervention?.type,
          campaign?.name,
          crop?.name,
          crop?.variety,
          field?.name,
          farm?.name,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          )

      const matchesStatus =
        statusFilter === 'all' || irrigation.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [irrigations, search, statusFilter])

  const stats = useMemo(
    () => ({
      total: irrigations.length,
      planned: irrigations.filter(
        (irrigation) => irrigation.status === 'planned',
      ).length,
      inProgress: irrigations.filter(
        (irrigation) => irrigation.status === 'in_progress',
      ).length,
      completed: irrigations.filter(
        (irrigation) => irrigation.status === 'completed',
      ).length,
    }),
    [irrigations],
  )

  const openCreateModal = () => {
    setEditingIrrigation(null)
    setForm({ ...emptyForm })
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (irrigation: Irrigation) => {
    setEditingIrrigation(irrigation)
    setForm({
      name: irrigation.name,
      method: irrigation.method,
      scheduledDate: irrigation.scheduledDate ?? '',
      completedDate: irrigation.completedDate ?? '',
      durationMinutes: irrigation.durationMinutes,
      waterVolumeLiters: irrigation.waterVolumeLiters ?? '',
      status: irrigation.status,
      notes: irrigation.notes ?? '',
      interventionId: irrigation.intervention.id,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setIsModalOpen(false)
    setEditingIrrigation(null)
    setFormError('')
  }

  const validateForm = () => {
    if (!form.name.trim()) {
      return 'Le nom de l’irrigation est obligatoire.'
    }

    if (!editingIrrigation && !form.interventionId) {
      return 'L’intervention est obligatoire.'
    }

    if (
      form.scheduledDate &&
      form.completedDate &&
      form.completedDate < form.scheduledDate
    ) {
      return 'La date de fin ne peut pas être antérieure à la date planifiée.'
    }

    if (
      form.durationMinutes !== undefined &&
      form.durationMinutes !== null &&
      form.durationMinutes < 1
    ) {
      return 'La durée doit être supérieure ou égale à 1 minute.'
    }

    if (form.waterVolumeLiters) {
      const volume = Number(form.waterVolumeLiters)

      if (Number.isNaN(volume) || volume < 0) {
        return 'Le volume d’eau doit être un nombre positif ou nul.'
      }
    }

    return ''
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      return
    }

    setSaving(true)
    setFormError('')

    try {
      if (editingIrrigation) {
        const updatePayload: UpdateIrrigationPayload = {
          name: form.name.trim(),
          method: form.method,
          scheduledDate: form.scheduledDate || undefined,
          completedDate: form.completedDate || undefined,
          durationMinutes: form.durationMinutes,
          waterVolumeLiters: form.waterVolumeLiters || undefined,
          status: form.status,
          notes: form.notes?.trim() || undefined,
        }

        const updated = await updateIrrigation(
          editingIrrigation.id,
          updatePayload,
        )

        setIrrigations((current) =>
          current.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        )
      } else {
        const createPayload: CreateIrrigationPayload = {
          name: form.name.trim(),
          method: form.method,
          scheduledDate: form.scheduledDate || undefined,
          completedDate: form.completedDate || undefined,
          durationMinutes: form.durationMinutes,
          waterVolumeLiters: form.waterVolumeLiters || undefined,
          status: form.status,
          notes: form.notes?.trim() || undefined,
          interventionId: form.interventionId,
        }

        const created = await createIrrigation(createPayload)

        setIrrigations((current) => [created, ...current])
      }

      closeModal()
    } catch {
      setFormError(
        editingIrrigation
          ? 'Impossible de modifier cette irrigation.'
          : 'Impossible de créer cette irrigation.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (irrigation: Irrigation) => {
    const confirmed = window.confirm(
      `Supprimer l’irrigation « ${irrigation.name} » ?`,
    )

    if (!confirmed) return

    try {
      await deleteIrrigation(irrigation.id)

      setIrrigations((current) =>
        current.filter((item) => item.id !== irrigation.id),
      )
    } catch {
      setError('Impossible de supprimer cette irrigation.')
    }
  }

  const updateForm = <K extends keyof CreateIrrigationPayload>(
    key: K,
    value: CreateIrrigationPayload[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Droplets size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Irrigation
              </h1>
              <p className="text-sm text-slate-500">
                Planifiez et suivez les opérations d’irrigation de vos parcelles.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          Nouvelle irrigation
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <Droplets size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {stats.total}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Planifiées</span>
            <Clock3 size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {stats.planned}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">En cours</span>
            <Waves size={18} className="text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {stats.inProgress}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Terminées</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {stats.completed}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une irrigation..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as 'all' | IrrigationStatus,
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">Tous les statuts</option>
            <option value="planned">Planifiées</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>

        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 size={22} className="mr-2 animate-spin" />
            Chargement...
          </div>
        ) : filteredIrrigations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Droplets size={22} />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-900">
              Aucune irrigation trouvée
            </h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Créez une première opération d’irrigation ou modifiez vos critères
              de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Irrigation</th>
                  <th className="px-4 py-3 font-medium">Intervention</th>
                  <th className="px-4 py-3 font-medium">Parcelle</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Durée</th>
                  <th className="px-4 py-3 font-medium">Volume</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredIrrigations.map((irrigation) => (
                  <tr key={irrigation.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">
                        {irrigation.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {METHOD_LABELS[irrigation.method]}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-700">
                        {irrigation.intervention?.name ?? '—'}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {irrigation.intervention?.campaign?.name ?? '—'}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {irrigation.intervention?.campaign?.crop?.field?.name ??
                        '—'}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(irrigation.scheduledDate)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDuration(irrigation.durationMinutes)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatVolume(irrigation.waterVolumeLiters)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[irrigation.status]}`}
                      >
                        {STATUS_LABELS[irrigation.status]}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(irrigation)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          title="Modifier"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(irrigation)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingIrrigation
                    ? 'Modifier l’irrigation'
                    : 'Nouvelle irrigation'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Renseignez les informations de l’opération.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <XCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateForm('name', event.target.value)
                    }
                    placeholder="Ex. Irrigation parcelle Nord"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Méthode *
                  </label>
                  <select
                    value={form.method}
                    onChange={(event) =>
                      updateForm(
                        'method',
                        event.target.value as IrrigationMethod,
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {Object.entries(METHOD_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Intervention *
                  </label>
                  <select
                    value={form.interventionId}
                    onChange={(event) =>
                      updateForm('interventionId', event.target.value)
                    }
                    disabled={Boolean(editingIrrigation)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">Sélectionner une intervention</option>
                    {interventions.map((intervention) => (
                      <option
                        key={intervention.id}
                        value={intervention.id}
                      >
                        {getInterventionLabel(intervention)}
                      </option>
                    ))}
                  </select>

                  {editingIrrigation && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      L’intervention ne peut pas être modifiée après création.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date planifiée
                  </label>
                  <input
                    type="date"
                    value={form.scheduledDate ?? ''}
                    onChange={(event) =>
                      updateForm('scheduledDate', event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date de réalisation
                  </label>
                  <input
                    type="date"
                    value={form.completedDate ?? ''}
                    onChange={(event) =>
                      updateForm('completedDate', event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.durationMinutes ?? ''}
                    onChange={(event) =>
                      updateForm(
                        'durationMinutes',
                        event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      )
                    }
                    placeholder="Ex. 90"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Volume d’eau (litres)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.waterVolumeLiters ?? ''}
                    onChange={(event) =>
                      updateForm('waterVolumeLiters', event.target.value)
                    }
                    placeholder="Ex. 2500"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Statut
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        'status',
                        event.target.value as IrrigationStatus,
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {Object.entries(STATUS_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </label>
                  <textarea
                    rows={4}
                    value={form.notes ?? ''}
                    onChange={(event) =>
                      updateForm('notes', event.target.value)
                    }
                    placeholder="Observations ou informations complémentaires..."
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}
                  {editingIrrigation ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
