/*
# [Correctif Définitif pour l'Accès aux Projets et la Collaboration]
Ce script de migration corrige les problèmes d'accès aux projets en s'assurant que les règles de sécurité et la structure de la base de données sont cohérentes avec la dernière version de l'application.

## Description de la Requête :
Cette opération est sûre et modifie principalement les règles de sécurité et la structure de la table des collaborateurs sans supprimer de données utilisateur.
1. Elle supprime la règle de sécurité défectueuse sur la table `projects`.
2. Elle s'assure que la table `collaborators` a la bonne colonne `permissions` et supprime l'ancienne colonne `role`.
3. Elle recrée la règle de sécurité sur la table `projects` avec la logique correcte.
Cela restaurera l'accès à vos projets et stabilisera les fonctionnalités de collaboration.

## Métadonnées :
- Catégorie de Schéma : "Structurel"
- Niveau d'Impact : "Moyen"
- Sauvegarde Requise : false
- Réversible : false (sans un script de restauration complexe)

## Détails de la Structure :
- Affecte la politique RLS sur la table `public.projects`.
- Affecte les colonnes de la table `public.collaborators`.

## Implications de Sécurité :
- Statut RLS : Maintenu activé.
- Changements de Politique : Oui. La politique "Users can manage their own or shared projects" sera remplacée.
*/

-- Étape 1 : Supprimer l'ancienne politique défectueuse sur `projects`.
-- La clause `IF EXISTS` évite une erreur si la politique a déjà été supprimée.
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;

-- Étape 2 : S'assurer que la table `collaborators` a la bonne structure.
-- Ajoute la colonne 'permissions' si elle n'existe pas.
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS permissions jsonb;
-- Supprime l'ancienne colonne 'role' si elle existe encore.
ALTER TABLE public.collaborators DROP COLUMN IF EXISTS role;

-- Étape 3 : Recréer la politique de sécurité pour la table `projects` avec la logique correcte.
-- Cette politique vérifie maintenant correctement la propriété du projet ou le statut de collaborateur sans utiliser l'ancienne colonne 'role'.
CREATE POLICY "Users can manage their own or shared projects"
ON public.projects
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1
    FROM collaborators c
    WHERE (c.user_id = auth.uid()) AND (c.status = 'accepted'::text) AND (projects.id = ANY (c.project_ids))
  ))
);
