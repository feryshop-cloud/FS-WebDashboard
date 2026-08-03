import { Copy, Edit, LayoutTemplate } from "lucide-react";

// Mock Data
const mockTemplates = [
  {
    id: "TPL-001",
    name: "Template Invoice Penjualan",
    type: "Invoice/Struk",
    preview:
      "Feryshop - Invoice #{ID}\nTanggal: {DATE}\nCustomer: {CUST_NAME}\n-----------------------\nItem: {ITEM_NAME}\nHarga: {PRICE}\nStatus: {STATUS}",
    lastUpdated: "10 Jun 2026",
  },
  {
    id: "TPL-002",
    name: "Format Postingan FB (Ready Stock)",
    type: "Social Media",
    preview:
      "🔥 READY STOCK 🔥\nGame: {CATEGORY}\nAkun: {NAME}\n\nSpek Singkat:\n- \n- \n\n💰 Harga: {PRICE}\nRekber ON. Minat PM/WA!",
    lastUpdated: "12 Jun 2026",
  },
  {
    id: "TPL-003",
    name: "Pesan Broadcast WA - Tagihan DP",
    type: "WhatsApp",
    preview:
      "Halo kak {CUST_NAME}, mengingatkan tagihan untuk akun {ITEM_NAME} sebesar {REMAINING_AMOUNT}. Jatuh tempo hari ini ya kak 🙏",
    lastUpdated: "15 Jun 2026",
  },
];

export default function TemplatesPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Template</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Kelola format teks untuk postingan, invoice, dan auto-reply chat.
          </p>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between border-b border-slate-50 bg-slate-50/50 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">{tpl.name}</h2>
                <span className="mt-1 inline-block rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                  {tpl.type}
                </span>
              </div>
              <LayoutTemplate className="h-5 w-5 text-slate-300" />
            </div>

            <div className="flex-1 bg-slate-50/30 p-5">
              <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-600">
                {tpl.preview}
              </pre>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
              <span className="text-[10px] font-medium text-slate-400">
                Updated: {tpl.lastUpdated}
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  className="rounded p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                  title="Edit template"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
