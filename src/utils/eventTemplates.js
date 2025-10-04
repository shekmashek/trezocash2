import { v4 as uuidv4 } from 'uuid';

export const eventTemplates = [
  {
    id: 'construction-maison',
    name: 'Construction de maison',
    description: 'Modèle de budget prévisionnel pour la construction d\'une maison sur 2 étages.',
    icon: 'Home',
    color: 'green',
    purpose: 'event',
    data: {
      categories: {
        revenue: [
          { id: 'ct-cm-rev-1', name: 'FINANCEMENT DU PROJET', subCategories: [
            { id: 'ct-cm-rev-1-1', name: 'Apport personnel' },
            { id: 'ct-cm-rev-1-2', name: 'Prêt bancaire' },
            { id: 'ct-cm-rev-1-3', name: 'Aides et subventions' },
            { id: 'ct-cm-rev-1-4', name: 'Dons familiaux' },
          ]}
        ],
        expense: [
          { id: 'ct-cm-exp-1', name: 'FRAIS PRÉPARATOIRES & ADMINISTRATIFS', subCategories: [
            { id: 'ct-cm-exp-1-1', name: 'Honoraires géomètre (bornage)' },
            { id: 'ct-cm-exp-1-2', name: 'Étude de sol (Géotechnique)' },
            { id: 'ct-cm-exp-1-3', name: 'Diagnostic immobilier (amiante, plomb, etc.)' },
            { id: 'ct-cm-exp-1-4', name: 'État des risques naturels et technologiques (ERNMT)' },
            { id: 'ct-cm-exp-1-5', name: 'Honoraires architecte' },
            { id: 'ct-cm-exp-1-6', name: 'Honoraires bureau d\'études (structure, thermique)' },
            { id: 'ct-cm-exp-1-7', name: 'Établissement du permis de construire' },
            { id: 'ct-cm-exp-1-8', name: 'Taxe d\'aménagement' },
          ]},
          { id: 'ct-cm-exp-2', name: 'FRAIS DE TERRAIN', subCategories: [
            { id: 'ct-cm-exp-2-1', name: 'Achat du terrain' },
            { id: 'ct-cm-exp-2-2', name: 'Frais de notaire' },
            { id: 'ct-cm-exp-2-3', name: 'Viabilisation (raccordements)' },
            { id: 'ct-cm-exp-2-4', name: 'Clôture provisoire et débroussaillage' },
          ]},
          { id: 'ct-cm-exp-3', name: 'GROS ŒUVRE', subCategories: [
            { id: 'ct-cm-exp-3-1', name: 'Terrassement (déblai/remblai)' },
            { id: 'ct-cm-exp-3-2', name: 'Fondations et dallage' },
            { id: 'ct-cm-exp-3-3', name: 'Drainage et évacuation eaux pluviales' },
            { id: 'ct-cm-exp-3-4', name: 'Structure (murs, planchers)' },
            { id: 'ct-cm-exp-3-5', name: 'Charpente' },
            { id: 'ct-cm-exp-3-6', name: 'Escalier structurel' },
            { id: 'ct-cm-exp-3-7', name: 'Enduit de façade' },
            { id: 'ct-cm-exp-3-8', name: 'Menuiseries extérieures (portes, fenêtres)' },
            { id: 'ct-cm-exp-3-9', name: 'Étanchéité toiture' },
          ]},
          { id: 'ct-cm-exp-4', name: 'SECOND ŒUVRE', subCategories: [
            { id: 'ct-cm-exp-4-1', name: 'Couverture (tuiles, ardoises)' },
            { id: 'ct-cm-exp-4-2', name: 'Zinguerie et gouttières' },
            { id: 'ct-cm-exp-4-3', name: 'Fenêtres de toit' },
            { id: 'ct-cm-exp-4-4', name: 'Isolation (murs, combles, planchers)' },
            { id: 'ct-cm-exp-4-5', name: 'Cloisons et plafonds' },
            { id: 'ct-cm-exp-4-6', name: 'Menuiseries intérieures (portes)' },
            { id: 'ct-cm-exp-4-7', name: 'Escalier fini' },
          ]},
          { id: 'ct-cm-exp-5', name: 'TECHNIQUES & RÉSEAUX', subCategories: [
            { id: 'ct-cm-exp-5-1', name: 'Électricité (tableau, câblage, prises)' },
            { id: 'ct-cm-exp-5-2', name: 'Plomberie (réseaux, évacuations)' },
            { id: 'ct-cm-exp-5-3', name: 'Chauffage et production d\'eau chaude' },
            { id: 'ct-cm-exp-5-4', name: 'Ventilation (VMC)' },
            { id: 'ct-cm-exp-5-5', name: 'Autres (sécurité, domotique)' },
          ]},
          { id: 'ct-cm-exp-6', name: 'FINITIONS', subCategories: [
            { id: 'ct-cm-exp-6-1', name: 'Revêtements muraux (peinture, papier peint)' },
            { id: 'ct-cm-exp-6-2', name: 'Revêtements de sol (carrelage, parquet)' },
            { id: 'ct-cm-exp-6-3', name: 'Cuisine équipée' },
            { id: 'ct-cm-exp-6-4', name: 'Salle(s) de bains/douche' },
            { id: 'ct-cm-exp-6-5', name: 'WC' },
            { id: 'ct-cm-exp-6-6', name: 'Aménagements (placards, dressing)' },
            { id: 'ct-cm-exp-6-7', name: 'Cheminée ou poêle' },
            { id: 'ct-cm-exp-6-8', name: 'Volets et stores' },
          ]},
          { id: 'ct-cm-exp-7', name: 'AMÉNAGEMENTS EXTÉRIEURS', subCategories: [
            { id: 'ct-cm-exp-7-1', name: 'Voirie et accès (allées, terrasse)' },
            { id: 'ct-cm-exp-7-2', name: 'Garage ou abri voiture' },
            { id: 'ct-cm-exp-7-3', name: 'Paysagisme (terre, gazon, plantations)' },
            { id: 'ct-cm-exp-7-4', name: 'Éclairage extérieur et arrosage' },
            { id: 'ct-cm-exp-7-5', name: 'Piscine' },
            { id: 'ct-cm-exp-7-6', name: 'Clôture définitive et portail' },
          ]},
          { id: 'ct-cm-exp-8', name: 'FRAIS DIVERS & IMPRÉVUS', subCategories: [
            { id: 'ct-cm-exp-8-1', name: 'Frais de chantier (sanitaires, déchets)' },
            { id: 'ct-cm-exp-8-2', name: 'Assurances (dommages-ouvrage)' },
            { id: 'ct-cm-exp-8-3', name: 'Contrôles techniques' },
            { id: 'ct-cm-exp-8-4', name: 'Budget imprévus' },
            { id: 'ct-cm-exp-8-5', name: 'Frais de nettoyage final' },
          ]},
        ],
      },
      cashAccounts: [
        { id: uuidv4(), mainCategoryId: 'bank', name: 'Compte Projet Construction', initialBalance: 0 },
      ],
      entries: [],
      tiers: [], loans: [], borrowings: [],
    }
  }
];

