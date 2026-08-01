'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addGameCategory, updateGameCategory, deleteGameCategory } from '@/actions/settings'
import { uploadImage } from '@/actions/upload'
import type { Database } from '@/types/database.types'
import { Loader2, Plus, Check, Gamepad2, Edit2, Trash2 } from 'lucide-react'

type Game = Database['public']['Tables']['games']['Row']

export function GameCategoryManager({ initialGames, errorMsg }: { initialGames: Game[]; errorMsg?: string }) {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>(initialGames)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    if (!editingId) {
      setSlug(newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }

  const handleEditClick = (game: Game) => {
    setEditingId(game.id)
    setName(game.name)
    setSlug(game.slug)
    setExistingImageUrl(game.image_url || '')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError(null)
    setSuccess(false)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setName('')
    setSlug('')
    setExistingImageUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError(null)
    setSuccess(false)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return

    setGames(prev => prev.filter(g => g.id !== id))
    if (editingId === id) handleCancelEdit()

    startTransition(async () => {
      const result = await deleteGameCategory(id)
      if (!result.success) {
        setGames(initialGames)
        alert(`Gagal menghapus: ${result.error}`)
      } else {
        router.refresh()
      }
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      let finalImageUrl = existingImageUrl

      const file = fileInputRef.current?.files?.[0]
      if (file) {
        const formData = new FormData()
        formData.append('file', file)

        const uploadResult = await uploadImage(formData)
        if (!uploadResult.success || !uploadResult.url) {
          setError(uploadResult.error || 'Gagal mengupload gambar.')
          return
        }
        finalImageUrl = uploadResult.url
      }

      let result
      if (editingId) {
        result = await updateGameCategory(editingId, name, slug, finalImageUrl)
      } else {
        result = await addGameCategory(name, slug, finalImageUrl)
      }

      if (result.success) {
        setSuccess(true)
        setEditingId(null)
        setName('')
        setSlug('')
        setExistingImageUrl('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        router.refresh()
      } else {
        setError(result.error || 'An unexpected error occurred.')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 h-full overflow-hidden">
      {/* Left Column - Forms */}
      <div className="lg:col-span-1 flex flex-col h-full min-h-0">
        <div className="bg-white rounded-[10px] border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
            <h3 className="text-sm font-semibold text-slate-800">
              {editingId ? 'Edit Kategori Game' : 'Tambah Kategori Game'}
            </h3>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-rose-600 bg-rose-50 rounded-[10px] ring-1 ring-rose-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-emerald-700 bg-emerald-50 rounded-[10px] ring-1 ring-emerald-200 flex items-center gap-2">
                  <Check className="h-4 w-4" /> Kategori game berhasil disimpan!
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="name">
                  Nama Game
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Apex Legends"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-colors text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="slug">
                  Slug
                </label>
                <input
                  id="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. apex-legends"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-colors text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="imageFile">
                  Gambar (Opsional)
                </label>
                {existingImageUrl && (
                  <div className="mb-2 text-xs text-slate-500 flex items-center gap-2">
                    <img src={existingImageUrl} alt="Current" className="w-8 h-8 rounded object-cover border border-slate-200" />
                    <span className="truncate">Gambar saat ini sudah ada. Upload baru untuk mengganti.</span>
                  </div>
                )}
                <input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-colors text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isPending || !name || !slug}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-[10px] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      {editingId ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
                      <span>{editingId ? 'Simpan Kategori' : 'Tambah Kategori'}</span>
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isPending}
                    className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-[10px] hover:bg-slate-200 transition-all"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column - Data/Lists */}
      <div className="lg:col-span-2 flex flex-col h-full min-h-0">
        <div className="bg-white rounded-[10px] border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
            <Gamepad2 className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-slate-800">Daftar Kategori Game</h3>
            <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-[10px] text-xs font-medium bg-slate-100 text-slate-600">
              {games.length} Total
            </span>
          </div>

          <div className="p-0 flex-1 overflow-auto">
            {errorMsg ? (
              <div className="p-6 text-sm text-rose-600 bg-rose-50/50">
                Failed to load categories: {errorMsg}
              </div>
            ) : games && games.length > 0 ? (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-3 py-2">Image</th>
                    <th scope="col" className="px-3 py-2">Nama Game</th>
                    <th scope="col" className="px-3 py-2">Slug</th>
                    <th scope="col" className="px-3 py-2 text-right">Tanggal Masuk</th>
                    <th scope="col" className="px-3 py-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {games.map((game: Game) => (
                    <tr key={game.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2">
                        {game.image_url ? (
                          <img src={game.image_url} alt={game.name} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400">?</div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {game.name}
                      </td>
                      <td className="px-3 py-2 font-medium text-xs text-slate-400">
                        {game.slug}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-400">
                        {new Date(game.created_at || '').toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEditClick(game)}
                            className="p-1 hover:bg-slate-100 rounded-md transition-colors text-blue-500"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(game.id)}
                            className="p-1 hover:bg-slate-100 rounded-md transition-colors text-red-500"
                            title="Hapus"
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">
                Belum ada kategori game. Tambahkan yang pertama untuk memulai.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

