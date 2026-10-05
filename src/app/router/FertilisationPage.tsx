import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'

import {
  createFertilisation,
  deleteFertilisation,
  getFertilisations,
  updateFertilisation,
} from '../../lib/api/fertilisation'
import { getInterventions } from '../../lib/api/interventions'
import type {
  CreateFertilisationPayload,
  Fertilisation,
  FertilisationApplicationMethod,
  FertilisationStatus,
  FertilisationType,
  FertilisationUnit,
  UpdateFertilisationPayload,
} from '../../types/fertilisation'
import type { Intervention } from '../../types/intervention'

const TYPE_LABELS: Record<FertilisationType, string> = {
  organic: 'Organique',
  mineral: 'Minérale',
  nitrogen: 'Azotée',
  phosphorus: 'Phosphorée',
  potassium: 'Potassique',
  npk: 'NPK',
  other: 'Autre',
}

const UNIT_LABELS: Record<FertilisationUnit, string> = {
  kg: 'kg',
  tonne: 'tonne',
  liter: 'L',
  kg_per_hectare: 'kg/ha',
}

const METHOD_LABELS: Record<FertilisationApplicationMethod, string> = {
  broadcast: 'Épandage',
  localized: 'Localisée',
  foliar: 'Foliare',
  fertigation: 'Fertigation',
  other: 'Autre',
}

const STATUS_LABELS: Record<FertilisationStatus, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const STATUS_STYLES: Record<FertilisationStatus, string> = {
  planned: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

const INITIAL_FORM = {
  name: '',
  product: '',
  type: 'mineral' as FertilisationType,
  scheduledDate: '',
  completedDate: '',
  quantity: '',
  unit: 'kg' as FertilisationUnit,
  applicationMethod: 'broadcast' as FertilisationApplicationMethod,
  status: 'planned' as FertilisationStatus,
  notes: '',
  interventionId: '',
}

function formatDate(value?: string) {
  if (!value) return '—'

  const date = new Date(`${value.slice(0, 10)}T00:00:00`)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
  }).format(date)
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X size={19} />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>

      {children}
    </label>
  )
}

const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'