export const weddingDemoTemplate = {
  id: 'demo-mariage',
  name: 'Mon mariage - démo',
  description: 'Un projet de démonstration pour planifier le budget d\'un mariage.',
  icon: 'Heart',
  color: 'pink',
  purpose: 'event',
  data: {
    categories: {
      revenue: [
        { id: 'rev-mariage-1', name: 'FINANCEMENT DU PROJET', subCategories: [
          { id: 'rev-mariage-1-1', name: 'Apport personnel' },
          { id: 'rev-mariage-1-2', name: 'Participation des familles' },
          { id: 'rev-mariage-1-3', name: 'Cagnotte des amis' },
        ]}
      ],
      expense: [
        { id: 'exp-mariage-1', name: 'CÉRÉMONIE & OFFICIANT', subCategories: [
          { id: 'exp-mariage-1-1', name: 'Cérémonie religieuse' }, { id: 'exp-mariage-1-2', name: 'Cérémonie civile' },
          { id: 'exp-mariage-1-3', name: 'Cérémonie laïque / Symbolique' }, { id: 'exp-mariage-1-4', name: 'Lieu de cérémonie' },
        ]},
        { id: 'exp-mariage-2', name: 'LIEU DE RÉCEPTION', subCategories: [
          { id: 'exp-mariage-2-1', name: 'Location du lieu' }, { id: 'exp-mariage-2-2', name: 'Location de mobilier' },
          { id: 'exp-mariage-2-3', name: 'Location de sanitaires' }, { id: 'exp-mariage-2-4', name: 'Caution' },
        ]},
        { id: 'exp-mariage-3', name: 'RESTAURATION & BOISSONS', subCategories: [
          { id: 'exp-mariage-3-1', name: 'Traiteur / Restaurant' }, { id: 'exp-mariage-3-2', name: 'Cocktail dînatoire' },
          { id: 'exp-mariage-3-3', name: 'Repas assis / Buffet' }, { id: 'exp-mariage-3-4', name: 'Gâteau de mariage' },
          { id: 'exp-mariage-3-5', name: 'Mignardises & Desserts' }, { id: 'exp-mariage-3-6', name: 'Food trucks' },
          { id: 'exp-mariage-3-7', name: 'Animation culinaire' }, { id: 'exp-mariage-3-8', name: 'Vin & Champagne' },
          { id: 'exp-mariage-3-9', name: 'Bar & Softs' }, { id: 'exp-mariage-3-10', name: 'Service en salle' },
          { id: 'exp-mariage-3-11', name: 'Location de vaisselle/verrerie' },
        ]},
        { id: 'exp-mariage-4', name: 'ANIMATION & MUSIQUE', subCategories: [
          { id: 'exp-mariage-4-1', name: 'DJ / Groupe / Orchestre' }, { id: 'exp-mariage-4-2', name: 'Playlist & Sono' },
          { id: 'exp-mariage-4-3', name: 'Animation surprise' }, { id: 'exp-mariage-4-4', name: 'Structures animées' },
          { id: 'exp-mariage-4-5', name: 'Feu d\'artifice / Lâcher de lanternes' }, { id: 'exp-mariage-4-6', name: 'Master of Ceremonies' },
        ]},
        { id: 'exp-mariage-5', name: 'PHOTO & VIDÉO', subCategories: [
          { id: 'exp-mariage-5-1', name: 'Photographe' }, { id: 'exp-mariage-5-2', name: 'Vidéaste' },
          { id: 'exp-mariage-5-3', name: 'Photobooth' }, { id: 'exp-mariage-5-4', name: 'Photo de groupe' }, { id: 'exp-mariage-5-5', name: 'Retouches & Montage' },
        ]},
        { id: 'exp-mariage-6', name: 'TENUES & BEAUTÉ', subCategories: [
          { id: 'exp-mariage-6-1', name: 'Robe de mariée' }, { id: 'exp-mariage-6-2', name: 'Accessoires robe' },
          { id: 'exp-mariage-6-3', name: 'Costume marié' }, { id: 'exp-mariage-6-4', name: 'Tenue des témoins' },
          { id: 'exp-mariage-6-5', name: 'Tenue de rechange' }, { id: 'exp-mariage-6-6', name: 'Coiffure & Maquillage' }, { id: 'exp-mariage-6-7', name: 'Esthétique' },
        ]},
        { id: 'exp-mariage-7', name: 'DÉCORATION & FLEURS', subCategories: [
          { id: 'exp-mariage-7-1', name: 'Fleuriste' }, { id: 'exp-mariage-7-2', name: 'Décorateur wedding planner' },
          { id: 'exp-mariage-7-3', name: 'Décoration de salle' }, { id: 'exp-mariage-7-4', name: 'Décoration de table' },
          { id: 'exp-mariage-7-5', name: 'Signalétique' }, { id: 'exp-mariage-7-6', name: 'Architecture & Mobilier de décoration' },
        ]},
        { id: 'exp-mariage-8', name: 'PAPETERIE & COMMUNICATION', subCategories: [
          { id: 'exp-mariage-8-1', name: 'Faire-part' }, { id: 'exp-mariage-8-2', name: 'Site internet / Application dédiée' },
          { id: 'exp-mariage-8-3', name: 'Livret de cérémonie' }, { id: 'exp-mariage-8-4', name: 'Plan de table & Calligraphie' },
          { id: 'exp-mariage-8-5', name: 'Menu & Programme de la journée' }, { id: 'exp-mariage-8-6', name: 'Timbre & Frais d\'envoi' },
        ]},
        { id: 'exp-mariage-9', name: 'TRANSPORT & LOGEMENT', subCategories: [
          { id: 'exp-mariage-9-1', name: 'Voiture de mariage / Calèche' }, { id: 'exp-mariage-9-2', name: 'Transport des invités' },
          { id: 'exp-mariage-9-3', name: 'Transport des mariés' }, { id: 'exp-mariage-9-4', name: 'Logement des mariés' }, { id: 'exp-mariage-9-5', name: 'Logement des invités' },
        ]},
        { id: 'exp-mariage-10', name: 'ALLIANCE & CADEAUX', subCategories: [
          { id: 'exp-mariage-10-1', name: 'Alliances' }, { id: 'exp-mariage-10-2', name: 'Cadeaux pour les invités' },
          { id: 'exp-mariage-10-3', name: 'Cadeaux pour les témoins / Famille' }, { id: 'exp-mariage-10-4', name: 'Livraison & Emballage' },
        ]},
        { id: 'exp-mariage-11', name: 'PRESTATAIRES & COORDINATION', subCategories: [
          { id: 'exp-mariage-11-1', name: 'Wedding planner' }, { id: 'exp-mariage-11-2', name: 'Coordinateur jour J' },
          { id: 'exp-mariage-11-3', name: 'Assurance annulation mariage' }, { id: 'exp-mariage-11-4', name: 'Services de sécurité' },
        ]},
        { id: 'exp-mariage-12', name: 'ANIMATION ENFANTS', subCategories: [
          { id: 'exp-mariage-12-1', name: 'Espace enfants' }, { id: 'exp-mariage-12-2', name: 'Décoration dédiée' },
          { id: 'exp-mariage-12-3', name: 'Restauration adaptée' }, { id: 'exp-mariage-12-4', name: 'Petits cadeaux' },
        ]},
        { id: 'exp-mariage-13', name: 'DIVERS & IMPRÉVUS', subCategories: [
          { id: 'exp-mariage-13-1', name: 'Frais administratifs' }, { id: 'exp-mariage-13-2', name: 'Trousse de secours' },
          { id: 'exp-mariage-13-3', name: 'Pourboires' }, { id: 'exp-mariage-13-4', name: 'Budget imprévu' },
        ]},
        { id: 'exp-mariage-14', name: 'VOYAGE DE NOCES', subCategories: [
          { id: 'exp-mariage-14-1', name: 'Transport' }, { id: 'exp-mariage-14-2', name: 'Hébergement' },
          { id: 'exp-mariage-14-3', name: 'Activités & Restauration sur place' }, { id: 'exp-mariage-14-4', name: 'Assurance voyage' },
          { id: 'exp-mariage-14-5', name: 'Argent de poche' },
        ]},
      ],
    },
    cashAccounts: [
      { mainCategoryId: 'bank', name: 'Compte Mariage', initialBalance: 5000 },
    ],
    entries: [
      { type: 'revenu', category: 'Apport personnel', supplier: 'Épargne personnelle', amount: 10000, frequency: 'ponctuel', date: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0] },
      { type: 'revenu', category: 'Participation des familles', supplier: 'Parents', amount: 5000, frequency: 'ponctuel', date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0] },
      { type: 'depense', category: 'Location du lieu', supplier: 'Château de Rêve', amount: 7000, frequency: 'ponctuel', date: new Date(new Date().setDate(new Date().getDate() + 120)).toISOString().split('T')[0] },
      { type: 'depense', category: 'Traiteur / Restaurant', supplier: 'Le Festin Royal', amount: 8000, frequency: 'ponctuel', date: new Date(new Date().setDate(new Date().getDate() + 120)).toISOString().split('T')[0] },
      { type: 'depense', category: 'Photographe', supplier: 'Souvenirs Éternels', amount: 2500, frequency: 'ponctuel', date: new Date(new Date().setDate(new Date().getDate() + 120)).toISOString().split('T')[0] },
      { type: 'depense', category: 'Robe de mariée', supplier: 'Boutique La Mariée', amount: 2000, frequency: 'ponctuel', date: new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().split('T')[0] },
      { type: 'depense', category: 'DJ / Groupe / Orchestre', supplier: 'DJ Ambiance Folie', amount: 1200, frequency: 'ponctuel', date: new Date(new Date().setDate(new Date().getDate() + 120)).toISOString().split('T')[0] },
      { type: 'depense', category: 'Fleuriste', supplier: 'Le Jardin Secret', amount: 1000, frequency: 'ponctuel', date: new Date(new Date().setDate(new Date().getDate() + 118)).toISOString().split('T')[0] },
      { type: 'depense', category: 'Budget imprévu', supplier: 'Imprévus', amount: 1500, frequency: 'ponctuel', date: new Date(new Date().setDate(new Date().getDate() + 120)).toISOString().split('T')[0] },
    ],
    tiers: [], loans: [], borrowings: [],
  }
};
