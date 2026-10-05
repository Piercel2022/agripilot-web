import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  AlertCircle,
  Beaker,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  FlaskConical,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  SprayCan,
  Trash2,
  X,
} from 'lucide-react'

import {
  createPhytosanitaryTreatment,
  deletePhytosanitaryTreatment,
  getPhytosanitaryTreatments,
  updatePhytosanitaryTreatment,
} from '../../lib/api/phytosanitary'
import { getInterventions } from '../../lib/api/interventions'
import type {
  ApplicationMethod,
  CreatePhytosanitaryPayload,
  PhytosanitaryStatus,
  PhytosanitaryTreatment,
  TreatmentType,
  TreatmentUnit,
  UpdatePhytosanitaryPayload,
} from '../../types/phytosanitary'
import type { Intervention } from '../../types/intervention'

const TREATMENT_TYPE_LABELS: Record<TreatmentType, string> = {
  fungicide: 'Fongicide',
  herbicide: 'Herbicide',
  insecticide: 'Insecticide',
  acaricide: 'Acaricide',
  molluscicide: 'Molluscicide',
  biocontrol: 'Biocontrôle',
  other: 'Autre',
}

const UNIT_LABELS: Record<TreatmentUnit, string> = {
  liter: 'L',
  kg: 'kg',
  liter_per_hectare: 'L/ha',
  kg_per_hectare: 'kg/ha',
  other: 'Autre',
}

const METHOD_LABELS: Record<ApplicationMethod, string> = {
  foliar: 'Foliar',
  soil: 'Sol',
  seed_treatment: 'Traitement semences',
  localized: 'Localisée',
  other: 'Autre',
}

