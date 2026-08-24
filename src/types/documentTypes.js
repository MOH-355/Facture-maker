export const DOCUMENT_TYPES = {
  facture: {
    id: 'facture',
    label: 'Facture',
    labelEn: 'Invoice',
    defaultPrefix: 'FAC-',
    primaryTitle: 'FACTURE',
    headerLabel: 'Facturé à :',
    showPaymentTerms: true,
    showDueDate: true,
    badgeColor: '#2563eb'
  },
  devis: {
    id: 'devis',
    label: 'Devis / Estimation',
    labelEn: 'Quote / Estimate',
    defaultPrefix: 'DEV-',
    primaryTitle: 'DEVIS',
    headerLabel: 'Destinataire :',
    showPaymentTerms: true,
    showDueDate: true,
    badgeColor: '#7c3aed'
  },
  commande: {
    id: 'commande',
    label: 'Bon de Commande',
    labelEn: 'Purchase Order',
    defaultPrefix: 'BC-',
    primaryTitle: 'BON DE COMMANDE',
    headerLabel: 'Fournisseur / Destinataire :',
    showPaymentTerms: true,
    showDueDate: true,
    badgeColor: '#059669'
  },
  livraison: {
    id: 'livraison',
    label: 'Bon de Livraison',
    labelEn: 'Delivery Slip',
    defaultPrefix: 'BL-',
    primaryTitle: 'BON DE LIVRAISON',
    headerLabel: 'Adresse de Livraison :',
    showPaymentTerms: false,
    showDueDate: false,
    badgeColor: '#d97706'
  },
  recu: {
    id: 'recu',
    label: 'Reçu / Quittance',
    labelEn: 'Receipt',
    defaultPrefix: 'REC-',
    primaryTitle: 'REÇU DE PAIEMENT',
    headerLabel: 'Reçu de :',
    showPaymentTerms: false,
    showDueDate: false,
    badgeColor: '#0284c7'
  },
  avoir: {
    id: 'avoir',
    label: 'Avoir / Note de Crédit',
    labelEn: 'Credit Note',
    defaultPrefix: 'AV-',
    primaryTitle: 'AVOIR',
    headerLabel: 'Crédité à :',
    showPaymentTerms: false,
    showDueDate: false,
    badgeColor: '#dc2626'
  },
  custom: {
    id: 'custom',
    label: 'Document Personnalisé',
    labelEn: 'Custom Document',
    defaultPrefix: 'DOC-',
    primaryTitle: 'DOCUMENT',
    headerLabel: 'Destinataire :',
    showPaymentTerms: false,
    showDueDate: false,
    badgeColor: '#4b5563'
  }
};

export const PAPER_FORMATS = {
  'a4-portrait': {
    id: 'a4-portrait',
    label: 'A4 Portrait (210 × 297 mm)',
    width: 794,
    height: 1123,
    jsPdfFormat: 'a4',
    orientation: 'p'
  },
  'a4-landscape': {
    id: 'a4-landscape',
    label: 'A4 Paysage (297 × 210 mm)',
    width: 1123,
    height: 794,
    jsPdfFormat: 'a4',
    orientation: 'l'
  },
  'letter-portrait': {
    id: 'letter-portrait',
    label: 'US Letter Portrait (8.5 × 11 in)',
    width: 816,
    height: 1056,
    jsPdfFormat: 'letter',
    orientation: 'p'
  },
  'letter-landscape': {
    id: 'letter-landscape',
    label: 'US Letter Paysage (11 × 8.5 in)',
    width: 1056,
    height: 816,
    jsPdfFormat: 'letter',
    orientation: 'l'
  },
  'pos-receipt': {
    id: 'pos-receipt',
    label: 'Ticket de Caisse / POS (80 mm)',
    width: 380,
    height: 800,
    jsPdfFormat: [80, 200],
    orientation: 'p'
  }
};

