import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { transferFunds } from "@/actions/accounts";
import { Account } from "@/types/database";

export function useTransferFunds(accounts: Account[], isOpen: boolean, onClose: () => void) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [amount, setAmount] = useState(0);
  const [adminFee, setAdminFee] = useState(0);

  const selectedSource = accounts.find((a) => a.id === sourceId);
  const sourceBalance = selectedSource?.balance || 0;
  const totalDeduction = amount + adminFee;

  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        setSourceId("");
        setDestId("");
        setAmount(0);
        setAdminFee(0);
        setErrorMsg(null);
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!sourceId || !destId) {
      setErrorMsg("Harap pilih rekening asal dan tujuan.");
      return;
    }

    if (sourceId === destId) {
      setErrorMsg("Rekening asal dan tujuan tidak boleh sama.");
      return;
    }

    if (amount <= 0) {
      setErrorMsg("Nominal transfer harus lebih besar dari Rp 0.");
      return;
    }

    if (adminFee < 0) {
      setErrorMsg("Biaya admin tidak boleh kurang dari Rp 0.");
      return;
    }

    if (sourceBalance < totalDeduction) {
      setErrorMsg("Saldo rekening asal tidak mencukupi.");
      return;
    }

    startTransition(async () => {
      const { error } = await transferFunds(sourceId, destId, amount, adminFee);
      if (error) {
        setErrorMsg(error);
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  return {
    uiState: {
      sourceId,
      destId,
      amount,
      adminFee,
      sourceBalance,
      totalDeduction,
      errorMsg,
      selectedSource,
      isPending,
    },
    actions: {
      setSourceId,
      setDestId,
      setAmount,
      setAdminFee,
      handleSubmit,
    },
  };
}
