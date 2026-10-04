import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Leaf,
  MapPinned,
  Pencil,
  Plus,
  Sprout,
  Trash2,
  X,
} from 'lucide-react'
import {
  createCrop,
  deleteCrop,
  getCrops,
  updateCrop,
} from '../../lib/api/crops'
import { getFields } from '../../lib/api/fields'
import type {
  Crop,
  CropStatus,
  CreateCropPayload,
} from '../../types/crop'
import type { Field } from '../../types/field'

const statusLabels: Record<CropStatus, string> = {
  planned: 'Planifiée',
  active: 'En cours',
  harvested: 'Récoltée',
  cancelled: 'Annulée',
}

const statusIcons: Record<CropStatus, typeof Clock3> = {
  planned: Clock3,
  active: Sprout,
  harvested: CheckCircle2,
  cancelled: CircleAlert,
}

function formatDate(value?: string) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function getStatusClasses(status: CropStatus) {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 'harvested':
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 ring-red-200'
    default:
      return 'bg-amber-50 text-amber-700 ring-amber-200'
  }
}

function getInitialForm(): CreateCropPayload {
  return {
    name: '',
    variety: '',
    season: '',
    sowingDate: '',
    harvestDate: '',
    status: 'planned',
    notes: '',
    fieldId: '',
  }
}

