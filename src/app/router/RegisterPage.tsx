import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'
import { createOrganization } from '../../lib/api/auth'

function RegisterPage() {
  const { isAuthenticated, isLoading, register } = useAuth()
  const navigate = useNavigate()

  const [organizationName, setOrganizationName] = useState('')
  const [organizationSlug, setOrganizationSlug] = useState('')
  const [organizationEmail, setOrganizationEmail] = useState('')
  const [organizationPhone, setOrganizationPhone] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <p className="text-sm text-slate-600">Chargement...</p>
      </main>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (
      !organizationName.trim() ||
      !organizationSlug.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('Veuillez renseigner tous les champs obligatoires.')
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsSubmitting(true)

    try {
      const organization = await createOrganization({
        name: organizationName.trim(),
        slug: organizationSlug.trim(),
        ...(organizationEmail.trim()
          ? { email: organizationEmail.trim() }
          : {}),
        ...(organizationPhone.trim()
          ? { phone: organizationPhone.trim() }
          : {}),
      })

      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        organizationId: organization.id,
      })

      navigate('/app', { replace: true })
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response
      ) {
        const status = error.response.status

        if (status === 409) {
          setError(
            'Cette adresse email ou ce slug d’exploitation est déjà utilisé.',
          )
        } else if (status === 400) {
          setError(
            'Certaines informations sont invalides. Vérifiez les champs du formulaire.',
          )
        } else {
          setError(
            'Impossible de créer votre compte. Vérifiez votre connexion et réessayez.',
          )
        }
      } else {
        setError(
          'Impossible de créer votre compte. Vérifiez votre connexion et réessayez.',
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
            A
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Créer votre espace AgriPilot
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Créez votre exploitation et votre compte administrateur pour
            commencer à piloter votre activité.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <section>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                Votre exploitation
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ces informations permettent de créer votre organisation.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="organizationName"
                  className="block text-sm font-medium text-slate-700"
                >
                  Nom de l’exploitation
                </label>

                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  autoComplete="organization"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  placeholder="Ferme des Trois Vallées"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="organizationSlug"
                  className="block text-sm font-medium text-slate-700"
                >
                  Identifiant
                </label>

                <input
                  id="organizationSlug"
                  name="organizationSlug"
                  type="text"
                  value={organizationSlug}
                  onChange={(event) => setOrganizationSlug(event.target.value)}
                  placeholder="ferme-trois-vallees"
                  disabled={isSubmitting}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  title="Utilisez uniquement des lettres minuscules, chiffres et tirets."
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <p className="mt-1.5 text-xs text-slate-500">
                  Lettres minuscules, chiffres et tirets.
                </p>
              </div>

              <div>
                <label
                  htmlFor="organizationEmail"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email de l’exploitation
                </label>

                <input
                  id="organizationEmail"
                  name="organizationEmail"
                  type="email"
                  autoComplete="organization-email"
                  value={organizationEmail}
                  onChange={(event) =>
                    setOrganizationEmail(event.target.value)
                  }
                  placeholder="contact@ferme.fr"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="organizationPhone"
                  className="block text-sm font-medium text-slate-700"
                >
                  Téléphone
                </label>

                <input
                  id="organizationPhone"
                  name="organizationPhone"
                  type="tel"
                  autoComplete="tel"
                  value={organizationPhone}
                  onChange={(event) => setOrganizationPhone(event.target.value)}
                  placeholder="03 88 00 00 00"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                Votre compte
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ce compte sera utilisé pour accéder à votre espace AgriPilot.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-slate-700"
                >
                  Prénom
                </label>

                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Pierre"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-slate-700"
                >
                  Nom
                </label>

                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Dupont"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Adresse email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="vous@exemple.fr"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Mot de passe
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 caractères"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700"
                >
                  Confirmer le mot de passe
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Répétez votre mot de passe"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Création du compte...' : 'Créer mon espace'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default RegisterPage
