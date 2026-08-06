"use client";

import { useState } from "react";
import {
  Search,
  Copy,
  Check,
  Shield,
  Inbox,
  Square,
  CheckSquare,
  RefreshCw,
  MoreVertical,
  ArrowLeft,
  Star,
} from "lucide-react";

interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  time: string;
  date: string;
  body: string;
  otp: string;
  avatarBg: string;
  avatarText: string;
  isChecked?: boolean;
  isStarred?: boolean;
}

const publishers = [
  {
    sender: "Moonton",
    senderEmail: "no-reply@moonton.com",
    avatarBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    avatarText: "M",
  },
  {
    sender: "Riot Games",
    senderEmail: "noreply@mail.accounts.riotgames.com",
    avatarBg: "bg-gradient-to-br from-red-600 to-rose-700",
    avatarText: "R",
  },
  {
    sender: "VK",
    senderEmail: "support@vk.com",
    avatarBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    avatarText: "V",
  },
  {
    sender: "Steam Support",
    senderEmail: "noreply@steampowered.com",
    avatarBg: "bg-gradient-to-br from-slate-700 to-slate-900",
    avatarText: "S",
  },
  {
    sender: "Hoyoverse",
    senderEmail: "noreply@hoyoverse.com",
    avatarBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    avatarText: "H",
  },
];

const subjects = [
  {
    sub: "New Sign-in from unrecognized device",
    body: "Dear player,\n\nWe detected a login attempt from an unrecognized device. If this was you, please use the following verification code to confirm your sign-in:\n\n[OTP]\n\nThis code is valid for 15 minutes.",
  },
  {
    sub: "Your Login Code",
    body: "Verification.\n\nUse the security code below to complete your login.\n\nSecurity Code: [OTP]\n\nIf you did not request this code, please secure your credentials immediately and contact support.",
  },
  {
    sub: "Confirmation code",
    body: "Confirmation code.\n\nEnter the code [OTP] to confirm your identity.\n\nDo not share this code with anyone. If this wasn't requested by you, change your password.",
  },
  {
    sub: "Account Verification",
    body: "Here is your account verification code: [OTP]. Please do not share it with anyone.",
  },
  {
    sub: "Security Alert: New Login",
    body: "We noticed a new login. Use this OTP to verify your session: [OTP]. Stay safe!",
  },
];

const generateMockEmails = (): Email[] => {
  return Array.from({ length: 100 }).map((_, i) => {
    const pub = publishers[i % publishers.length];
    const subj = subjects[i % subjects.length];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const body = subj.body.replace("[OTP]", otp);

    let timeStr = "";
    let dateStr = "";
    if (i < 3) {
      timeStr = `18:${(10 + i).toString().padStart(2, "0")}`;
      dateStr = "18 Jun 2026";
    } else if (i < 8) {
      timeStr = "Kemarin";
      dateStr = "17 Jun 2026";
    } else {
      const d = new Date(2026, 5, 18 - Math.floor(i / 4));
      const day = d.getDate().toString().padStart(2, "0");
      const month = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ][d.getMonth()];
      timeStr = `${day} ${month}`;
      dateStr = `${day} ${month} 2026`;
    }

    return {
      id: (i + 1).toString(),
      sender: pub.sender,
      senderEmail: pub.senderEmail,
      subject: subj.sub,
      time: timeStr,
      date: dateStr,
      body: body,
      otp: otp,
      avatarBg: pub.avatarBg,
      avatarText: pub.avatarText,
      isChecked: false,
      isStarred: Math.random() > 0.8,
    };
  });
};