export default function FertilisationPage() {
  const [fertilisations, setFertilisations] = useState<Fertilisation[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | FertilisationStatus
  >('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFertilisation, setEditingFertilisation] =
    useState<Fertilisation | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [fertilisationsData, interventionsData] = await Promise.all([
          getFertilisations(),
          getInterventions(),
        ])

        if (!isMounted) return

        setFertilisations(fertilisationsData)
        setInterventions(interventionsData)
      } catch {
        if (!isMounted) return
        setError('Impossible de charger les fertilisations.')
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

  const filteredFertilisations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return fertilisations.filter((fertilisation) => {
      const matchesStatus =
        statusFilter === 'all' || fertilisation.status === statusFilter

      if (!matchesStatus) return false
      if (!normalizedSearch) return true

      const searchableText = [
        fertilisation.name,
        fertilisation.product,
        TYPE_LABELS[fertilisation.type],
        fertilisation.intervention.name,
        fertilisation.intervention.campaign.name,
        fertilisation.intervention.campaign.crop.name,
        fertilisation.intervention.campaign.crop.field.name,
        fertilisation.intervention.campaign.crop.field.farm.name,
        fertilisation.notes ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })
  }, [fertilisations, search, statusFilter])

  const stats = useMemo(
    () => ({
      total: fertilisations.length,
      planned: fertilisations.filter(
        (item) => item.status === 'planned',
      ).length,
      inProgress: fertilisations.filter(
        (item) => item.status === 'in_progress',
      ).length,
      completed: fertilisations.filter(
        (item) => item.status === 'completed',
      ).length,
    }),
    [fertilisations],
  )

  function openCreateModal() {
    setEditingFertilisation(null)
    setForm({
      ...INITIAL_FORM,
      interventionId: interventions[0]?.id ?? '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function openEditModal(fertilisation: Fertilisation) {
    setEditingFertilisation(fertilisation)

    setForm({
      name: fertilisation.name,
      product: fertilisation.product,
      type: fertilisation.type,
      scheduledDate: fertilisation.scheduledDate?.slice(0, 10) ?? '',
      completedDate: fertilisation.completedDate?.slice(0, 10) ?? '',
      quantity: fertilisation.quantity ?? '',
      unit: fertilisation.unit ?? 'kg',
      applicationMethod:
        fertilisation.applicationMethod ?? 'broadcast',
      status: fertilisation.status,
      notes: fertilisation.notes ?? '',
      interventionId: fertilisation.intervention.id,
    })

    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return

    setIsModalOpen(false)
    setEditingFertilisation(null)
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
      return 'Le nom de la fertilisation est obligatoire.'
    }

    if (!form.product.trim()) {
      return 'Le produit est obligatoire.'
    }

    if (!form.interventionId) {
      return 'L’intervention est obligatoire.'
    }

    if (form.scheduledDate && form.completedDate) {
      if (form.completedDate < form.scheduledDate) {
        return 'La date de fin ne peut pas être antérieure à la date prévue.'
      }
    }

    if (form.quantity && Number(form.quantity) < 0) {
      return 'La quantité ne peut pas être négative.'
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

      if (editingFertilisation) {
        const payload: UpdateFertilisationPayload = {
          name: form.name.trim(),
          product: form.product.trim(),
          type: form.type,
          scheduledDate: form.scheduledDate || undefined,
          completedDate: form.completedDate || undefined,
          quantity: form.quantity || undefined,
          unit: form.quantity ? form.unit : undefined,
          applicationMethod: form.applicationMethod,
          status: form.status,
          notes: form.notes.trim() || undefined,
        }

        const updated = await updateFertilisation(
          editingFertilisation.id,
          payload,
        )

        setFertilisations((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        )
      } else {
        const payload: CreateFertilisationPayload = {
          name: form.name.trim(),
          product: form.product.trim(),
          type: form.type,
          scheduledDate: form.scheduledDate || undefined,
          completedDate: form.completedDate || undefined,
          quantity: form.quantity || undefined,
          unit: form.quantity ? form.unit : undefined,
          applicationMethod: form.applicationMethod,
          status: form.status,
          notes: form.notes.trim() || undefined,
          interventionId: form.interventionId,
        }

        const created = await createFertilisation(payload)

        setFertilisations((current) => [created, ...current])
      }

      closeModal()
    } catch {
      setFormError(
        editingFertilisation
          ? 'Impossible de modifier la fertilisation.'
          : 'Impossible de créer la fertilisation.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(fertilisation: Fertilisation) {
    const confirmed = window.confirm(
      `Supprimer la fertilisation « ${fertilisation.name} » ?`,
    )

    if (!confirmed) return

    try {
      setDeletingId(fertilisation.id)
      await deleteFertilisation(fertilisation.id)

      setFertilisations((current) =>
        current.filter((item) => item.id !== fertilisation.id),
      )
    } catch {
      setError('Impossible de supprimer cette fertilisation.')
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
            Fertilisation
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Planifiez et suivez les apports d’engrais sur vos parcelles.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={interventions.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={17} />
          Nouvelle fertilisation
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total</span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Search size={17} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Planifiées
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Clock3 size={17} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.planned}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">En cours</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Clock3 size={17} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.inProgress}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Terminées</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 size={17} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {stats.completed}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700"
            aria-label="Fermer"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {interventions.length === 0 && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucune intervention disponible. Créez d’abord une intervention pour
          pouvoir enregistrer une fertilisation.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une fertilisation..."
              className={`${inputClassName} pl-9`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as 'all' | FertilisationStatus,
              )
            }
            className={`${inputClassName} lg:w-48`}
          >
            <option value="all">Tous les statuts</option>
            <option value="planned">Planifiées</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Chargement des fertilisations...
            </div>
          </div>
        ) : filteredFertilisations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Search size={20} />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-slate-900">
              Aucune fertilisation trouvée
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {search || statusFilter !== 'all'
                ? 'Modifiez vos critères de recherche ou de filtrage.'
                : 'Commencez par créer votre première fertilisation.'}
            </p>

            {!search && statusFilter === 'all' && interventions.length > 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus size={16} />
                Créer une fertilisation
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fertilisation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Intervention
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Parcelle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredFertilisations.map((fertilisation) => (
                  <tr
                    key={fertilisation.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">
                        {fertilisation.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {fertilisation.product} ·{' '}
                        {TYPE_LABELS[fertilisation.type]}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-slate-700">
                        {fertilisation.intervention.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {fertilisation.intervention.campaign.name}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-700">
                        {fertilisation.intervention.campaign.crop.field.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {fertilisation.intervention.campaign.crop.field.farm.name}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(
                        fertilisation.completedDate ??
                          fertilisation.scheduledDate,
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {fertilisation.quantity
                        ? `${fertilisation.quantity} ${fertilisation.unit ? UNIT_LABELS[fertilisation.unit] : ''}`
                        : '—'}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[fertilisation.status]}`}
                      >
                        {STATUS_LABELS[fertilisation.status]}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(fertilisation)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Modifier ${fertilisation.name}`}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(fertilisation)}
                          disabled={deletingId === fertilisation.id}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label={`Supprimer ${fertilisation.name}`}
                        >
                          {deletingId === fertilisation.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
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
        <Modal
          title={
            editingFertilisation
              ? 'Modifier la fertilisation'
              : 'Nouvelle fertilisation'
          }
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {formError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <XCircle size={18} className="mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField('name', event.target.value)
                  }
                  placeholder="Ex. Apport azoté printemps"
                  className={inputClassName}
                  disabled={saving}
                />
              </Field>

              <Field label="Produit" required>
                <input
                  type="text"
                  value={form.product}
                  onChange={(event) =>
                    updateField('product', event.target.value)
                  }
                  placeholder="Ex. Urée 46%"
                  className={inputClassName}
                  disabled={saving}
                />
              </Field>

              <Field label="Type" required>
                <select
                  value={form.type}
                  onChange={(event) =>
                    updateField(
                      'type',
                      event.target.value as FertilisationType,
                    )
                  }
                  className={inputClassName}
                  disabled={saving}
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Intervention" required>
                <select
                  value={form.interventionId}
                  onChange={(event) =>
                    updateField('interventionId', event.target.value)
                  }
                  className={inputClassName}
                  disabled={saving}
                >
                  <option value="">Sélectionner une intervention</option>

                  {interventions.map((intervention) => (
                    <option key={intervention.id} value={intervention.id}>
                      {intervention.name} — {intervention.campaign.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date prévue">
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(event) =>
                    updateField('scheduledDate', event.target.value)
                  }
                  className={inputClassName}
                  disabled={saving}
                />
              </Field>

              <Field label="Date réalisée">
                <input
                  type="date"
                  value={form.completedDate}
                  onChange={(event) =>
                    updateField('completedDate', event.target.value)
                  }
                  className={inputClassName}
                  disabled={saving}
                />
              </Field>

              <Field label="Quantité">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity}
                  onChange={(event) =>
                    updateField('quantity', event.target.value)
                  }
                  placeholder="Ex. 150"
                  className={inputClassName}
                  disabled={saving}
                />
              </Field>

              <Field label="Unité">
                <select
                  value={form.unit}
                  onChange={(event) =>
                    updateField(
                      'unit',
                      event.target.value as FertilisationUnit,
                    )
                  }
                  className={inputClassName}
                  disabled={saving || !form.quantity}
                >
                  {Object.entries(UNIT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Méthode d’application">
                <select
                  value={form.applicationMethod}
                  onChange={(event) =>
                    updateField(
                      'applicationMethod',
                      event.target.value as FertilisationApplicationMethod,
                    )
                  }
                  className={inputClassName}
                  disabled={saving}
                >
                  {Object.entries(METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Statut">
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      'status',
                      event.target.value as FertilisationStatus,
                    )
                  }
                  className={inputClassName}
                  disabled={saving}
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
                placeholder="Informations complémentaires..."
                rows={4}
                className={`${inputClassName} resize-none`}
                disabled={saving}
              />
            </Field>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={saving || interventions.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}

                {editingFertilisation
                  ? 'Enregistrer'
                  : 'Créer la fertilisation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
