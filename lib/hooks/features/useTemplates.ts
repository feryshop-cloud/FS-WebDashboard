"use client";

import { useState } from "react";
import useSWR from "swr";
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

  const {
    data: templates = [],
    isLoading,
    mutate,
  } = useSWR<TemplateItem[]>("templates", async () => {
    return (await getTemplates()) as unknown as TemplateItem[];
  });

  const loadTemplatesData = () => {
    mutate();
  };

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
      loadTemplatesData();
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
      loadTemplatesData();
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
      loadTemplatesData();
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
      loadTemplatesData,
      handleCopy,
    },
  };
}
