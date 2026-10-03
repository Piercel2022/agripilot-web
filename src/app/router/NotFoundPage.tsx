function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-emerald-600">AgriPilot</p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Page introuvable
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          La page demandée n'existe pas ou n'est plus disponible.
        </p>

        <a
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Retour à la connexion
        </a>
      </section>
    </main>
  )
}

export default NotFoundPage