const STATUS_LABELS: Record<PhytosanitaryStatus, string> = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const STATUS_STYLES: Record<PhytosanitaryStatus, string> = {
  planned: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

const INITIAL_FORM: CreatePhytosanitaryPayload = {
  name: '',
  product: '',
  activeIngredient: '',
  treatmentType: 'fungicide',
  scheduledDate: '',
  completedDate: '',
  dose: '',
  unit: 'liter_per_hectare',
  target: '',
  applicationMethod: 'foliar',
  status: 'planned',
  notes: '',
  interventionId: '',
}

const formatDate = (value?: string) => {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR').format(new Date(value))
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

function Field({
  label,
  children,
  required = false,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
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

export default function PhytosanitaryPage() {
  const [treatments, setTreatments] = useState<PhytosanitaryTreatment[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    PhytosanitaryStatus | 'all'
  >('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTreatment, setEditingTreatment] =
    useState<PhytosanitaryTreatment | null>(null)
  const [form, setForm] =
    useState<CreatePhytosanitaryPayload>(INITIAL_FORM)

    useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [treatmentsData, interventionsData] =
          await Promise.all([
            getPhytosanitaryTreatments(),
            getInterventions(),
          ])

        if (cancelled) {
          return
        }

        setTreatments(treatmentsData)
        setInterventions(interventionsData)
      } catch {
        if (!cancelled) {
          setError(
            'Impossible de charger les traitements phytosanitaires.',
          )
        }
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
  const filteredTreatments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return treatments.filter((treatment) => {
      const matchesSearch =
        !normalizedSearch ||
        treatment.name.toLowerCase().includes(normalizedSearch) ||
        treatment.product.toLowerCase().includes(normalizedSearch) ||
        treatment.activeIngredient
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        treatment.target?.toLowerCase().includes(normalizedSearch) ||
        treatment.intervention.name
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesStatus =
        statusFilter === 'all' || treatment.status === statusFilter

      return Boolean(matchesSearch && matchesStatus)
    })
  }, [search, statusFilter, treatments])

  const stats = useMemo(
    () => ({
      total: treatments.length,
      planned: treatments.filter(
        (item) => item.status === 'planned',
      ).length,
      inProgress: treatments.filter(
        (item) => item.status === 'in_progress',
      ).length,
      completed: treatments.filter(
        (item) => item.status === 'completed',
      ).length,
    }),
    [treatments],
  )

  const openCreateModal = () => {
    setEditingTreatment(null)
    setForm({
      ...INITIAL_FORM,
      interventionId: interventions[0]?.id ?? '',
    })
    setError(null)
    setModalOpen(true)
  }

  const openEditModal = (treatment: PhytosanitaryTreatment) => {
    setEditingTreatment(treatment)
    setForm({
      name: treatment.name,
      product: treatment.product,
      activeIngredient: treatment.activeIngredient ?? '',
      treatmentType: treatment.treatmentType,
      scheduledDate: treatment.scheduledDate ?? '',
      completedDate: treatment.completedDate ?? '',
      dose: treatment.dose ?? '',
      unit: treatment.unit ?? 'liter_per_hectare',
      target: treatment.target ?? '',
      applicationMethod: treatment.applicationMethod ?? 'foliar',
      status: treatment.status,
      notes: treatment.notes ?? '',
      interventionId: treatment.intervention.id,
    })
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) {
      return
    }

    setModalOpen(false)
    setEditingTreatment(null)
    setForm(INITIAL_FORM)
  }

  const updateForm = <K extends keyof CreatePhytosanitaryPayload>(
    field: K,
    value: CreatePhytosanitaryPayload[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim() || !form.product.trim()) {
      setError('Le nom et le produit sont obligatoires.')
      return
    }

    if (!form.interventionId) {
      setError('Une intervention est obligatoire.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload: CreatePhytosanitaryPayload = {
        ...form,
        name: form.name.trim(),
        product: form.product.trim(),
        activeIngredient: form.activeIngredient?.trim() || undefined,
        scheduledDate: form.scheduledDate || undefined,
        completedDate: form.completedDate || undefined,
        dose: form.dose || undefined,
        target: form.target?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      }

      if (editingTreatment) {
                const updatePayload: UpdatePhytosanitaryPayload = {
          ...payload,
        }

        const updated = await updatePhytosanitaryTreatment(
          editingTreatment.id,
          updatePayload,
        )

        setTreatments((current) =>
          current.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        )
      } else {
        const created = await createPhytosanitaryTreatment(payload)
        setTreatments((current) => [created, ...current])
      }

      closeModal()
    } catch {
      setError(
        editingTreatment
          ? 'Impossible de modifier le traitement.'
          : 'Impossible de créer le traitement.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (
    treatment: PhytosanitaryTreatment,
  ) => {
    const confirmed = window.confirm(
      `Supprimer le traitement « ${treatment.name} » ?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setError(null)
      await deletePhytosanitaryTreatment(treatment.id)
      setTreatments((current) =>
        current.filter((item) => item.id !== treatment.id),
      )
    } catch {
      setError('Impossible de supprimer le traitement.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900">
              Traitements phytosanitaires
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Suivez les traitements, produits, doses et applications
            phytosanitaires de vos parcelles.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={!interventions.length}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus size={18} />
          Nouveau traitement
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {!interventions.length && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucune intervention disponible. Créez d'abord une
          intervention pour pouvoir enregistrer un traitement
          phytosanitaire.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <FlaskConical size={20} />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {stats.total}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            traitements enregistrés
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <CalendarDays size={20} />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-blue-500">
              Planifiées
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {stats.planned}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            à réaliser
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Clock3 size={20} />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-amber-500">
              En cours
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {stats.inProgress}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            traitements actifs
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-500">
              Terminées
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {stats.completed}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            traitements réalisés
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un traitement, produit, cible..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | PhytosanitaryStatus
                    | 'all',
                )
              }
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="animate-spin" size={18} />
              Chargement des traitements...
            </div>
          </div>
        ) : filteredTreatments.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
              <Beaker size={28} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Aucun traitement trouvé
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              {search || statusFilter !== 'all'
                ? 'Modifiez vos critères de recherche ou de filtrage.'
                : 'Créez votre premier traitement phytosanitaire.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Traitement</th>
                  <th className="px-5 py-3">Intervention</th>
                  <th className="px-5 py-3">Type / cible</th>
                  <th className="px-5 py-3">Dose</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTreatments.map((treatment) => (
                  <tr
                    key={treatment.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-emerald-50 p-2 text-emerald-600">
                          <SprayCan size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {treatment.name}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {treatment.product}
                          </p>
                          {treatment.activeIngredient && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {treatment.activeIngredient}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {treatment.intervention.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {treatment.intervention.campaign.crop.field.name}
                        {' · '}
                        {treatment.intervention.campaign.crop.field.farm.name}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {TREATMENT_TYPE_LABELS[treatment.treatmentType]}
                      </p>
                      {treatment.target && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          Cible : {treatment.target}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {treatment.dose
                          ? `${treatment.dose} ${
                              treatment.unit
                                ? UNIT_LABELS[treatment.unit]
                                : ''
                            }`
                          : '—'}
                      </p>
                      {treatment.applicationMethod && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {
                            METHOD_LABELS[
                              treatment.applicationMethod
                            ]
                          }
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {formatDate(treatment.scheduledDate)}
                      </p>
                      {treatment.completedDate && (
                        <p className="mt-0.5 text-xs text-emerald-600">
                          Réalisée le{' '}
                          {formatDate(treatment.completedDate)}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          STATUS_STYLES[treatment.status]
                        }`}
                      >
                        {STATUS_LABELS[treatment.status]}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(treatment)
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="Modifier"
                        >
                          <Edit3 size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(treatment)
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
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

      <Modal
        open={modalOpen}
        title={
          editingTreatment
            ? 'Modifier le traitement'
            : 'Nouveau traitement phytosanitaire'
        }
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom" required>
              <input
                value={form.name}
                onChange={(event) =>
                  updateForm('name', event.target.value)
                }
                placeholder="Ex. Traitement fongicide blé"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </Field>

            <Field label="Produit" required>
              <input
                value={form.product}
                onChange={(event) =>
                  updateForm('product', event.target.value)
                }
                placeholder="Ex. Prosaro"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </Field>

            <Field label="Matière active">
              <input
                value={form.activeIngredient ?? ''}
                onChange={(event) =>
                  updateForm(
                    'activeIngredient',
                    event.target.value,
                  )
                }
                placeholder="Ex. Prothioconazole"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </Field>

            <Field label="Type de traitement" required>
              <select
                value={form.treatmentType}
                onChange={(event) =>
                  updateForm(
                    'treatmentType',
                    event.target.value as TreatmentType,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {Object.entries(TREATMENT_TYPE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field label="Intervention" required>
              <select
                value={form.interventionId}
                onChange={(event) =>
                  updateForm(
                    'interventionId',
                    event.target.value,
                  )
                }
                disabled={Boolean(editingTreatment)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                required
              >
                <option value="">Sélectionner une intervention</option>
                {interventions.map((intervention) => (
                  <option
                    key={intervention.id}
                    value={intervention.id}
                  >
                    {intervention.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cible">
              <input
                value={form.target ?? ''}
                onChange={(event) =>
                  updateForm('target', event.target.value)
                }
                placeholder="Ex. Septoriose"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </Field>

            <Field label="Dose">
              <input
                value={form.dose ?? ''}
                onChange={(event) =>
                  updateForm('dose', event.target.value)
                }
                inputMode="decimal"
                placeholder="Ex. 0.8"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </Field>

            <Field label="Unité">
              <select
                value={form.unit ?? ''}
                onChange={(event) =>
                  updateForm(
                    'unit',
                    event.target.value
                      ? (event.target.value as TreatmentUnit)
                      : undefined,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Aucune unité</option>
                {Object.entries(UNIT_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field label="Méthode d'application">
              <select
                value={form.applicationMethod ?? ''}
                onChange={(event) =>
                  updateForm(
                    'applicationMethod',
                    event.target.value
                      ? (event.target.value as ApplicationMethod)
                      : undefined,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Aucune méthode</option>
                {Object.entries(METHOD_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field label="Date prévue">
              <input
                type="date"
                value={form.scheduledDate ?? ''}
                onChange={(event) =>
                  updateForm(
                    'scheduledDate',
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </Field>

            <Field label="Date réalisée">
              <input
                type="date"
                value={form.completedDate ?? ''}
                onChange={(event) =>
                  updateForm(
                    'completedDate',
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </Field>

            <Field label="Statut">
              <select
                value={form.status ?? 'planned'}
                onChange={(event) =>
                  updateForm(
                    'status',
                    event.target.value as PhytosanitaryStatus,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {Object.entries(STATUS_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes ?? ''}
              onChange={(event) =>
                updateForm('notes', event.target.value)
              }
              rows={4}
              placeholder="Informations complémentaires..."
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving || !interventions.length}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving && (
                <Loader2 className="animate-spin" size={17} />
              )}
              {editingTreatment ? 'Enregistrer' : 'Créer le traitement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
