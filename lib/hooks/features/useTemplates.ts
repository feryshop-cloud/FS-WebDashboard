import { useState, useEffect, useTransition } from "react";
import { getTemplates, addTemplate, updateTemplate, deleteTemplate } from "@/app/actions/templates";

export interface TemplateItem {
  id: string;
  name: string;
  type: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddClosing, setIsAddClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");

  const [, startTransition] = useTransition();

  const loadTemplatesData = async () => {
    try {
      setIsLoading(true);
      const data = await getTemplates();
      setTemplates(data as unknown as TemplateItem[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getTemplates()
      .then((data) => {
        if (!active) return;
        setTemplates(data as unknown as TemplateItem[]);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openAdd = () => {
    if (isAddClosing) return;
    setIsAddOpen(true);
  };

  const closeModal = () => {
    if (isAddClosing || isSubmitting) return;
    setIsAddClosing(true);
    setTimeout(() => {
      setIsAddClosing(false);
      setIsAddOpen(false);
    }, 200);
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const formData = new FormData(e.currentTarget);
      await addTemplate(formData);
      await loadTemplatesData();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (tpl: TemplateItem) => {
    setEditingId(tpl.id);
    setEditName(tpl.name);
    setEditType(tpl.type);
    setEditContent(tpl.content);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("type", editType);
      formData.append("content", editContent);

      await updateTemplate(id, formData);
      setEditingId(null);
      await loadTemplatesData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus template ini?")) return;
    try {
      await deleteTemplate(id);
      await loadTemplatesData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase()),
  );

  return {
    data: {
      templates,
      filteredTemplates,
    },
    isLoading,
    isSubmitting,
    uiState: {
      search,
      copiedId,
      isAddOpen,
      isAddClosing,
      editingId,
      editContent,
      editName,
      editType,
    },
    actions: {
      setSearch,
      setCopiedId,
      openAdd,
      closeModal,
      handleAddSubmit,
      handleStartEdit,
      handleSaveEdit,
      handleDelete,
      setEditContent,
      setEditName,
      setEditType,
      setEditingId,
      loadTemplatesData: () => startTransition(() => loadTemplatesData()),
      handleCopy,
    },
  };
}
