import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Droplets,
  FlaskConical,
  Leaf,
  LogOut,
  Menu,
  Map,
  Sprout,
  Tractor,
  Wheat,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

const navigation = [
  {
    label: 'Pilotage',
    items: [
      {
        label: 'Tableau de bord',
        to: '/app',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'Exploitation',
    items: [
      {
        label: 'Exploitations',
        to: '/app/farms',
        icon: Tractor,
      },
      {
        label: 'Parcelles',
        to: '/app/fields',
        icon: Map,
      },
      {
        label: 'Cultures',
        to: '/app/crops',
        icon: Sprout,
      },
      {
        label: 'Campagnes',
        to: '/app/campaigns',
        icon: Wheat,
      },
    ],
  },
  {
    label: 'Opérations',
    items: [
      {
        label: 'Interventions',
        to: '/app/interventions',
        icon: ClipboardList,
      },
      {
        label: 'Fertilisation',
        to: '/app/fertilisation',
        icon: FlaskConical,
      },
      {
        label: 'Phytosanitaire',
        to: '/app/phytosanitary',
        icon: Leaf,
      },
      {
        label: 'Irrigation',
        to: '/app/irrigation',
        icon: Droplets,
      },
      {
        label: 'Observations',
        to: '/app/observations',
        icon: Bell,
      },
      {
        label: 'Récoltes',
        to: '/app/harvests',
        icon: Wheat,
      },
      {
        label: 'Opérations terrain',
        to: '/app/field-operations',
        icon: CalendarDays,
      },
    ],
  },
]

function AppLayout() {
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const organizationName = user?.organization.name ?? 'Mon exploitation'
  const userName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : 'Utilisateur'

  const initials =
    user &&
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              A
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">AgriPilot</p>
              <p className="text-xs text-slate-500">Pilotage agricole</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Fermer le menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigation.map((section) => (
            <div key={section.label} className="mb-6 last:mb-0">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>

              <div className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/app'}
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2">
            <p className="truncate text-xs font-medium text-slate-500">
              Organisation
            </p>
            <p className="truncate text-sm font-semibold text-slate-800">
              {organizationName}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              aria-label="Ouvrir le menu"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-medium text-slate-500">
                {organizationName}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  {initials || 'U'}
                </div>

                <div className="hidden min-w-0 sm:block">
                  <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
                    {userName}
                  </p>
                  <p className="text-xs capitalize text-slate-500">
                    {user?.role ?? 'membre'}
                  </p>
                </div>

                <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
