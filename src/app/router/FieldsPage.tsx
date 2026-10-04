import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  Edit3,
  FileText,
  Map,
  Plus,
  Sprout,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { createField, deleteField, getFields, updateField } from '../../lib/api/fields'
import { getFarms } from '../../lib/api/farms'
import type { Farm } from '../../types/farm'
import type { CreateFieldPayload, Field, UpdateFieldPayload } from '../../types/field'

interface FieldFormState {
  name: string
  areaHectares: string
  soilType: string
  cropType: string
  notes: string
  farmId: string
}

const initialForm: FieldFormState = {
  name: '',
  areaHectares: '',
  soilType: '',
  cropType: '',
  notes: '',
  farmId: '',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatArea(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<Field | null>(null)
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null)
  const [form, setForm] = useState<FieldFormState>(initialForm)

  useEffect(() => {
    let isMounted = true

    async function loadInitialData() {
      setIsLoading(true)
      setError(null)

      try {
        const [fieldsData, farmsData] = await Promise.all([
          getFields(),
          getFarms(),
        ])

        if (isMounted) {
          setFields(fieldsData)
          setFarms(farmsData)
        }
      } catch {
        if (isMounted) {
          setError(
            'Impossible de charger les parcelles. Vérifiez votre connexion et réessayez.',
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

  function openCreateModal() {
    setEditingField(null)
    setForm({
      ...initialForm,
      farmId: farms.length === 1 ? farms[0].id : '',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  function openEditModal(field: Field) {
    setEditingField(field)
    setForm({
      name: field.name,
      areaHectares: String(field.areaHectares),
      soilType: field.soilType ?? '',
      cropType: field.cropType ?? '',
      notes: field.notes ?? '',
      farmId: field.farm.id,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSubmitting) {
      return
    }

    setIsModalOpen(false)
    setEditingField(null)
    setForm(initialForm)
    setFormError(null)
  }

  function updateForm<K extends keyof FieldFormState>(
    key: K,
    value: FieldFormState[K],
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
    const areaHectares = Number(form.areaHectares)

    if (!name) {
      setFormError('Le nom de la parcelle est obligatoire.')
      return
    }

    if (!form.areaHectares || Number.isNaN(areaHectares) || areaHectares <= 0) {
      setFormError('La surface doit être supérieure à 0 hectare.')
      return
    }

    if (!editingField && !form.farmId) {
      setFormError("L'exploitation est obligatoire.")
      return
    }

    setIsSubmitting(true)

    try {
      if (editingField) {
        const payload: UpdateFieldPayload = {
          name,
          areaHectares,
          soilType: form.soilType.trim() || undefined,
          cropType: form.cropType.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }

        const updatedField = await updateField(editingField.id, payload)

        setFields((current) =>
          current.map((field) =>
            field.id === updatedField.id ? updatedField : field,
          ),
        )
      } else {
        const payload: CreateFieldPayload = {
          name,
          areaHectares,
          soilType: form.soilType.trim() || undefined,
          cropType: form.cropType.trim() || undefined,
          notes: form.notes.trim() || undefined,
          farmId: form.farmId,
        }

        const createdField = await createField(payload)

        setFields((current) => [createdField, ...current])
      }

      closeModal()
    } catch {
      setFormError(
        editingField
          ? 'Impossible de modifier la parcelle. Réessayez.'
          : 'Impossible de créer la parcelle. Réessayez.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!fieldToDelete) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await deleteField(fieldToDelete.id)

      setFields((current) =>
        current.filter((field) => field.id !== fieldToDelete.id),
      )
      setFieldToDelete(null)
    } catch {
      setError('Impossible de supprimer la parcelle. Réessayez.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Map className="h-4 w-4" />
            Exploitation
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Parcelles
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez vos parcelles, leurs surfaces et leurs caractéristiques.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={farms.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus className="h-4 w-4" />
          Nouvelle parcelle
        </button>
      </div>

      {farms.length === 0 && !isLoading && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Aucune exploitation disponible</p>
            <p className="mt-1">
              Créez d&apos;abord une exploitation avant d&apos;ajouter une parcelle.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Une erreur est survenue</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Map className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Parcelles enregistrées</p>
            <p className="text-2xl font-semibold text-slate-950">
              {fields.length}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Map className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">
            Aucune parcelle
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Commencez par ajouter une parcelle à l&apos;une de vos exploitations.
          </p>
          {farms.length > 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Ajouter une parcelle
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <article
              key={field.id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Sprout className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-950">
                      {field.name}
                    </h2>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {field.farm.name}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(field)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                    aria-label={`Modifier ${field.name}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldToDelete(field)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Supprimer ${field.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Surface
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {formatArea(field.areaHectares)}{' '}
                  <span className="text-sm font-medium text-slate-500">ha</span>
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-400">Sol</p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-700">
                    {field.soilType || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Culture</p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-700">
                    {field.cropType || 'Non renseignée'}
                  </p>
                </div>
              </div>

              {field.notes && (
                <div className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="line-clamp-2 text-sm text-slate-500">
                    {field.notes}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                Créée le {formatDate(field.createdAt)}
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {editingField ? 'Modifier la parcelle' : 'Nouvelle parcelle'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Renseignez les informations principales de la parcelle.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="field-name"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nom de la parcelle *
                  </label>
                  <input
                    id="field-name"
                    type="text"
                    value={form.name}
                    onChange={(event) => updateForm('name', event.target.value)}
                    placeholder="Ex. Parcelle Nord"
                    maxLength={150}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-farm"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Exploitation *
                  </label>
                  <div className="relative">
                    <select
                      id="field-farm"
                      value={form.farmId}
                      onChange={(event) =>
                        updateForm('farmId', event.target.value)
                      }
                      disabled={Boolean(editingField)}
                      required
                      className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <option value="">Sélectionner une exploitation</option>
                      {farms.map((farm) => (
                        <option key={farm.id} value={farm.id}>
                          {farm.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="field-area"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Surface (ha) *
                  </label>
                  <input
                    id="field-area"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.areaHectares}
                    onChange={(event) =>
                      updateForm('areaHectares', event.target.value)
                    }
                    placeholder="Ex. 12.50"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-soil"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Type de sol
                  </label>
                  <input
                    id="field-soil"
                    type="text"
                    value={form.soilType}
                    onChange={(event) =>
                      updateForm('soilType', event.target.value)
                    }
                    placeholder="Ex. Limoneux"
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-crop"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Culture actuelle
                  </label>
                  <input
                    id="field-crop"
                    type="text"
                    value={form.cropType}
                    onChange={(event) =>
                      updateForm('cropType', event.target.value)
                    }
                    placeholder="Ex. Blé tendre"
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="field-notes"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Notes
                  </label>
                  <textarea
                    id="field-notes"
                    value={form.notes}
                    onChange={(event) => updateForm('notes', event.target.value)}
                    placeholder="Informations complémentaires..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Enregistrement...'
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingField ? 'Enregistrer' : 'Créer la parcelle'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {fieldToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-950">
              Supprimer la parcelle ?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              La parcelle{' '}
              <span className="font-semibold text-slate-700">
                {fieldToDelete.name}
              </span>{' '}
              sera définitivement supprimée.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setFieldToDelete(null)}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {isSubmitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
