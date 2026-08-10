import { useState, useTransition } from "react";

export interface Email {
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

export function useFerryMail() {
  const [emails, setEmails] = useState<Email[]>(generateMockEmails);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("utama");
  const [, startTransition] = useTransition();

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
    setEmails((prev) =>
      prev.map((email) => (email.id === id ? { ...email, isChecked: !email.isChecked } : email)),
    );
  };

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((email) => (email.id === id ? { ...email, isStarred: !email.isStarred } : email)),
    );
  };

  const allFilteredChecked = filteredEmails.length > 0 && filteredEmails.every((e) => e.isChecked);

  const toggleAllChecks = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((email) => {
        if (filteredEmails.some((f) => f.id === email.id)) {
          return { ...email, isChecked: !allFilteredChecked };
        }
        return email;
      }),
    );
  };

  const reloadInbox = () => {
    setEmails(generateMockEmails());
  };

  return {
    data: {
      emails,
      filteredEmails,
    },
    uiState: {
      selectedEmail,
      searchQuery,
      copied,
      activeTab,
      allFilteredChecked,
    },
    actions: {
      setSelectedEmail,
      setSearchQuery,
      setActiveTab,
      handleCopy,
      toggleCheck,
      toggleStar,
      toggleAllChecks,
      reloadInbox: () => startTransition(() => reloadInbox()),
    },
  };
}
