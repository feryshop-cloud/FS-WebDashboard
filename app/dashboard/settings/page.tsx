import React from 'react'
import { Users, Gamepad2, Shield } from 'lucide-react'
import { getGames } from '@/actions/settings'
import { GameCategoryManager } from '@/components/features/GameCategoryManager'

export default async function SettingsPage() {
  const { data: games, error: gamesError } = await getGames()

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-sm text-slate-500 mt-0.5">Konfigurasi user, role, dan data master sistem Feryshop.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sidebar Nav */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          <button className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors text-sm text-left">
            <Users className="h-5 w-5" /> Manajemen User
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors text-sm text-left">
            <Shield className="h-5 w-5" /> Hak Akses / Role
          </button>
          <button className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-semibold border border-blue-100 transition-colors text-sm text-left">
            <Gamepad2 className="h-5 w-5" /> Kategori Game
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 flex flex-col gap-6">

          {/* USER MANAGEMENT SECTION */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Daftar Pengguna (Admin)</h2>
              <button className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <Users className="h-3 w-3" /> Tambah Admin
              </button>
            </div>
            <div className="p-0">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama & Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">Farhan Maulana</span>
                        <span className="text-xs text-slate-500">farhan@feryshop.com</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">Owner</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Aktif</span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">Edit</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">Budi Santoso</span>
                        <span className="text-xs text-slate-500">budi@feryshop.com</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">Admin CS</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Aktif</span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">Edit</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">Siti Rahma</span>
                        <span className="text-xs text-slate-500">siti@feryshop.com</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">Admin Keuangan</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Aktif</span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">Edit</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">Deni Setiawan</span>
                        <span className="text-xs text-slate-500">deni@feryshop.com</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">Admin Stok</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Nonaktif</span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs">Edit</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GAME CATEGORIES SECTION */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden mt-2">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Master Kategori Game</h2>
            </div>
            <div className="p-6">
              <GameCategoryManager
                initialGames={games || []}
                errorMsg={gamesError ? `Gagal memuat kategori: ${gamesError}` : undefined}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}