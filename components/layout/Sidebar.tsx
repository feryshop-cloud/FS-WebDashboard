'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ShoppingCart,
  RefreshCw,
  Wallet,
  FileSpreadsheet,
  Mail,
  TrendingUp,
  Activity,
  AlertTriangle,
  FileText,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { logout } from '../../actions/logout'

const SIDEBAR_LOGO_URL = '/img/logo.jpeg'

const navGroups = [
  {
    title: 'Utama',
    items: [
      { label: 'Command Center', icon: LayoutDashboard, href: '/dashboard' },
    ]
  },
  {
    title: 'Manajemen Stok',
    items: [
      { label: 'Daftar Stok', icon: Package, href: '/dashboard/inventory' },
      { label: 'Pembelian Stok', icon: ShoppingBag, href: '/dashboard/purchases' },
    ]
  },
  {
    title: 'Transaksi & Deal',
    items: [
      { label: 'Daftar Deal', icon: ShoppingCart, href: '/dashboard/deals' },
      { label: 'Tukar Tambah', icon: RefreshCw, href: '/dashboard/trade-in' },
    ]
  },
  {
    title: 'Keuangan & Treasury',
    items: [
      { label: 'Kelola Rekening', icon: Wallet, href: '/dashboard/accounts' },
      { label: 'Buku Kas / Ledger', icon: FileSpreadsheet, href: '/dashboard/ledger' },
    ]
  },
  {
    title: 'FerryMail',
    items: [
      { label: 'Inbox', icon: Mail, href: '/dashboard/ferrymail' },
    ]
  },
  {
    title: 'Laporan Keuangan',
    items: [
      { label: 'Laba Rugi', icon: TrendingUp, href: '/dashboard/reports/profit-loss' },
      { label: 'Arus Kas', icon: Activity, href: '/dashboard/reports/cashflow' },
    ]
  },
  {
    title: 'Operasional',
    items: [
      { label: 'Problem Cases', icon: AlertTriangle, href: '/dashboard/problem-cases' },
      { label: 'Template Promosi', icon: FileText, href: '/dashboard/templates' },
    ]
  },
  {
    title: 'Sistem',
    items: [
      { label: 'Pengaturan', icon: Settings, href: '/dashboard/settings' },
      { label: 'Audit Log', icon: Shield, href: '/dashboard/audit-log' },
    ]
  }
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={`
        ${isCollapsed ? 'w-20' : 'w-64'}
        relative flex flex-col bg-white border-r border-slate-200
        transition-all duration-300 ease-in-out shrink-0
      `}
    >
      {/* Header — Brand */}
      <div className={`h-[88px] flex items-center relative ${isCollapsed ? 'justify-center px-3' : 'px-6'}`}>
        <Link
          href="/dashboard"
          aria-label="Ferryshop dashboard"
          className={`flex min-w-0 items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black p-1.5 ring-1 ring-slate-200 shadow-sm">
            <Image
              src={SIDEBAR_LOGO_URL}
              alt="Ferryshop logo"
              width={48}
              height={48}
              priority
              className="h-full w-full object-contain"
            />
          </span>
          <span
            className={`
              font-bold text-slate-900 text-2xl tracking-tight whitespace-nowrap transition-all duration-300
              ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}
            `}
          >
            Ferryshop
          </span>
        </Link>

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            absolute -right-3 top-1/2 -translate-y-1/2 z-10
            h-6 w-6 rounded-full bg-white border border-slate-200 shadow-sm
            flex items-center justify-center p-0
            text-slate-500 hover:text-slate-800
            transition-all duration-200 ease-in-out
          `}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 overflow-x-hidden hide-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {/* Group Title */}
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
            )}
            {/* Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200 ease-in-out
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <item.icon
                      className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                        isActive
                          ? 'text-blue-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span
                      className={`
                        text-sm font-medium whitespace-nowrap
                        transition-all duration-300 ease-in-out
                        ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}
                      `}
                    >
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
        <form action={logout}>
          <button
            type="submit"
            title={isCollapsed ? 'Logout' : undefined}
            className="
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-slate-500 hover:bg-slate-50 hover:text-slate-900
              transition-all duration-200 ease-in-out group
            "
          >
            <LogOut className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-600" strokeWidth={1.5} />
            <span
              className={`
                text-sm font-medium whitespace-nowrap
                transition-all duration-300 ease-in-out
                ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}
              `}
            >
              Keluar
            </span>
          </button>
        </form>
      </div>
    </aside>
  )
}
