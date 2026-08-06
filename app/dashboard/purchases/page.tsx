"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, ChevronDown, X, Loader2, Download, Trash2 } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { getPurchases, purchaseStock, getGames, deletePurchase } from "@/actions/purchases";
import { getAccounts } from "@/app/actions/accounts";

import { PurchaseWithRelations } from "@/types/database";

type Purchase = PurchaseWithRelations;
type Game = { id: string; name: string };
type Account = { id: string; name: string; is_active: boolean; balance: number };

export default function PurchasesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, LUNAS, PENDING
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Form State
  const [selectedStatus, setSelectedStatus] = useState<"LUNAS" | "PENDING">("LUNAS");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [purchasesRes, gamesRes, accountsData] = await Promise.all([
        getPurchases(),
        getGames(),
        getAccounts(),
      ]);
      setPurchases(purchasesRes.data || []);
      setGames(gamesRes.data || []);
      setAccounts((accountsData as unknown as Account[]) || []);
    } catch (err) {
      console.error("Error loading purchases data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleAddPurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const category = formData.get("category") as string;
    const name = formData.get("name") as string;
    const account_details = formData.get("account_details") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const capital_price = parseFloat(formData.get("capital_price") as string) || 0;
    const post_price = parseFloat(formData.get("post_price") as string) || 0;
    const current_price = parseFloat(formData.get("current_price") as string) || post_price;
    const seller_info = formData.get("seller_info") as string;
    const internal_notes = formData.get("internal_notes") as string;
    const purchase_payment_status = formData.get("purchase_payment_status") as "LUNAS" | "PENDING";
    const payment_account_id = (formData.get("payment_account_id") as string) || null;

    if (!category || !name || !capital_price || !post_price) {
      setError("Kategori game, nama item, harga modal, dan harga post wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    if (purchase_payment_status === "LUNAS" && !payment_account_id) {
      setError("Target Rekening/Sumber Pembayaran wajib dipilih untuk status LUNAS.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await purchaseStock({
        category,
        name,
        account_details,
        username,
        password,
        capital_price,
        post_price,
        current_price,
        seller_info,
        internal_notes,
        purchase_payment_status,
        payment_account_id,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setIsAddOpen(false);
        loadData();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal menyimpan data pembelian."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search Logic
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.seller_info?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || purchase.purchase_payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDeletePurchase = async (id: string, name?: string | null) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data pembelian stok "${name || ""}"?`)) {
      return;
    }
    try {
      const res = await deletePurchase(id);
      if (res.error) {
        alert("Gagal menghapus: " + res.error);
      } else {
        loadData();
      }
    } catch (err: unknown) {
      alert("Terjadi kesalahan: " + getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Pembelian Stok</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Catat setiap pembelian akun dari penjual, harga modal, dan kewajiban pembayaran.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors">
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button
            onClick={() => {
              setError("");
              setIsAddOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Catat Pembelian Baru
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-border-soft bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row">
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="text-faint-foreground h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-border bg-muted text-foreground block w-full rounded-lg border py-2 pr-3 pl-10 placeholder-slate-400 transition-all outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Cari ID pembelian, item, atau supplier..."
          />
        </div>
        <div className="relative flex w-full items-center gap-3 sm:w-auto">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="border-border bg-card text-foreground hover:bg-muted inline-flex w-full min-w-[160px] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto"
          >
            <span className="flex items-center gap-2">
              <Filter className="text-faint-foreground h-4 w-4" />
              <span>
                {statusFilter === "ALL" && "Semua Status"}
                {statusFilter === "LUNAS" && "Lunas"}
                {statusFilter === "PENDING" && "Pending"}
              </span>
            </span>
            <ChevronDown className="text-faint-foreground h-4 w-4" />
          </button>

          {isFilterDropdownOpen && (
            <div className="border-border-soft bg-card absolute top-full right-0 z-10 mt-2 w-48 rounded-xl border py-1 shadow-lg">
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setIsFilterDropdownOpen(false);
                }}
                className="text-foreground hover:bg-muted w-full px-4 py-2 text-left text-sm font-medium"
              >
                Semua Status
              </button>
              <button
                onClick={() => {
                  setStatusFilter("LUNAS");
                  setIsFilterDropdownOpen(false);
                }}
                className="text-foreground hover:bg-muted w-full px-4 py-2 text-left text-sm font-medium"
              >
                Lunas
              </button>
              <button
                onClick={() => {
                  setStatusFilter("PENDING");
                  setIsFilterDropdownOpen(false);
                }}
                className="text-foreground hover:bg-muted w-full px-4 py-2 text-left text-sm font-medium"
              >
                Pending
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border-border-soft bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/80">
              <tr>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Tgl & ID Pembelian
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Item / Akun
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Supplier
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-right text-xs font-semibold tracking-wider uppercase"
                >
                  Harga Modal
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-center text-xs font-semibold tracking-wider uppercase"
                >
                  Metode Pembayaran
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-center text-xs font-semibold tracking-wider uppercase"
                >
                  Status Pembayaran
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-center text-xs font-semibold tracking-wider uppercase"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-border-soft bg-card divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-6 py-8 text-center text-sm">
                    Belum ada data pembelian stok.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => {
                  const isLunas = purchase.purchase_payment_status === "LUNAS";
                  const statusBadgeClass = isLunas
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-orange-50 text-orange-600 border-orange-100";

                  return (
                    <tr key={purchase.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">
                            {purchase.sku || "N/A"}
                          </span>
                          <span className="mt-0.5 text-[10px]">
                            {formatDate(purchase.purchase_date ?? purchase.created_at ?? "")}
                          </span>
                        </div>
                      </td>
                      <td className="text-foreground px-6 py-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-foreground block max-w-[240px] truncate font-semibold">
                            {purchase.name}
                          </span>
                          <span className="text-faint-foreground mt-0.5 text-[10px]">
                            {purchase.category}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-sm font-medium whitespace-nowrap">
                        {purchase.seller_info || "-"}
                      </td>
                      <td className="text-foreground px-6 py-4 text-right text-sm font-bold whitespace-nowrap">
                        {formatRupiah(purchase.capital_price ?? 0)}
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                        {purchase.accounts?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusBadgeClass}`}
                        >
                          {isLunas ? "Lunas" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleDeletePurchase(purchase.id, purchase.name)}
                          title="Hapus Pembelian"
                          className="rounded-md p-1.5 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div className="border-border-soft bg-card flex items-center justify-between border-t px-6 py-4">
          <div className="text-muted-foreground text-sm">
            Menampilkan{" "}
            <span className="text-foreground font-semibold">
              {filteredPurchases.length > 0 ? 1 : 0}
            </span>{" "}
            - <span className="text-foreground font-semibold">{filteredPurchases.length}</span> dari{" "}
            <span className="text-foreground font-semibold">{filteredPurchases.length}</span>{" "}
            pembelian
          </div>
          <div className="flex gap-1">
            <button className="border-border text-faint-foreground cursor-not-allowed rounded-md border px-3 py-1 text-sm">
              Sebelummnya
            </button>
            <button className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1 text-sm font-medium">
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Buat Pembelian Baru Modal (Slide-over Drawer) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="animate-in slide-in-from-right bg-card flex h-full w-full max-w-md flex-col shadow-2xl duration-300">
            <div className="border-border-soft bg-muted flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-lg font-bold">Catat Pembelian Baru</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Isi form transaksi pembelian akun dari penjual.
                </p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="bg-card text-faint-foreground hover:text-muted-foreground rounded-full p-2 shadow-sm transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddPurchase} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {error && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Kategori Game
                  </label>
                  <select
                    name="category"
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Pilih Game --</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.name}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Nama Item / Akun
                  </label>
                  <input
                    name="name"
                    required
                    type="text"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mis. MLBB Mythic Glory 120 Skins"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Login Username/Email
                    </label>
                    <input
                      name="username"
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Username/email"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Login Password
                    </label>
                    <input
                      name="password"
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Password"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Spek / Detail Akun
                  </label>
                  <textarea
                    name="account_details"
                    rows={2}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Masukkan spesifikasi akun (heros, skins, winrate, dll)..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Harga Modal
                    </label>
                    <input
                      name="capital_price"
                      required
                      type="number"
                      min="1"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Harga Post Jual
                    </label>
                    <input
                      name="post_price"
                      required
                      type="number"
                      min="1"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Supplier / Penjual
                    </label>
                    <input
                      name="seller_info"
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Nama seller/supplier"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Status Pembayaran
                    </label>
                    <select
                      name="purchase_payment_status"
                      required
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as "LUNAS" | "PENDING")}
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="LUNAS">Lunas</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>

                {selectedStatus === "LUNAS" && (
                  <div className="animate-in fade-in rounded-xl border border-blue-100 bg-blue-50/50 p-4 duration-200">
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Sumber Rekening / Metode Pembayaran
                    </label>
                    <select
                      name="payment_account_id"
                      required
                      className="border-border bg-card w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Rekening Pembayaran --</option>
                      {accounts
                        .filter((a) => a.is_active)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({formatRupiah(acc.balance)})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Catatan Internal (Opsional)
                  </label>
                  <textarea
                    name="internal_notes"
                    rows={2}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Catatan tambahan untuk internal..."
                  />
                </div>
              </div>

              <div className="border-border-soft bg-card border-t p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Catat Pembelian</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
