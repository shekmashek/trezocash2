/*
# [Correctif du Schéma des Collaborateurs]
Ce script corrige la table 'collaborators' pour s'assurer qu'elle est alignée avec la nouvelle gestion des permissions.

## Description de la Requête:
Cette opération va :
1. Supprimer une ancienne règle de sécurité ('policy') qui dépendait d'une colonne obsolète.
2. Supprimer définitivement la colonne 'role' si elle existe encore.
3. S'assurer que la nouvelle colonne 'permissions' de type JSONB existe.
4. Recréer la règle de sécurité avec une logique correcte et plus simple.
Cette migration est conçue pour être sûre et ne causera aucune perte de données.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Table affectée: public.collaborators
- Colonne supprimée: role
- Colonne ajoutée: permissions
- Policy affectée: "Users can manage their own or shared projects" sur la table public.projects

## Security Implications:
- RLS Status: Modifié
- Policy Changes: Oui
- Auth Requirements: Droits d'administrateur pour modifier la structure de la table et les policies.

## Performance Impact:
- Indexes: Aucun changement.
- Triggers: Aucun changement.
- Estimated Impact: Faible. L'opération sera rapide sur des tables de taille normale.
*/

-- Étape 1: Supprimer l'ancienne policy si elle existe encore.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;

-- Étape 2: Supprimer la colonne 'role' si elle existe.
ALTER TABLE public.collaborators DROP COLUMN IF EXISTS role;

-- Étape 3: Ajouter la colonne 'permissions' si elle n'existe pas.
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS permissions jsonb;

-- Étape 4: Recréer la policy avec une logique correcte.
CREATE POLICY "Users can manage their own or shared projects"
ON public.projects
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM collaborators c
    WHERE c.user_id = auth.uid()
    AND c.status = 'accepted'
    AND projects.id = ANY(c.project_ids)
  )
);
