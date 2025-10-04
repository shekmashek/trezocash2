/*
      # [Correctif de Sécurité] Politique d'accès aux projets

      ## Description de la Requête:
      Cette opération répare la politique de sécurité (RLS) sur la table des projets. La version précédente contenait une référence à une colonne qui n'existe plus, ce qui empêchait le chargement de vos projets.
      Ce script supprime l'ancienne politique défectueuse et la remplace par une version corrigée et sécurisée.
      L'impact sur les données est nul. Cette correction est essentielle pour restaurer l'accès à vos projets.

      ## Métadonnées:
      - Schéma-Catégorie: "Security"
      - Impact-Level: "Medium"
      - Requires-Backup: false
      - Reversible: true (en restaurant l'ancienne politique, si connue)

      ## Détails de Structure:
      - Affecte: Politique RLS sur la table `public.projects`.
      - N'affecte pas: La structure des tables ou les données.

      ## Implications de Sécurité:
      - RLS Status: Modifié
      - Changements de Politique: Oui
      - Exigences d'Authentification: La politique s'applique à tous les utilisateurs authentifiés.

      ## Impact sur la Performance:
      - Index: Aucun changement.
      - Déclencheurs: Aucun changement.
      - Impact Estimé: Faible. La nouvelle politique utilise des vérifications efficaces.
    */

-- Supprime les anciennes versions possibles de la politique pour éviter les conflits.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can see their own or shared projects." ON public.projects;
DROP POLICY IF EXISTS "Users can see their own or shared projects" ON public.projects;

-- Crée la nouvelle politique corrigée qui permet aux utilisateurs de voir leurs propres projets
-- ou les projets partagés avec eux via la table des collaborateurs.
CREATE POLICY "Users can see their own or shared projects"
ON public.projects FOR SELECT
USING (
  (auth.uid() = user_id)
  OR
  (EXISTS (
    SELECT 1
    FROM public.collaborators
    WHERE
      collaborators.user_id = auth.uid() AND
      collaborators.status = 'accepted' AND
      collaborators.project_ids @> ARRAY[projects.id]
  ))
);