export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null)
  const [form, setForm] = useState<CreateCropPayload>(getInitialForm())
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const activeCount = useMemo(
    () => crops.filter((crop) => crop.status === 'active').length,
    [crops],
  )

  const plannedCount = useMemo(
    () => crops.filter((crop) => crop.status === 'planned').length,
    [crops],
  )

  const harvestedCount = useMemo(
    () => crops.filter((crop) => crop.status === 'harvested').length,
    [crops],
  )

  useEffect(() => {
    let isMounted = true

    async function loadInitialData() {
      setIsLoading(true)
      setError('')

      try {
        const [cropsData, fieldsData] = await Promise.all([
          getCrops(),
          getFields(),
        ])

        if (!isMounted) return

        setCrops(cropsData)
        setFields(fieldsData)
      } catch {
        if (!isMounted) return

        setError(
          'Impossible de charger les cultures. Vérifiez que l’API AgriPilot est disponible.',
        )
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

  function openCreateModal() {
    setEditingCrop(null)
    setForm({
      ...getInitialForm(),
      fieldId: fields[0]?.id ?? '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function openEditModal(crop: Crop) {
    setEditingCrop(crop)
    setForm({
      name: crop.name,
      variety: crop.variety ?? '',
      season: crop.season ?? '',
      sowingDate: crop.sowingDate ?? '',
      harvestDate: crop.harvestDate ?? '',
      status: crop.status,
      notes: crop.notes ?? '',
      fieldId: crop.field.id,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return

    setIsModalOpen(false)
    setEditingCrop(null)
    setFormError('')
  }

  function updateForm(
    field: keyof CreateCropPayload,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (!form.name.trim()) {
      setFormError('Le nom de la culture est obligatoire.')
      return
    }

    if (!form.fieldId) {
      setFormError('Sélectionnez une parcelle.')
      return
    }

    if (
      form.sowingDate &&
      form.harvestDate &&
      form.harvestDate < form.sowingDate
    ) {
      setFormError(
        'La date de récolte doit être postérieure à la date de semis.',
      )
      return
    }

    setIsSaving(true)

    const payload: CreateCropPayload = {
      name: form.name.trim(),
      variety: form.variety?.trim() || undefined,
      season: form.season?.trim() || undefined,
      sowingDate: form.sowingDate || undefined,
      harvestDate: form.harvestDate || undefined,
      status: form.status,
      notes: form.notes?.trim() || undefined,
      fieldId: form.fieldId,
    }

    try {
      if (editingCrop) {
        const updatedCrop = await updateCrop(editingCrop.id, {
          name: payload.name,
          variety: payload.variety,
          season: payload.season,
          sowingDate: payload.sowingDate,
          harvestDate: payload.harvestDate,
          status: payload.status,
          notes: payload.notes,
        })

        setCrops((current) =>
          current.map((crop) =>
            crop.id === updatedCrop.id ? updatedCrop : crop,
          ),
        )
      } else {
        const createdCrop = await createCrop(payload)
        setCrops((current) => [createdCrop, ...current])
      }

      closeModal()
    } catch {
      setFormError(
        'Impossible d’enregistrer la culture. Vérifiez les données puis réessayez.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(crop: Crop) {
    const confirmed = window.confirm(
      `Supprimer la culture « ${crop.name} » ? Cette action est irréversible.`,
    )

    if (!confirmed) return

    setDeletingId(crop.id)
    setError('')

    try {
      await deleteCrop(crop.id)
      setCrops((current) =>
        current.filter((item) => item.id !== crop.id),
      )
    } catch {
      setError(
        'Impossible de supprimer cette culture. Réessayez.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Leaf size={22} />
              </div>

              <p className="text-sm font-medium text-emerald-100">
                Exploitation agricole
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Cultures
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
                Suivez les cultures de vos parcelles, leur cycle,
                leur statut et leurs principales dates.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={fields.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Nouvelle culture
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total cultures
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {crops.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              En cours
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Planifiées
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-700">
              {plannedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Récoltées
            </p>
            <p className="mt-2 text-2xl font-semibold text-sky-700">
              {harvestedCount}
            </p>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <CircleAlert className="mt-0.5 shrink-0" size={18} />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
            <p className="mt-4 text-sm text-slate-500">
              Chargement des cultures…
            </p>
          </section>
        ) : crops.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Sprout size={26} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              Aucune culture
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Ajoutez une première culture pour commencer à
              suivre les cycles de production de vos parcelles.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={fields.length === 0}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Ajouter une culture
            </button>

            {fields.length === 0 && (
              <p className="mt-3 text-xs text-amber-600">
                Créez d’abord une parcelle pour pouvoir associer
                une culture.
              </p>
            )}
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {crops.map((crop) => {
              const StatusIcon = statusIcons[crop.status]

              return (
                <article
                  key={crop.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-slate-900">
                          {crop.name}
                        </h2>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(crop.status)}`}
                        >
                          <StatusIcon size={13} />
                          {statusLabels[crop.status]}
                        </span>
                      </div>

                      {crop.variety && (
                        <p className="mt-1 text-sm text-slate-500">
                          Variété : {crop.variety}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(crop)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label={`Modifier ${crop.name}`}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(crop)}
                        disabled={deletingId === crop.id}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Supprimer ${crop.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <MapPinned size={15} />
                        Parcelle
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {crop.field.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {crop.field.farm.name}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <CalendarDays size={15} />
                        Saison
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {crop.season || 'Non renseignée'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Semis
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDate(crop.sowingDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Récolte
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDate(crop.harvestDate)}
                      </p>
                    </div>
                  </div>

                  {crop.notes && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600">
                        {crop.notes}
                      </p>
                    </div>
                  )}
                </article>
              )
            })}
          </section>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crop-modal-title"
        >
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="crop-modal-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  {editingCrop
                    ? 'Modifier la culture'
                    : 'Nouvelle culture'}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {editingCrop
                    ? 'Mettez à jour les informations de la culture.'
                    : 'Associez une culture à une parcelle existante.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="space-y-5 p-5 sm:p-6"
            >
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <CircleAlert
                    className="mt-0.5 shrink-0"
                    size={17}
                  />
                  <p>{formError}</p>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nom de la culture *
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateForm('name', event.target.value)
                    }
                    maxLength={150}
                    placeholder="Ex. Blé tendre"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Parcelle *
                  </span>
                  <div className="relative">
                    <select
                      value={form.fieldId}
                      onChange={(event) =>
                        updateForm('fieldId', event.target.value)
                      }
                      disabled={Boolean(editingCrop)}
                      className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <option value="">Sélectionner une parcelle</option>
                      {fields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.name} — {field.farm.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                  {editingCrop && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      La parcelle ne peut pas être modifiée après
                      création.
                    </p>
                  )}
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Variété
                  </span>
                  <input
                    type="text"
                    value={form.variety ?? ''}
                    onChange={(event) =>
                      updateForm('variety', event.target.value)
                    }
                    maxLength={150}
                    placeholder="Ex. Chevignon"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Saison
                  </span>
                  <input
                    type="text"
                    value={form.season ?? ''}
                    onChange={(event) =>
                      updateForm('season', event.target.value)
                    }
                    maxLength={50}
                    placeholder="Ex. 2026-2027"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date de semis
                  </span>
                  <input
                    type="date"
                    value={form.sowingDate ?? ''}
                    onChange={(event) =>
                      updateForm('sowingDate', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date de récolte
                  </span>
                  <input
                    type="date"
                    value={form.harvestDate ?? ''}
                    onChange={(event) =>
                      updateForm('harvestDate', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Statut
                  </span>
                  <div className="relative">
                    <select
                      value={form.status ?? 'planned'}
                      onChange={(event) =>
                        updateForm(
                          'status',
                          event.target.value as CropStatus,
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="planned">Planifiée</option>
                      <option value="active">En cours</option>
                      <option value="harvested">Récoltée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </span>
                  <textarea
                    value={form.notes ?? ''}
                    onChange={(event) =>
                      updateForm('notes', event.target.value)
                    }
                    rows={4}
                    placeholder="Informations complémentaires…"
                    className="w-full resize-none rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSaving || fields.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {editingCrop
                    ? 'Enregistrer les modifications'
                    : 'Créer la culture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
