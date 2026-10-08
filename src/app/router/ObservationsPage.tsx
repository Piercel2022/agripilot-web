import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Edit3,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'

import {
  createObservation,
  deleteObservation,
  getObservations,
  updateObservation,
} from '../../lib/api/observation'
import { getFields } from '../../lib/api/fields'
import type { Field } from '../../types/field'
import type {
  CreateObservationPayload,
  Observation,
  ObservationSeverity,
  ObservationType,
  UpdateObservationPayload,
} from '../../types/observation'

const TYPE_LABELS: Record<ObservationType, string> = {
  crop: 'Culture',
  soil: 'Sol',
  pest: 'Ravageur',
  disease: 'Maladie',
  weather: 'Météo',
  irrigation: 'Irrigation',
  general: 'Générale',
}

const SEVERITY_LABELS: Record<ObservationSeverity, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
}

const SEVERITY_STYLES: Record<ObservationSeverity, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
}

const INITIAL_FORM: CreateObservationPayload = {
  name: '',
  type: 'general',
  observedAt: '',
  severity: undefined,
  description: '',
  notes: '',
  fieldId: '',
}

function formatDate(value?: string) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function FieldLabel({
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {children}
    </label>
  )
}

export default function ObservationsPage() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] =
    useState<ObservationType | 'all'>('all')
  const [severityFilter, setSeverityFilter] =
    useState<ObservationSeverity | 'all'>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingObservation, setEditingObservation] =
    useState<Observation | null>(null)
  const [observationToDelete, setObservationToDelete] =
    useState<Observation | null>(null)

  const [form, setForm] =
    useState<CreateObservationPayload>(INITIAL_FORM)

  useEffect(() => {
    let isMounted = true

    async function loadInitialData() {
      setIsLoading(true)
      setError(null)

      try {
        const [observationsData, fieldsData] = await Promise.all([
          getObservations(),
          getFields(),
        ])

        if (isMounted) {
          setObservations(observationsData)
          setFields(fieldsData)
        }
      } catch {
        if (isMounted) {
          setError(
            'Impossible de charger les observations. Vérifiez votre connexion et réessayez.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredObservations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return observations.filter((observation) => {
      const matchesSearch =
        !normalizedSearch ||
        observation.name.toLowerCase().includes(normalizedSearch) ||
        observation.field.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        observation.field.farm.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        observation.description
          ?.toLowerCase()
          .includes(normalizedSearch)

      const matchesType =
        typeFilter === 'all' || observation.type === typeFilter

      const matchesSeverity =
        severityFilter === 'all' ||
        observation.severity === severityFilter

      return Boolean(
        matchesSearch && matchesType && matchesSeverity,
      )
    })
  }, [observations, search, typeFilter, severityFilter])

  const stats = useMemo(
    () => ({
      total: observations.length,
      low: observations.filter(
        (item) => item.severity === 'low',
      ).length,
      medium: observations.filter(
        (item) => item.severity === 'medium',
      ).length,
      high: observations.filter(
        (item) => item.severity === 'high',
      ).length,
      critical: observations.filter(
        (item) => item.severity === 'critical',
      ).length,
    }),
    [observations],
  )

  function openCreateModal() {
    setEditingObservation(null)
    setForm({
      ...INITIAL_FORM,
      fieldId: fields.length === 1 ? fields[0].id : '',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  function openEditModal(observation: Observation) {
    setEditingObservation(observation)

    setForm({
      name: observation.name,
      type: observation.type,
      observedAt: observation.observedAt ?? '',
      severity: observation.severity,
      description: observation.description ?? '',
      notes: observation.notes ?? '',
      fieldId: observation.field.id,
    })

    setFormError(null)
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSubmitting) {
      return
    }

    setIsModalOpen(false)
    setEditingObservation(null)
    setForm(INITIAL_FORM)
    setFormError(null)
  }

  function updateForm<K extends keyof CreateObservationPayload>(
    key: K,
    value: CreateObservationPayload[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const name = form.name.trim()

    if (!name) {
      setFormError("Le nom de l'observation est obligatoire.")
      return
    }

    if (!editingObservation && !form.fieldId) {
      setFormError('La parcelle est obligatoire.')
      return
    }

    setIsSubmitting(true)

    try {
      if (editingObservation) {
        const payload: UpdateObservationPayload = {
          name,
          type: form.type,
          observedAt: form.observedAt || undefined,
          severity: form.severity || undefined,
          description: form.description?.trim() || undefined,
          notes: form.notes?.trim() || undefined,
        }

        const updatedObservation = await updateObservation(
          editingObservation.id,
          payload,
        )

        setObservations((current) =>
          current.map((observation) =>
            observation.id === updatedObservation.id
              ? updatedObservation
              : observation,
          ),
        )
      } else {
        const payload: CreateObservationPayload = {
          name,
          type: form.type,
          observedAt: form.observedAt || undefined,
          severity: form.severity || undefined,
          description: form.description?.trim() || undefined,
          notes: form.notes?.trim() || undefined,
          fieldId: form.fieldId,
        }

        const createdObservation =
          await createObservation(payload)

        setObservations((current) => [
          createdObservation,
          ...current,
        ])
      }

      closeModal()
    } catch {
      setFormError(
        editingObservation
          ? "Impossible de modifier l'observation. Réessayez."
          : "Impossible de créer l'observation. Réessayez.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!observationToDelete) {
      return
    }

    try {
      await deleteObservation(observationToDelete.id)

      setObservations((current) =>
        current.filter(
          (observation) =>
            observation.id !== observationToDelete.id,
        ),
      )

      setObservationToDelete(null)
    } catch {
      setError(
        "Impossible de supprimer l'observation. Réessayez.",
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList
              size={24}
              className="text-emerald-600"
            />

            <h1 className="text-2xl font-bold text-slate-900">
              Observations
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Suivez les observations réalisées sur vos parcelles.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={fields.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Nouvelle observation
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {fields.length === 0 && !isLoading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Créez au moins une parcelle avant d'ajouter une
          observation.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <ClipboardList
              size={18}
              className="text-slate-400"
            />
          </div>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>

        {(
          [
            ['low', stats.low],
            ['medium', stats.medium],
            ['high', stats.high],
            ['critical', stats.critical],
          ] as const
        ).map(([severity, count]) => (
          <div
            key={severity}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {SEVERITY_LABELS[severity]}
              </span>

              <ShieldAlert
                size={18}
                className="text-slate-400"
              />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {count}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une observation, parcelle..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as ObservationType | 'all',
                )
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Tous les types</option>

              {Object.entries(TYPE_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <div className="relative">
            <select
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(
                  event.target.value as
                    | ObservationSeverity
                    | 'all',
                )
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Toutes les sévérités</option>

              {Object.entries(SEVERITY_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Chargement des observations...
          </div>
        ) : filteredObservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ClipboardList
              size={40}
              className="text-slate-300"
            />

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Aucune observation
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {observations.length === 0
                ? 'Commencez par créer votre première observation.'
                : 'Aucune observation ne correspond à vos filtres.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Observation
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Parcelle
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sévérité
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredObservations.map((observation) => (
                  <tr
                    key={observation.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {observation.name}
                        </p>

                        {observation.description && (
                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {observation.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {TYPE_LABELS[observation.type]}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {observation.field.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {observation.field.farm.name}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays
                          size={15}
                          className="text-slate-400"
                        />
                        {formatDate(observation.observedAt)}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {observation.severity ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_STYLES[observation.severity]}`}
                        >
                          {SEVERITY_LABELS[observation.severity]}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(observation)
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Modifier ${observation.name}`}
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setObservationToDelete(observation)
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Supprimer ${observation.name}`}
                        >
                          <Trash2 size={16} />
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

      <Modal
        open={isModalOpen}
        title={
          editingObservation
            ? "Modifier l'observation"
            : 'Nouvelle observation'
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <FieldLabel label="Nom" required>
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateForm('name', event.target.value)
                }
                maxLength={150}
                required
                placeholder="Ex. Jaunissement des feuilles"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </FieldLabel>

            <FieldLabel label="Type" required>
              <select
                value={form.type}
                onChange={(event) =>
                  updateForm(
                    'type',
                    event.target.value as ObservationType,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {Object.entries(TYPE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </FieldLabel>

            <FieldLabel label="Parcelle" required>
              <select
                value={form.fieldId}
                onChange={(event) =>
                  updateForm('fieldId', event.target.value)
                }
                disabled={Boolean(editingObservation)}
                required={!editingObservation}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Sélectionner une parcelle</option>

                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name} — {field.farm.name}
                  </option>
                ))}
              </select>

              {editingObservation && (
                <span className="mt-1 block text-xs text-slate-500">
                  La parcelle ne peut pas être modifiée.
                </span>
              )}
            </FieldLabel>

            <FieldLabel label="Date d'observation">
              <input
                type="date"
                value={form.observedAt ?? ''}
                onChange={(event) =>
                  updateForm(
                    'observedAt',
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </FieldLabel>

            <FieldLabel label="Sévérité">
              <select
                value={form.severity ?? ''}
                onChange={(event) =>
                  updateForm(
                    'severity',
                    event.target.value
                      ? (event.target
                          .value as ObservationSeverity)
                      : undefined,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Non définie</option>

                {Object.entries(SEVERITY_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </FieldLabel>
          </div>

          <FieldLabel label="Description">
            <textarea
              value={form.description ?? ''}
              onChange={(event) =>
                updateForm('description', event.target.value)
              }
              rows={4}
              placeholder="Décrivez l'observation..."
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </FieldLabel>

          <FieldLabel label="Notes">
            <textarea
              value={form.notes ?? ''}
              onChange={(event) =>
                updateForm('notes', event.target.value)
              }
              rows={3}
              placeholder="Notes complémentaires..."
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </FieldLabel>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && (
                <Loader2 size={16} className="animate-spin" />
              )}

              {editingObservation
                ? 'Enregistrer'
                : "Créer l'observation"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(observationToDelete)}
        title="Supprimer l'observation"
        onClose={() => {
          if (!isSubmitting) {
            setObservationToDelete(null)
          }
        }}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div className="text-sm text-red-800">
              <p className="font-semibold">
                Cette action est définitive.
              </p>

              <p className="mt-1">
                Voulez-vous supprimer l'observation «{' '}
                {observationToDelete?.name} » ?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setObservationToDelete(null)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={() => void handleDelete()}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
