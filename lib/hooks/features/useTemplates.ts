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

  // Modal state (used for both Add and Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Social Media",
    content: "",
  });

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
    if (isModalClosing) return;
    setEditingTemplate(null);
    setForm({
      name: "",
      type: "Social Media",
      content: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (tpl: TemplateItem) => {
    if (isModalClosing) return;
    setEditingTemplate(tpl);
    setForm({
      name: tpl.name,
      type: tpl.type || "Social Media",
      content: tpl.content || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isModalClosing || isSubmitting) return;
    setIsModalClosing(true);
    setTimeout(() => {
      setIsModalClosing(false);
      setIsModalOpen(false);
      setEditingTemplate(null);
    }, 200);
  };

  const setFormField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("type", form.type);
      formData.append("content", form.content);

      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
      } else {
        await addTemplate(formData);
      }

      loadTemplatesData();
      closeModal();
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
      isModalOpen,
      isModalClosing,
      isCaptionModalOpen,
      editingTemplate,
      form,
    },
    actions: {
      setSearch,
      setCopiedId,
      openAdd,
      openEdit,
      closeModal,
      openCaptionModal: () => setIsCaptionModalOpen(true),
      closeCaptionModal: () => setIsCaptionModalOpen(false),
      setFormField,
      handleFormSubmit,
      handleDelete,
      loadTemplatesData,
      handleCopy,
    },
  };
}
