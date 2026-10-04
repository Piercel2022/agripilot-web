import {
  Building2,
  CalendarDays,
  Edit3,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import {
  createFarm,
  deleteFarm,
  getFarms,
  updateFarm,
} from '../../lib/api/farms'
import type { CreateFarmPayload, Farm } from '../../types/farm'

const emptyForm: CreateFarmPayload = {
  name: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'France',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null)
  const [form, setForm] = useState<CreateFarmPayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingFarmId, setDeletingFarmId] = useState<string | null>(null)


  useEffect(() => {
  let isMounted = true

  async function loadInitialFarms() {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getFarms()

      if (isMounted) {
        setFarms(data)
      }
    } catch {
      if (isMounted) {
        setError(
          'Impossible de charger les exploitations. Vérifiez votre connexion et réessayez.',
        )
      }
    } finally {
      if (isMounted) {
        setIsLoading(false)
      }
    }
  }

  void loadInitialFarms()

  return () => {
    isMounted = false
  }
}, [])

  function openCreateForm() {
    setEditingFarm(null)
    setForm(emptyForm)
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(farm: Farm) {
    setEditingFarm(farm)
    setForm({
      name: farm.name,
      address: farm.address ?? '',
      city: farm.city ?? '',
      postalCode: farm.postalCode ?? '',
      country: farm.country ?? 'France',
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSubmitting) {
      return
    }

    setIsFormOpen(false)
    setEditingFarm(null)
    setForm(emptyForm)
    setFormError(null)
  }

  function updateField(
    field: keyof CreateFarmPayload,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!form.name.trim()) {
      setFormError('Le nom de l’exploitation est obligatoire.')
      return
    }

    setIsSubmitting(true)

    const payload: CreateFarmPayload = {
      name: form.name.trim(),
      address: form.address?.trim() || undefined,
      city: form.city?.trim() || undefined,
      postalCode: form.postalCode?.trim() || undefined,
      country: form.country?.trim() || undefined,
    }

    try {
      if (editingFarm) {
        const updatedFarm = await updateFarm(editingFarm.id, payload)

        setFarms((current) =>
          current.map((farm) =>
            farm.id === updatedFarm.id ? updatedFarm : farm,
          ),
        )
      } else {
        const createdFarm = await createFarm(payload)

        setFarms((current) => [createdFarm, ...current])
      }

      closeForm()
    } catch {
      setFormError(
        editingFarm
          ? 'Impossible de modifier cette exploitation.'
          : 'Impossible de créer cette exploitation.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(farm: Farm) {
    const confirmed = window.confirm(
      `Supprimer l’exploitation « ${farm.name} » ? Cette action est irréversible.`,
    )

    if (!confirmed) {
      return
    }

    setDeletingFarmId(farm.id)
    setError(null)

    try {
      await deleteFarm(farm.id)

      setFarms((current) =>
        current.filter((currentFarm) => currentFarm.id !== farm.id),
      )
    } catch {
      setError('Impossible de supprimer cette exploitation.')
    } finally {
      setDeletingFarmId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Exploitation
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Exploitations
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Gérez vos exploitations agricoles et leurs informations
            principales.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle exploitation
        </button>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Building2 className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Exploitations enregistrées
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {isLoading ? '—' : farms.length}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="mt-6">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Chargement des exploitations...
            </p>
          </div>
        ) : farms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900">
              Aucune exploitation
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Commencez par enregistrer votre première exploitation pour
              structurer votre espace AgriPilot.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Ajouter une exploitation
            </button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {farms.map((farm) => (
              <article
                key={farm.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900">
                        {farm.name}
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Exploitation agricole
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(farm)}
                      aria-label={`Modifier ${farm.name}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(farm)}
                      disabled={deletingFarmId === farm.id}
                      aria-label={`Supprimer ${farm.name}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <span>
                      {[farm.address, farm.postalCode, farm.city]
                        .filter(Boolean)
                        .join(', ') || 'Adresse non renseignée'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    Créée le {formatDate(farm.createdAt)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="farm-form-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2
                  id="farm-form-title"
                  className="font-semibold text-slate-900"
                >
                  {editingFarm
                    ? 'Modifier l’exploitation'
                    : 'Nouvelle exploitation'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Renseignez les informations principales.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Fermer"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div>
                <label
                  htmlFor="farm-name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Nom de l’exploitation
                </label>

                <input
                  id="farm-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField('name', event.target.value)
                  }
                  placeholder="Ex. Ferme des Trois Vallées"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="farm-address"
                  className="block text-sm font-medium text-slate-700"
                >
                  Adresse
                </label>

                <input
                  id="farm-address"
                  type="text"
                  value={form.address ?? ''}
                  onChange={(event) =>
                    updateField('address', event.target.value)
                  }
                  placeholder="12 route de la Ferme"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                <div>
                  <label
                    htmlFor="farm-postal-code"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Code postal
                  </label>

                  <input
                    id="farm-postal-code"
                    type="text"
                    value={form.postalCode ?? ''}
                    onChange={(event) =>
                      updateField('postalCode', event.target.value)
                    }
                    placeholder="67000"
                    disabled={isSubmitting}
                    className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="farm-city"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Ville
                  </label>

                  <input
                    id="farm-city"
                    type="text"
                    value={form.city ?? ''}
                    onChange={(event) =>
                      updateField('city', event.target.value)
                    }
                    placeholder="Strasbourg"
                    disabled={isSubmitting}
                    className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="farm-country"
                  className="block text-sm font-medium text-slate-700"
                >
                  Pays
                </label>

                <input
                  id="farm-country"
                  type="text"
                  value={form.country ?? ''}
                  onChange={(event) =>
                    updateField('country', event.target.value)
                  }
                  placeholder="France"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {formError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? 'Enregistrement...'
                    : editingFarm
                      ? 'Enregistrer'
                      : 'Créer l’exploitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FarmsPage
