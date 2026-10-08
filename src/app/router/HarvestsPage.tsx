import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  CirclePlus,
  ClipboardCheck,
  Edit3,
  Loader2,
  Map,
  Scale,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import {
  createHarvest,
  deleteHarvest,
  getHarvests,
  updateHarvest,
} from '../../lib/api/harvest'
import { getCampaigns } from '../../lib/api/campaigns'
import { getCrops } from '../../lib/api/crops'
import type { Campaign } from '../../types/campaign'
import type {
  CreateHarvestPayload,
  Harvest,
} from '../../types/harvest'
import type { Crop } from '../../types/crop'

const initialForm: CreateHarvestPayload = {
  cropId: '',
  campaignId: '',
  harvestDate: '',
  quantity: 0,
  unit: 'kg',
  yield: undefined,
  quality: '',
  notes: '',
}

function formatDate(value?: string) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`))
}

function formatNumber(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') {
    return '—'
  }

  const number = Number(value)

  if (Number.isNaN(number)) {
    return '—'
  }

  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  }).format(number)
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

function getInitialForm(crops: Crop[]): CreateHarvestPayload {
  return {
    ...initialForm,
    cropId: crops[0]?.id ?? '',
  }
}

export default function HarvestsPage() {
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(
    null,
  )
  const [form, setForm] =
    useState<CreateHarvestPayload>(initialForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [harvestData, cropData, campaignData] =
          await Promise.all([
            getHarvests(),
            getCrops(),
            getCampaigns(),
          ])

        if (!isMounted) {
          return
        }

        setHarvests(harvestData)
        setCrops(cropData)
        setCampaigns(campaignData)
      } catch (loadError) {
        if (isMounted) {
          setError(
            getErrorMessage(
              loadError,
              'Impossible de charger les récoltes.',
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

  const totalHarvests = harvests.length

  const totalQuantity = useMemo(
    () =>
      harvests.reduce(
        (total, harvest) => total + Number(harvest.quantity),
        0,
      ),
    [harvests],
  )

  const averageYield = useMemo(() => {
    const values = harvests
      .map((harvest) => Number(harvest.yield))
      .filter((value) => Number.isFinite(value))

    if (values.length === 0) {
      return null
    }

    return (
      values.reduce((total, value) => total + value, 0) /
      values.length
    )
  }, [harvests])

  const qualityCount = useMemo(
    () =>
      harvests.filter(
        (harvest) => Boolean(harvest.quality?.trim()),
      ).length,
    [harvests],
  )

  const availableCampaigns = useMemo(
    () =>
      campaigns.filter(
        (campaign) => campaign.crop.id === form.cropId,
      ),
    [campaigns, form.cropId],
  )

  function openCreateModal() {
    const initial = getInitialForm(crops)

    setEditingHarvest(null)
    setForm(initial)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(harvest: Harvest) {
    setEditingHarvest(harvest)
    setForm({
      cropId: harvest.crop.id,
      campaignId: harvest.campaign.id,
      harvestDate: harvest.harvestDate?.slice(0, 10) ?? '',
      quantity: Number(harvest.quantity),
      unit: harvest.unit,
      yield:
        harvest.yield === undefined
          ? undefined
          : Number(harvest.yield),
      quality: harvest.quality ?? '',
      notes: harvest.notes ?? '',
    })
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) {
      return
    }

    setIsModalOpen(false)
    setEditingHarvest(null)
    setForm(initialForm)
  }

  function updateField(
    field: keyof CreateHarvestPayload,
    value: string | number | undefined,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleCropChange(cropId: string) {
    setForm((current) => {
      const campaignStillMatches = campaigns.some(
        (campaign) =>
          campaign.id === current.campaignId &&
          campaign.crop.id === cropId,
      )

      return {
        ...current,
        cropId,
        campaignId: campaignStillMatches
          ? current.campaignId
          : '',
      }
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.cropId) {
      setError('La culture est obligatoire.')
      return
    }

    if (!form.campaignId) {
      setError('La campagne est obligatoire.')
      return
    }

    const selectedCampaign = campaigns.find(
      (campaign) => campaign.id === form.campaignId,
    )

    if (
      !selectedCampaign ||
      selectedCampaign.crop.id !== form.cropId
    ) {
      setError(
        'La campagne sélectionnée ne correspond pas à la culture.',
      )
      return
    }

    if (!form.harvestDate) {
      setError('La date de récolte est obligatoire.')
      return
    }

    if (!form.unit.trim()) {
      setError("L'unité est obligatoire.")
      return
    }

    if (!Number.isFinite(Number(form.quantity))) {
      setError('La quantité doit être un nombre valide.')
      return
    }

    if (Number(form.quantity) < 0) {
      setError('La quantité ne peut pas être négative.')
      return
    }

    if (
      form.yield !== undefined &&
      form.yield !== null &&
      (!Number.isFinite(Number(form.yield)) ||
        Number(form.yield) < 0)
    ) {
      setError('Le rendement doit être un nombre positif ou nul.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload: CreateHarvestPayload = {
        cropId: form.cropId,
        campaignId: form.campaignId,
        harvestDate: form.harvestDate,
        quantity: Number(form.quantity),
        unit: form.unit.trim(),
        yield:
          form.yield === undefined || form.yield === null
            ? undefined
            : Number(form.yield),
        quality: form.quality?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      }

      if (editingHarvest) {
        const updatedHarvest = await updateHarvest(
          editingHarvest.id,
          payload,
        )

        setHarvests((current) =>
          current.map((harvest) =>
            harvest.id === updatedHarvest.id
              ? updatedHarvest
              : harvest,
          ),
        )
      } else {
        const createdHarvest = await createHarvest(payload)

        setHarvests((current) => [createdHarvest, ...current])
      }

      closeModal()
    } catch (saveError) {
      setError(
        getErrorMessage(
          saveError,
          'Impossible d’enregistrer la récolte.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(harvest: Harvest) {
    const confirmed = window.confirm(
      `Supprimer la récolte du ${formatDate(harvest.harvestDate)} pour « ${harvest.crop.name} » ?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(harvest.id)
      setError('')

      await deleteHarvest(harvest.id)

      setHarvests((current) =>
        current.filter((item) => item.id !== harvest.id),
      )
    } catch (deleteError) {
      setError(
        getErrorMessage(
          deleteError,
          'Impossible de supprimer la récolte.',
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
                <ClipboardCheck className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Suivi de la production agricole
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Récoltes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
                Enregistrez les récoltes, les quantités produites,
                les rendements et la qualité obtenue.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={
                crops.length === 0 || campaigns.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CirclePlus className="h-4 w-4" />
              Nouvelle récolte
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
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Total
              </span>
            </div>

            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {totalHarvests}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Récoltes enregistrées
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <Scale className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Production
              </span>
            </div>

            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {formatNumber(totalQuantity)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Quantité totale · unités mixtes
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Rendement
              </span>
            </div>

            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {averageYield === null
                ? '—'
                : formatNumber(averageYield)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Moyenne des rendements renseignés
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Qualité
              </span>
            </div>

            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {qualityCount}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Récoltes qualifiées
            </p>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement des récoltes…
            </div>
          </div>
        ) : harvests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ClipboardCheck className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900">
              Aucune récolte
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Enregistrez votre première récolte pour suivre la
              production de vos cultures.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={
                crops.length === 0 || campaigns.length === 0
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CirclePlus className="h-4 w-4" />
              Créer une récolte
            </button>

            {(crops.length === 0 || campaigns.length === 0) && (
              <p className="mt-3 text-xs text-slate-400">
                Créez d’abord une culture et une campagne dans les
                modules correspondants.
              </p>
            )}
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Culture</th>
                    <th className="px-5 py-4">Campagne</th>
                    <th className="px-5 py-4">Parcelle</th>
                    <th className="px-5 py-4">Quantité</th>
                    <th className="px-5 py-4">Rendement</th>
                    <th className="px-5 py-4">Qualité</th>
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {harvests.map((harvest) => (
                    <tr
                      key={harvest.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {formatDate(harvest.harvestDate)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {harvest.crop.name}
                        </p>
                        {harvest.crop.variety && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {harvest.crop.variety}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {harvest.campaign.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Saison {harvest.campaign.season}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <Map className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {harvest.crop.field.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {harvest.crop.field.farm.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                        {formatNumber(harvest.quantity)}{' '}
                        {harvest.unit}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {harvest.yield === undefined ||
                        harvest.yield === null ? (
                          '—'
                        ) : (
                          <>
                            {formatNumber(harvest.yield)}
                          </>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {harvest.quality ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {harvest.quality}
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
                            onClick={() => openEditModal(harvest)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label={`Modifier la récolte du ${formatDate(harvest.harvestDate)}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(harvest)}
                            disabled={deletingId === harvest.id}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Supprimer la récolte du ${formatDate(harvest.harvestDate)}`}
                          >
                            {deletingId === harvest.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingHarvest
                    ? 'Modifier la récolte'
                    : 'Nouvelle récolte'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingHarvest
                    ? 'Mettez à jour les informations de la récolte.'
                    : 'Renseignez les informations de votre nouvelle récolte.'}
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
                    Culture *
                  </span>

                  <select
                    value={form.cropId}
                    onChange={(event) =>
                      handleCropChange(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">
                      Sélectionner une culture
                    </option>

                    {crops.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name}
                        {crop.variety
                          ? ` — ${crop.variety}`
                          : ''}{' '}
                        · {crop.field.name} · {crop.field.farm.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Campagne *
                  </span>

                  <select
                    value={form.campaignId}
                    onChange={(event) =>
                      updateField(
                        'campaignId',
                        event.target.value,
                      )
                    }
                    disabled={!form.cropId}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">
                      {form.cropId
                        ? 'Sélectionner une campagne'
                        : 'Sélectionnez d’abord une culture'}
                    </option>

                    {availableCampaigns.map((campaign) => (
                      <option
                        key={campaign.id}
                        value={campaign.id}
                      >
                        {campaign.name} · {campaign.season}
                      </option>
                    ))}
                  </select>

                  {form.cropId &&
                    availableCampaigns.length === 0 && (
                      <span className="mt-1.5 block text-xs text-amber-600">
                        Aucune campagne n’est associée à cette
                        culture.
                      </span>
                    )}
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date de récolte *
                  </span>

                  <input
                    type="date"
                    value={form.harvestDate}
                    onChange={(event) =>
                      updateField(
                        'harvestDate',
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Unité *
                  </span>

                  <input
                    type="text"
                    value={form.unit}
                    onChange={(event) =>
                      updateField('unit', event.target.value)
                    }
                    placeholder="kg"
                    maxLength={20}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Quantité *
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={(event) =>
                      updateField(
                        'quantity',
                        event.target.value,
                      )
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Rendement
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.yield ?? ''}
                    onChange={(event) =>
                      updateField(
                        'yield',
                        event.target.value === ''
                          ? undefined
                          : event.target.value,
                      )
                    }
                    placeholder="Ex. 72.5"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Qualité
                  </span>

                  <input
                    type="text"
                    value={form.quality ?? ''}
                    onChange={(event) =>
                      updateField(
                        'quality',
                        event.target.value,
                      )
                    }
                    placeholder="Ex. Premium, standard…"
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </span>

                  <textarea
                    value={form.notes ?? ''}
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

                  {editingHarvest
                    ? 'Enregistrer les modifications'
                    : 'Créer la récolte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