export default function FerryMailPage() {
  const [emails, setEmails] = useState<Email[]>(generateMockEmails);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("utama");

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "favorit") {
      return email.isStarred;
    }
    return true;
  });

  const handleCopy = () => {
    if (!selectedEmail) return;
    navigator.clipboard.writeText(selectedEmail.otp);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const toggleCheck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEmails(
      emails.map((email) => (email.id === id ? { ...email, isChecked: !email.isChecked } : email)),
    );
  };

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEmails(
      emails.map((email) => (email.id === id ? { ...email, isStarred: !email.isStarred } : email)),
    );
  };

  const allFilteredChecked = filteredEmails.length > 0 && filteredEmails.every((e) => e.isChecked);

  const toggleAllChecks = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(
      emails.map((email) => {
        if (filteredEmails.some((f) => f.id === email.id)) {
          return { ...email, isChecked: !allFilteredChecked };
        }
        return email;
      }),
    );
  };

  return (
    <div className="border-border bg-card -mx-8 -my-8 flex h-[calc(100vh-4rem)] flex-col overflow-hidden border-t font-sans select-none">
      {!selectedEmail ? (
        // INBOX LIST VIEW
        <div className="bg-card flex flex-1 flex-col overflow-hidden">
          {/* Unified Header Bar */}
          <div className="border-border flex min-h-[48px] shrink-0 items-center border-b px-4 pt-2">
            {/* Actions */}
            <div className="text-muted-foreground flex w-[252px] shrink-0 items-center gap-2">
              <button
                onClick={toggleAllChecks}
                className="hover:bg-muted rounded p-1 transition-colors"
              >
                {allFilteredChecked ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <button className="hover:bg-muted rounded p-1 transition-colors">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button className="hover:bg-muted rounded p-1 transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-[-1px] flex items-center gap-1 self-end">
              <button
                onClick={() => setActiveTab("utama")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "utama"
                    ? "border-blue-600 text-blue-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                }`}
              >
                <Inbox className="h-4 w-4" />
                Utama
              </button>
              <button
                onClick={() => setActiveTab("notifikasi")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "notifikasi"
                    ? "border-blue-600 text-blue-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                }`}
              >
                <Shield className="h-4 w-4" />
                Notifikasi
              </button>
              <button
                onClick={() => setActiveTab("favorit")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "favorit"
                    ? "border-blue-600 text-blue-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                }`}
              >
                <Star className="h-4 w-4" />
                Favorit
              </button>
            </div>

            {/* Search */}
            <div className="ml-auto w-64">
              <div className="relative">
                <Search className="text-faint-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Telusuri dalam email"
                  className="bg-muted hover:bg-muted/60 focus:bg-card w-full rounded-md py-1 pr-3 pl-8 font-sans text-sm transition-all duration-200 outline-none focus:border-blue-500 focus:shadow-sm focus:ring-1 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length > 0 ? (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`group border-border-soft flex cursor-pointer items-center border-b px-4 py-1.5 transition-colors ${
                    email.isChecked ? "bg-blue-50/40 hover:bg-blue-50/60" : "bg-card hover:bg-muted"
                  }`}
                >
                  <div className="text-faint-foreground flex w-[52px] shrink-0 items-center gap-2">
                    <button
                      onClick={(e) => toggleCheck(e, email.id)}
                      className="hover:text-muted-foreground p-0.5 transition-colors"
                    >
                      {email.isChecked ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="group-hover:text-faint-foreground h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => toggleStar(e, email.id)}
                      className="hover:text-muted-foreground p-0.5 transition-colors"
                    >
                      {email.isStarred ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <Star className="group-hover:text-faint-foreground h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="w-[200px] max-w-[200px] min-w-[200px] shrink-0 truncate pr-4 text-left">
                    <span
                      className={`text-sm font-bold ${email.isChecked ? "text-blue-900" : "text-foreground"}`}
                    >
                      {email.sender}
                    </span>
                  </div>
                  <div className="flex-1 justify-start truncate text-left">
                    <span
                      className={`text-sm font-medium ${email.isChecked ? "text-blue-900" : "text-foreground"}`}
                    >
                      {email.subject}
                    </span>
                    <span
                      className={`text-sm ${email.isChecked ? "text-blue-700" : "text-muted-foreground"}`}
                    >
                      <span className="mx-1.5">-</span>
                      {email.body.replace(/\n/g, " ").substring(0, 100)}...
                    </span>
                  </div>
                  <div className="w-20 shrink-0 text-right">
                    <span
                      className={`text-xs font-medium ${email.isChecked ? "text-blue-900" : "text-muted-foreground"}`}
                    >
                      {email.time}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-faint-foreground flex flex-col items-center gap-2 p-8 text-center text-sm">
                <Inbox className="text-faint-foreground h-10 w-10" />
                <span>Kotak masuk kosong. Tidak ada email yang ditemukan.</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        // EMAIL DETAIL VIEW
        <div className="bg-card flex flex-1 flex-col overflow-hidden">
          {/* Detail View Action Bar */}
          <div className="border-border text-muted-foreground flex min-h-[48px] shrink-0 items-center gap-3 border-b px-4 py-1">
            <button
              onClick={() => {
                setSelectedEmail(null);
                setCopied(false);
              }}
              className="text-foreground hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>
            <div className="bg-muted mx-1 h-4 w-px"></div>
            <button className="hover:bg-muted rounded p-1 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="hover:bg-muted rounded p-1 transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-card flex-1 overflow-y-auto px-8 py-6">
            <div className="mx-auto flex max-w-3xl flex-col space-y-6">
              {/* Subject */}
              <h1 className="text-foreground flex items-center gap-3 text-lg font-medium">
                {selectedEmail.subject}
                <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                  Kotak Masuk
                </span>
              </h1>

              {/* Sender Details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${selectedEmail.avatarBg}`}
                  >
                    {selectedEmail.avatarText}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground text-sm font-bold">
                        {selectedEmail.sender}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        &lt;{selectedEmail.senderEmail}&gt;
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-[11px]">kepada customer</div>
                  </div>
                </div>
                <div className="text-faint-foreground flex items-center gap-3">
                  <span className="text-xs">
                    {selectedEmail.date}, {selectedEmail.time}
                  </span>
                  <Star className="hover:text-muted-foreground h-4 w-4 cursor-pointer" />
                  <MoreVertical className="hover:text-muted-foreground h-4 w-4 cursor-pointer" />
                </div>
              </div>

              {/* Security Warning Banner */}
              <div className="flex items-start gap-2.5 rounded border border-amber-200/40 bg-amber-50/60 p-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Mode Akses Baca Saja</p>
                  <p className="mt-0.5 font-sans text-xs leading-relaxed text-amber-800/80">
                    FerryMail hanya memiliki akses baca terbatas. Pemulihan, pengaturan,
                    penghapusan, dan pengiriman email dinonaktifkan sepenuhnya untuk melindungi
                    kredensial.
                  </p>
                </div>
              </div>

              {/* OTP Code Massive Highlight Box */}
              <div className="border-border/80 bg-muted flex flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  OTP Code
                </span>

                <div className="bg-card relative flex w-full max-w-xs items-center justify-center rounded-xl border border-blue-100 px-6 py-4 font-mono text-4xl font-bold tracking-widest text-blue-700 shadow-sm">
                  {selectedEmail.otp}
                </div>

                {/* Interactive Copy Button */}
                <button
                  onClick={handleCopy}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 ${
                    copied
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700"
                      : "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>

              {/* Email Content Container */}
              <div className="border-border/80 bg-card rounded-lg border p-6">
                <p className="text-foreground font-sans text-sm leading-relaxed font-normal whitespace-pre-line select-text">
                  {selectedEmail.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
