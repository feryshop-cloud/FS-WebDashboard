-- Migration: Create promotional_templates table

CREATE TABLE IF NOT EXISTS public.promotional_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Social Media',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.promotional_templates ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated admins
CREATE POLICY "Admins can view promotional templates"
    ON public.promotional_templates
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert promotional templates"
    ON public.promotional_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can update promotional templates"
    ON public.promotional_templates
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins can delete promotional templates"
    ON public.promotional_templates
    FOR DELETE
    TO authenticated
    USING (true);
