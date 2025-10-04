/*
          # [Operation Name]
          Ajout des colonnes pour la gestion multi-devises et la TVA

          ## Query Description: [Ce script ajoute les colonnes nécessaires pour stocker les informations de devise et de TVA sur les transactions budgétaires et réelles. Il est conçu pour être sûr et ne supprimera aucune donnée existante. Il mettra également à jour les anciennes transactions avec des valeurs par défaut pour garantir la cohérence.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Ajoute les colonnes `currency`, `original_amount`, `amount_type`, `vat_rate_id`, `ht_amount`, `ttc_amount` aux tables `budget_entries` et `actual_transactions`.
          
          ## Security Implications:
          - RLS Status: Inchangé
          - Policy Changes: Non
          - Auth Requirements: Non
          
          ## Performance Impact:
          - Indexes: Ajout d'une contrainte de clé étrangère qui peut créer un index.
          - Triggers: Non
          - Estimated Impact: Faible. L'opération peut prendre quelques secondes sur de très grandes tables.
          */

-- Ajout des colonnes pour la gestion multi-devises et TVA sur les entrées budgétaires
ALTER TABLE public.budget_entries ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE public.budget_entries ADD COLUMN IF NOT EXISTS original_amount NUMERIC;
ALTER TABLE public.budget_entries ADD COLUMN IF NOT EXISTS amount_type TEXT DEFAULT 'ttc';
ALTER TABLE public.budget_entries ADD COLUMN IF NOT EXISTS vat_rate_id UUID;
ALTER TABLE public.budget_entries ADD COLUMN IF NOT EXISTS ht_amount NUMERIC;
ALTER TABLE public.budget_entries ADD COLUMN IF NOT EXISTS ttc_amount NUMERIC;

-- Ajout de la contrainte de clé étrangère si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'budget_entries_vat_rate_id_fkey'
    ) THEN
        ALTER TABLE public.budget_entries 
        ADD CONSTRAINT budget_entries_vat_rate_id_fkey 
        FOREIGN KEY (vat_rate_id) 
        REFERENCES public.vat_rates(id) 
        ON DELETE SET NULL;
    END IF;
END;
$$;

-- Ajout des colonnes pour la gestion multi-devises et TVA sur les transactions réelles
ALTER TABLE public.actual_transactions ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE public.actual_transactions ADD COLUMN IF NOT EXISTS original_amount NUMERIC;
ALTER TABLE public.actual_transactions ADD COLUMN IF NOT EXISTS amount_type TEXT DEFAULT 'ttc';
ALTER TABLE public.actual_transactions ADD COLUMN IF NOT EXISTS vat_rate_id UUID;
ALTER TABLE public.actual_transactions ADD COLUMN IF NOT EXISTS ht_amount NUMERIC;
ALTER TABLE public.actual_transactions ADD COLUMN IF NOT EXISTS ttc_amount NUMERIC;

-- Ajout de la contrainte de clé étrangère si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'actual_transactions_vat_rate_id_fkey'
    ) THEN
        ALTER TABLE public.actual_transactions 
        ADD CONSTRAINT actual_transactions_vat_rate_id_fkey 
        FOREIGN KEY (vat_rate_id) 
        REFERENCES public.vat_rates(id) 
        ON DELETE SET NULL;
    END IF;
END;
$$;

-- Mise à jour des anciennes écritures pour assurer la cohérence des données
-- Utilise ttc_amount comme référence pour voir si la migration a déjà été partiellement appliquée
UPDATE public.budget_entries SET ttc_amount = amount, amount_type = 'ttc' WHERE ttc_amount IS NULL;
UPDATE public.actual_transactions SET ttc_amount = amount, amount_type = 'ttc' WHERE ttc_amount IS NULL;