export const THEMES = {
  modern: {
    id: 'modern',
    name: 'Moderne Épuré',
    description: 'Bordures fines, en-têtes épurés et design aéré contemporain'
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Classique',
    description: 'En-têtes sombres formels, double bordure de séparation professionnelle'
  },
  creative: {
    id: 'creative',
    name: 'Studio Créatif',
    description: 'Bandeaux colorés vibrants et badges modernes'
  },
  minimal: {
    id: 'minimal',
    name: 'Minimaliste Éditorial',
    description: 'Typographie fine, monochrome équilibré, style luxe'
  },
  thermal: {
    id: 'thermal',
    name: 'Ticket Thermique',
    description: 'Style caisse enregistreuse compact pour reçus rapides'
  }
};

export const ACCENT_COLORS = [
  { name: 'Bleu Royal', value: '#2563eb' },
  { name: 'Émeraude', value: '#059669' },
  { name: 'Indigo / Violet', value: '#6366f1' },
  { name: 'Anthracite', value: '#1e293b' },
  { name: 'Rubis / Rouge', value: '#dc2626' },
  { name: 'Ambre / Or', value: '#d97706' },
  { name: 'Cyan Moderne', value: '#0891b2' },
  { name: 'Rose Fushia', value: '#db2777' }
];

export const CURRENCIES = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', namePlural: 'Euros', sub: 'centime', subPlural: 'centimes', position: 'right' },
  USD: { code: 'USD', symbol: '$', name: 'Dollar', namePlural: 'Dollars', sub: 'cent', subPlural: 'cents', position: 'left' },
  MAD: { code: 'MAD', symbol: 'DH', name: 'Dirham', namePlural: 'Dirhams', sub: 'centime', subPlural: 'centimes', position: 'right' },
  DZD: { code: 'DZD', symbol: 'DA', name: 'Dinar', namePlural: 'Dinars', sub: 'centime', subPlural: 'centimes', position: 'right' },
  GBP: { code: 'GBP', symbol: '£', name: 'Pound', namePlural: 'Pounds', sub: 'penny', subPlural: 'pence', position: 'left' },
  CAD: { code: 'CAD', symbol: 'CAD $', name: 'Dollar', namePlural: 'Dollars', sub: 'cent', subPlural: 'cents', position: 'right' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Franc', namePlural: 'Francs', sub: 'centime', subPlural: 'centimes', position: 'right' },
  XOF: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA', namePlural: 'Francs CFA', sub: 'centime', subPlural: 'centimes', position: 'right' },
  TND: { code: 'TND', symbol: 'DT', name: 'Dinar', namePlural: 'Dinars', sub: 'millime', subPlural: 'millimes', position: 'right' }
};

export const FONT_FAMILIES = [
  { name: 'Inter (Moderne)', value: "'Inter', sans-serif" },
  { name: 'Poppins (Géométrique)', value: "'Poppins', sans-serif" },
  { name: 'Montserrat (Élégant)', value: "'Montserrat', sans-serif" },
  { name: 'Roboto (Standard)', value: "'Roboto', sans-serif" },
  { name: 'Playfair Display (Serif Luxe)', value: "'Playfair Display', serif" },
  { name: 'Space Mono (Technique/POS)', value: "'Space Mono', monospace" }
];

export const WATERMARKS = [
  { id: 'NONE', label: 'Aucun filigrane', text: '', color: 'transparent' },
  { id: 'PAYE', label: 'PAYÉ', text: 'PAYÉ', color: '#16a34a' },
  { id: 'EN_ATTENTE', label: 'EN ATTENTE', text: 'EN ATTENTE', color: '#d97706' },
  { id: 'ACCEPTE', label: 'DEVIS ACCEPTÉ', text: 'ACCEPTÉ', color: '#2563eb' },
  { id: 'BROUILLON', label: 'BROUILLON', text: 'BROUILLON', color: '#9ca3af' },
  { id: 'ANNULE', label: 'ANNULÉ', text: 'ANNULÉ', color: '#dc2626' },
  { id: 'LIVRE', label: 'LIVRÉ', text: 'LIVRÉ', color: '#059669' },
  { id: 'DUPLICATA', label: 'DUPLICATA', text: 'DUPLICATA', color: '#6366f1' }
];
