import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  CirclePlus,
  ClipboardList,
  Clock3,
  Edit3,
  Loader2,
  Map,
  Sprout,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import {
  createCampaign,
  deleteCampaign,
  getCampaigns,
  updateCampaign,
} from '../../lib/api/campaigns'
import { getCrops } from '../../lib/api/crops'
import type {
  Campaign,
  CampaignStatus,
  CreateCampaignPayload,
} from '../../types/campaign'
import type { Crop } from '../../types/crop'

const statusLabels: Record<CampaignStatus, string> = {
  planned: 'Planifiée',
  active: 'Active',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const statusClasses: Record<CampaignStatus, string> = {
  planned: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

const initialForm: CreateCampaignPayload = {
  name: '',
  season: '',
  startDate: '',
  endDate: '',
  status: 'planned',
  notes: '',
  cropId: '',
}

function formatDate(value?: string) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateInput(value?: string) {
  if (!value) {
    return ''
  }

  return value.slice(0, 10)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[]
          }
        }
      }
    ).response

    const message = response?.data?.message

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    if (message) {
      return message
    }
  }

  return fallback
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(
    null,
  )
  const [form, setForm] = useState<CreateCampaignPayload>(initialForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [campaignData, cropData] = await Promise.all([
          getCampaigns(),
          getCrops(),
        ])

        if (!isMounted) {
          return
        }

        setCampaigns(campaignData)
        setCrops(cropData)
      } catch (loadError) {
        if (isMounted) {
          setError(
            getErrorMessage(
              loadError,
              'Impossible de charger les campagnes.',
            ),
          )
        }
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

  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === 'active',
  ).length
  const plannedCampaigns = campaigns.filter(
    (campaign) => campaign.status === 'planned',
  ).length
  const completedCampaigns = campaigns.filter(
    (campaign) => campaign.status === 'completed',
  ).length

  function openCreateModal() {
    setEditingCampaign(null)
    setForm(initialForm)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(campaign: Campaign) {
    setEditingCampaign(campaign)
    setForm({
      name: campaign.name,
      season: campaign.season,
      startDate: formatDateInput(campaign.startDate),
      endDate: formatDateInput(campaign.endDate),
      status: campaign.status,
      notes: campaign.notes ?? '',
      cropId: campaign.crop.id,
    })
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) {
      return
    }

    setIsModalOpen(false)
    setEditingCampaign(null)
    setForm(initialForm)
  }

  function updateField(
    field: keyof CreateCampaignPayload,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Le nom de la campagne est obligatoire.')
      return
    }

    if (!form.season.trim()) {
      setError('La saison est obligatoire.')
      return
    }

    if (!form.cropId) {
      setError('La culture est obligatoire.')
      return
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError('La date de fin doit être postérieure ou égale à la date de début.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload: CreateCampaignPayload = {
        name: form.name.trim(),
        season: form.season.trim(),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        status: form.status,
        notes: form.notes?.trim() || undefined,
        cropId: form.cropId,
      }

      if (editingCampaign) {
        const updatedCampaign = await updateCampaign(
          editingCampaign.id,
          payload,
        )

        setCampaigns((current) =>
          current.map((campaign) =>
            campaign.id === updatedCampaign.id
              ? updatedCampaign
              : campaign,
          ),
        )
      } else {
        const createdCampaign = await createCampaign(payload)

        setCampaigns((current) => [createdCampaign, ...current])
      }

      closeModal()
    } catch (saveError) {
      setError(
        getErrorMessage(
          saveError,
          'Impossible d’enregistrer la campagne.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(campaign: Campaign) {
    const confirmed = window.confirm(
      `Supprimer la campagne « ${campaign.name} » ?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(campaign.id)
      setError('')
      await deleteCampaign(campaign.id)

      setCampaigns((current) =>
        current.filter((item) => item.id !== campaign.id),
      )
    } catch (deleteError) {
      setError(
        getErrorMessage(
          deleteError,
          'Impossible de supprimer la campagne.',
        ),
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="overflow-hidden rounded-2xl bg-emerald-700 px-6 py-7 text-white shadow-sm sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-emerald-100">
                <ClipboardList className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Suivi des cycles agricoles
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Campagnes
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
                Organisez vos campagnes agricoles et suivez leur progression
                de la planification à la récolte.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={crops.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CirclePlus className="h-4 w-4" />
              Nouvelle campagne
            </button>
          </div>
        </section>

        {error && !isModalOpen && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <ClipboardList className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Total
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {totalCampaigns}
            </p>
            <p className="mt-1 text-sm text-slate-500">Campagnes</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <Sprout className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                En cours
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {activeCampaigns}
            </p>
            <p className="mt-1 text-sm text-slate-500">Actives</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                À venir
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {plannedCampaigns}
            </p>
            <p className="mt-1 text-sm text-slate-500">Planifiées</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Finalisées
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {completedCampaigns}
            </p>
            <p className="mt-1 text-sm text-slate-500">Terminées</p>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement des campagnes…
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">
              Aucune campagne
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Créez votre première campagne pour commencer à suivre vos
              cycles agricoles.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              disabled={crops.length === 0}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CirclePlus className="h-4 w-4" />
              Créer une campagne
            </button>
            {crops.length === 0 && (
              <p className="mt-3 text-xs text-slate-400">
                Créez d’abord une culture dans le module Cultures.
              </p>
            )}
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-slate-900">
                        {campaign.name}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[campaign.status]}`}
                      >
                        {statusLabels[campaign.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Saison {campaign.season}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(campaign)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={`Modifier ${campaign.name}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(campaign)}
                      disabled={deletingId === campaign.id}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Supprimer ${campaign.name}`}
                    >
                      {deletingId === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      <Sprout className="h-4 w-4" />
                      Culture
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {campaign.crop.name}
                    </p>
                    {campaign.crop.variety && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {campaign.crop.variety}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      <Map className="h-4 w-4" />
                      Parcelle
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {campaign.crop.field.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {campaign.crop.field.farm.name}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span>
                      {formatDate(campaign.startDate)}
                      {' → '}
                      {formatDate(campaign.endDate)}
                    </span>
                  </div>
                </div>

                {campaign.notes && (
                  <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500">
                    {campaign.notes}
                  </p>
                )}
              </article>
            ))}
          </section>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingCampaign
                    ? 'Modifier la campagne'
                    : 'Nouvelle campagne'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingCampaign
                    ? 'Mettez à jour les informations de la campagne.'
                    : 'Renseignez les informations de votre nouvelle campagne.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nom de la campagne *
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateField('name', event.target.value)
                    }
                    placeholder="Campagne Blé 2026"
                    maxLength={150}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Culture *
                  </span>
                  <select
                    value={form.cropId}
                    onChange={(event) =>
                      updateField('cropId', event.target.value)
                    }
                    disabled={Boolean(editingCampaign)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">Sélectionner une culture</option>
                    {crops.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name}
                        {crop.variety ? ` — ${crop.variety}` : ''} ·{' '}
                        {crop.field.name} · {crop.field.farm.name}
                      </option>
                    ))}
                  </select>
                  {editingCampaign && (
                    <span className="mt-1.5 block text-xs text-slate-400">
                      La culture ne peut pas être modifiée après création.
                    </span>
                  )}
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Saison *
                  </span>
                  <input
                    type="text"
                    value={form.season}
                    onChange={(event) =>
                      updateField('season', event.target.value)
                    }
                    placeholder="2026"
                    maxLength={50}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Statut
                  </span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField('status', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {Object.entries(statusLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date de début
                  </span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      updateField('startDate', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date de fin
                  </span>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    onChange={(event) =>
                      updateField('endDate', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </span>
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateField('notes', event.target.value)
                    }
                    rows={4}
                    placeholder="Informations complémentaires…"
                    className="w-full resize-none rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingCampaign
                    ? 'Enregistrer les modifications'
                    : 'Créer la campagne'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
