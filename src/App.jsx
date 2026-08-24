import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Download, Image as ImageIcon, Save, Upload, Type, 
  AlignLeft, AlignCenter, AlignRight, Bold, Underline, Columns, 
  FilePlus, Sparkles, CheckCircle, Percent, CreditCard, ChevronDown, 
  Layers, Move, CornerDownRight, Maximize2, ShieldCheck
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { 
  DOCUMENT_TYPES, PAPER_FORMATS, THEMES, ACCENT_COLORS, 
  CURRENCIES, FONT_FAMILIES, WATERMARKS 
} from './types/documentTypes';
import { formatAmountInWords } from './utils/numberToWords';
import ClientManagerModal from './components/ClientManagerModal';
import ItemCatalogModal from './components/ItemCatalogModal';
import StudioToolbar from './components/StudioToolbar';

// Default initial state
const defaultLogo = { id: 'logo', src: null, x: 40, y: 40, w: 180, h: 80 };
const defaultSignature = { id: 'signature', x: 500, y: 780, w: 250, h: 140 };
const defaultAmountBox = { id: 'amountLetters', x: 40, y: 780, w: 420, h: 100 };
const defaultBankDetailsBox = { 
  id: 'bank-details', 
  x: 40, y: 900, w: 420, h: 90, 
  text: 'Coordonnées Bancaires :\nBanque : BRED Banque Populaire\nIBAN : FR76 3000 4000 0100 2345 6789 012\nBIC : BPOPFRPPXXX', 
  align: 'left', fontSize: 11, color: '#4b5563', isBold: false, isUnderline: false 
};

const defaultInvoiceMeta = {
  number: 'FAC-2026-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  poNumber: 'PO-9842',
  validity: '30 jours'
};

const defaultTableHeaders = {
  desc: 'Description / Prestation',
  qty: 'Qté',
  price: 'Prix Unit. HT',
  total: 'Total HT'
};

const defaultItems = [
  { id: 1, desc: 'Conception & Développement Web App (React / Vite)', qty: 1, price: 1800, customData: {} },
  { id: 2, desc: 'Intégration API & Base de données', qty: 1, price: 750, customData: {} },
  { id: 3, desc: 'Maintenance corrective & Support technique (1 an)', qty: 12, price: 65, customData: {} }
];

const defaultCustomTextboxes = [
  {
    id: 'company-info',
    x: 480, y: 40, w: 270, h: 130,
    text: 'VOTRE ENTREPRISE SAS\n123 Boulevard Saint-Germain\n75006 Paris, France\ncontact@monentreprise.com\n+33 1 45 67 89 00\nSIRET: 889 123 456 00018\nTVA: FR 32 889123456',
    align: 'right',
    fontSize: 12, color: '#374151', isBold: false, isUnderline: false
  },
  {
    id: 'client-info',
    x: 40, y: 150, w: 320, h: 110,
    text: 'Facturé à :\nENTREPRISE CLIENTE\n456 Avenue des Champs-Élysées\n75008 Paris, France\ncontact@client.com\nN° TVA / SIRET : FR 54 987654321',
    align: 'left',
    fontSize: 12, color: '#374151', isBold: false, isUnderline: false
  }
];

// Helper to load state from localStorage
const loadSavedData = () => {
  try {
    const saved = localStorage.getItem('invoiceAppSavedState_v2');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse saved state", e);
  }
  return null;
};

// Reusable Draggable & Resizable Box
const DraggableBox = ({ 
  item, updateItem, removeItem, children, isLogo, 
  canvasRef, setSnapLines, allItems, showGrid 
}) => {
  const [active, setActive] = useState(false);

  const handlePointerDown = (e, type) => {
    e.stopPropagation();
    e.preventDefault();
    setActive(true);

    let startX = e.clientX;
    let startY = e.clientY;
    let startW = item.w;
    let startH = item.h;
    let startItemX = item.x;
    let startItemY = item.y;

    const onPointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (type === 'move') {
        let targetX = startItemX + dx;
        let targetY = startItemY + dy;
        let snapX = null;
        let snapY = null;

        const SNAP_THRESHOLD = 12;

        if (allItems) {
          const otherItems = allItems.filter(i => i.id !== item.id);
          for (const other of otherItems) {
            if (Math.abs(targetX - other.x) < SNAP_THRESHOLD) { targetX = other.x; snapX = other.x; }
            else if (Math.abs((targetX + startW/2) - (other.x + other.w/2)) < SNAP_THRESHOLD) { targetX = other.x + other.w/2 - startW/2; snapX = other.x + other.w/2; }
            else if (Math.abs((targetX + startW) - (other.x + other.w)) < SNAP_THRESHOLD) { targetX = other.x + other.w - startW; snapX = other.x + other.w; }

            if (Math.abs(targetY - other.y) < SNAP_THRESHOLD) { targetY = other.y; snapY = other.y; }
            else if (Math.abs((targetY + startH/2) - (other.y + other.h/2)) < SNAP_THRESHOLD) { targetY = other.y + other.h/2 - startH/2; snapY = other.y + other.h/2; }
            else if (Math.abs((targetY + startH) - (other.y + other.h)) < SNAP_THRESHOLD) { targetY = other.y + other.h - startH; snapY = other.y + other.h; }
          }
        }

        if (canvasRef && canvasRef.current) {
          const canvasWidth = canvasRef.current.offsetWidth;
          const centerX = canvasWidth / 2;

          if (snapX === null) {
            if (Math.abs((targetX + startW / 2) - centerX) < SNAP_THRESHOLD) { targetX = centerX - startW / 2; snapX = centerX; }
            else if (Math.abs(targetX - 40) < SNAP_THRESHOLD) { targetX = 40; snapX = 40; }
            else if (Math.abs((targetX + startW) - (canvasWidth - 40)) < SNAP_THRESHOLD) { targetX = canvasWidth - startW - 40; snapX = canvasWidth - 40; }
          }
        }

        // Snap to grid (10px grid step)
        if (showGrid) {
          targetX = Math.round(targetX / 10) * 10;
          targetY = Math.round(targetY / 10) * 10;
        }

        setSnapLines({ x: snapX, y: snapY });
        updateItem(item.id, { x: Math.max(0, targetX), y: Math.max(0, targetY) });
      } else if (type === 'resize') {
        let newW = Math.max(50, startW + dx);
        let newH = Math.max(25, startH + dy);
        if (showGrid) {
          newW = Math.round(newW / 10) * 10;
          newH = Math.round(newH / 10) * 10;
        }
        updateItem(item.id, { w: newW, h: newH });
      }
    };

    const onPointerUp = () => {
      setSnapLines({ x: null, y: null });
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  useEffect(() => {
    const handleClickOutside = () => setActive(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div 
      className={`draggable-item ${active ? 'active' : ''}`}
      style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
      onClick={(e) => { e.stopPropagation(); setActive(true); }}
    >
      <div className="drag-handle print-hide" onPointerDown={(e) => handlePointerDown(e, 'move')}></div>
      
      {!isLogo && active && (
        <div className="controls print-hide" onClick={(e) => e.stopPropagation()}>
          <button className={item.isBold ? 'active' : ''} onClick={() => updateItem(item.id, { isBold: !item.isBold })} title="Gras"><Bold size={13}/></button>
          <button className={item.isUnderline ? 'active' : ''} onClick={() => updateItem(item.id, { isUnderline: !item.isUnderline })} title="Souligné"><Underline size={13}/></button>
          
          <div className="controls-divider"></div>
          
          <input 
            type="color" 
            value={item.color || '#1f2937'} 
            onChange={(e) => updateItem(item.id, { color: e.target.value })} 
            title="Couleur du texte"
          />
          <input 
            type="number" 
            style={{ width: '46px' }}
            value={item.fontSize || 12} 
            onChange={(e) => updateItem(item.id, { fontSize: parseInt(e.target.value) || 12 })}
            title="Taille de police (px)"
          />

          <div className="controls-divider"></div>

          <button className={item.align === 'left' ? 'active' : ''} onClick={() => updateItem(item.id, { align: 'left' })} title="Aligner à gauche"><AlignLeft size={13}/></button>
          <button className={item.align === 'center' ? 'active' : ''} onClick={() => updateItem(item.id, { align: 'center' })} title="Centrer"><AlignCenter size={13}/></button>
          <button className={item.align === 'right' ? 'active' : ''} onClick={() => updateItem(item.id, { align: 'right' })} title="Aligner à droite"><AlignRight size={13}/></button>
          
          <div className="controls-divider"></div>
          
          {removeItem && <button onClick={() => removeItem(item.id)} style={{ color: 'var(--danger-color)' }} title="Supprimer le bloc"><Trash2 size={13}/></button>}
        </div>
      )}
      
      {isLogo && active && (
        <div className="controls print-hide" onClick={(e) => e.stopPropagation()}>
           <button onClick={() => removeItem(item.id)} style={{ color: 'var(--danger-color)' }} title="Supprimer le logo"><Trash2 size={13}/></button>
        </div>
      )}

      <div className="item-content" style={{ textAlign: item.align || 'left' }}>
        {children}
      </div>

      <div className="resize-handle print-hide" onPointerDown={(e) => handlePointerDown(e, 'resize')}></div>
    </div>
  );
};

export default function App() {
  const savedData = loadSavedData();

  // Document Config
  const [documentType, setDocumentType] = useState(savedData?.documentType || 'facture');
  const [paperFormat, setPaperFormat] = useState(savedData?.paperFormat || 'a4-portrait');
  const [theme, setTheme] = useState(savedData?.theme || 'modern');
  const [accentColor, setAccentColor] = useState(savedData?.accentColor || '#2563eb');
  const [fontFamily, setFontFamily] = useState(savedData?.fontFamily || "'Inter', sans-serif");
  const [currency, setCurrency] = useState(savedData?.currency || 'EUR');
  const [wordsLanguage, setWordsLanguage] = useState(savedData?.wordsLanguage || 'fr');
  const [watermark, setWatermark] = useState(savedData?.watermark || 'NONE');
  const [showGrid, setShowGrid] = useState(savedData?.showGrid ?? false);

  // Content state
  const [logo, setLogo] = useState(savedData?.logo || defaultLogo);
  const [invoiceMeta, setInvoiceMeta] = useState(savedData?.invoiceMeta || defaultInvoiceMeta);
  const [tableHeaders, setTableHeaders] = useState(savedData?.tableHeaders || defaultTableHeaders);
  const [customCols, setCustomCols] = useState(savedData?.customCols || []);
  const [items, setItems] = useState(savedData?.items || defaultItems);
  const [taxRate, setTaxRate] = useState(savedData?.taxRate !== undefined ? savedData.taxRate : 20);
  const [discountPercent, setDiscountPercent] = useState(savedData?.discountPercent || 0);
  const [downPayment, setDownPayment] = useState(savedData?.downPayment || 0);
  
  const [customTextboxes, setCustomTextboxes] = useState(savedData?.customTextboxes || defaultCustomTextboxes);
  const [customImages, setCustomImages] = useState(savedData?.customImages || []);
  const [signatureLabel, setSignatureLabel] = useState(savedData?.signatureLabel || 'Date et Signature (précédée de "Bon pour accord")');
  const [signatureBox, setSignatureBox] = useState(savedData?.signatureBox || defaultSignature);
  const [amountBox, setAmountBox] = useState(savedData?.amountBox || defaultAmountBox);
  const [bankDetailsBox, setBankDetailsBox] = useState(savedData?.bankDetailsBox || defaultBankDetailsBox);
  const [tableMarginTop, setTableMarginTop] = useState(savedData?.tableMarginTop ?? 280);

  // Table Column & Row Resizing
  const [colWidths, setColWidths] = useState(savedData?.colWidths || { desc: 360, qty: 70, price: 110, total: 110 });
  const [rowHeights, setRowHeights] = useState(savedData?.rowHeights || {});

  // History Stack for Undo/Redo
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [snapLines, setSnapLines] = useState({ x: null, y: null });
  const [ttcInLetters, setTtcInLetters] = useState('');

  const invoiceRef = useRef(null);
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const addImageInputRef = useRef(null);

  // Currency object
  const curr = CURRENCIES[currency] || CURRENCIES.EUR;
  const currentDocType = DOCUMENT_TYPES[documentType] || DOCUMENT_TYPES.facture;
  const currentFormat = PAPER_FORMATS[paperFormat] || PAPER_FORMATS['a4-portrait'];
  const currentWatermark = WATERMARKS.find(w => w.id === watermark) || WATERMARKS[0];

  // Calculations
  const subtotalHT = items.reduce((sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)), 0);
  const discountAmount = subtotalHT * ((parseFloat(discountPercent) || 0) / 100);
  const netHT = Math.max(0, subtotalHT - discountAmount);
  const tvaAmount = netHT * ((parseFloat(taxRate) || 0) / 100);
  const totalTTC = netHT + tvaAmount;
  const balanceDue = Math.max(0, totalTTC - (parseFloat(downPayment) || 0));

  // Update Amount in Words
  useEffect(() => {
    const formatted = formatAmountInWords(balanceDue, currency, wordsLanguage);
    setTtcInLetters(formatted);
  }, [balanceDue, currency, wordsLanguage]);

  // Push to history for undo
  const saveSnapshot = useCallback(() => {
    const state = {
      documentType, paperFormat, theme, accentColor, fontFamily, currency, wordsLanguage,
      watermark, showGrid, logo, invoiceMeta, tableHeaders, customCols, items, taxRate,
      discountPercent, downPayment, customTextboxes, customImages, signatureLabel,
      signatureBox, amountBox, bankDetailsBox, tableMarginTop, colWidths, rowHeights
    };
    setHistory(prev => [...prev.slice(-25), JSON.stringify(state)]);
    setFuture([]);
  }, [
    documentType, paperFormat, theme, accentColor, fontFamily, currency, wordsLanguage,
    watermark, showGrid, logo, invoiceMeta, tableHeaders, customCols, items, taxRate,
    discountPercent, downPayment, customTextboxes, customImages, signatureLabel,
    signatureBox, amountBox, bankDetailsBox, tableMarginTop, colWidths, rowHeights
  ]);

  // Auto-Save to Local Storage
  useEffect(() => {
    const state = {
      documentType, paperFormat, theme, accentColor, fontFamily, currency, wordsLanguage,
      watermark, showGrid, logo, invoiceMeta, tableHeaders, customCols, items, taxRate,
      discountPercent, downPayment, customTextboxes, customImages, signatureLabel,
      signatureBox, amountBox, bankDetailsBox, tableMarginTop, colWidths, rowHeights
    };
    localStorage.setItem('invoiceAppSavedState_v2', JSON.stringify(state));
  }, [
    documentType, paperFormat, theme, accentColor, fontFamily, currency, wordsLanguage,
    watermark, showGrid, logo, invoiceMeta, tableHeaders, customCols, items, taxRate,
    discountPercent, downPayment, customTextboxes, customImages, signatureLabel,
    signatureBox, amountBox, bankDetailsBox, tableMarginTop, colWidths, rowHeights
  ]);

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (history.length === 0) return;
    const currentState = {
      documentType, paperFormat, theme, accentColor, fontFamily, currency, wordsLanguage,
      watermark, showGrid, logo, invoiceMeta, tableHeaders, customCols, items, taxRate,
      discountPercent, downPayment, customTextboxes, customImages, signatureLabel,
      signatureBox, amountBox, bankDetailsBox, tableMarginTop, colWidths, rowHeights
    };
    const previousStateJson = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setFuture(prev => [JSON.stringify(currentState), ...prev]);

    applyStateFromJson(previousStateJson);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const currentState = {
      documentType, paperFormat, theme, accentColor, fontFamily, currency, wordsLanguage,
      watermark, showGrid, logo, invoiceMeta, tableHeaders, customCols, items, taxRate,
      discountPercent, downPayment, customTextboxes, customImages, signatureLabel,
      signatureBox, amountBox, bankDetailsBox, tableMarginTop, colWidths, rowHeights
    };
    const nextStateJson = future[0];
    setFuture(prev => prev.slice(1));
    setHistory(prev => [...prev, JSON.stringify(currentState)]);

    applyStateFromJson(nextStateJson);
  };

  const applyStateFromJson = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.documentType !== undefined) setDocumentType(data.documentType);
      if (data.paperFormat !== undefined) setPaperFormat(data.paperFormat);
      if (data.theme !== undefined) setTheme(data.theme);
      if (data.accentColor !== undefined) setAccentColor(data.accentColor);
      if (data.fontFamily !== undefined) setFontFamily(data.fontFamily);
      if (data.currency !== undefined) setCurrency(data.currency);
      if (data.wordsLanguage !== undefined) setWordsLanguage(data.wordsLanguage);
      if (data.watermark !== undefined) setWatermark(data.watermark);
      if (data.showGrid !== undefined) setShowGrid(data.showGrid);
      if (data.logo) setLogo(data.logo);
      if (data.invoiceMeta) setInvoiceMeta(data.invoiceMeta);
      if (data.tableHeaders) setTableHeaders(data.tableHeaders);
      if (data.customCols) setCustomCols(data.customCols);
      if (data.items) setItems(data.items);
      if (data.taxRate !== undefined) setTaxRate(data.taxRate);
      if (data.discountPercent !== undefined) setDiscountPercent(data.discountPercent);
      if (data.downPayment !== undefined) setDownPayment(data.downPayment);
      if (data.customTextboxes) setCustomTextboxes(data.customTextboxes);
      if (data.customImages) setCustomImages(data.customImages);
      if (data.signatureLabel !== undefined) setSignatureLabel(data.signatureLabel);
      if (data.signatureBox) setSignatureBox(data.signatureBox);
      if (data.amountBox) setAmountBox(data.amountBox);
      if (data.bankDetailsBox) setBankDetailsBox(data.bankDetailsBox);
      if (data.tableMarginTop !== undefined) setTableMarginTop(data.tableMarginTop);
      if (data.colWidths) setColWidths(data.colWidths);
      if (data.rowHeights) setRowHeights(data.rowHeights);
    } catch (e) {
      console.error("Failed to parse state", e);
    }
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Switch Document Type
  const handleDocumentTypeChange = (newType) => {
    saveSnapshot();
    const config = DOCUMENT_TYPES[newType] || DOCUMENT_TYPES.facture;
    setDocumentType(newType);
    
    // Auto-update prefix if still using default pattern
    const currentNum = invoiceMeta.number;
    const parts = currentNum.split('-');
    const suffix = parts.length > 1 ? parts.slice(1).join('-') : '2026-001';
    setInvoiceMeta({ ...invoiceMeta, number: `${config.defaultPrefix}${suffix}` });
  };

  // 1-Click Convert Quote (Devis) to Invoice (Facture)
  const handleConvertToInvoice = () => {
    saveSnapshot();
    setDocumentType('facture');
    const parts = invoiceMeta.number.split('-');
    const suffix = parts.length > 1 ? parts.slice(1).join('-') : '2026-001';
    setInvoiceMeta({
      ...invoiceMeta,
      number: `FAC-${suffix}`,
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Apply Client From Address Book
  const handleApplyClient = (clientText) => {
    saveSnapshot();
    setCustomTextboxes(prev => {
      const clientBox = prev.find(tb => tb.id === 'client-info');
      if (clientBox) {
        return prev.map(tb => tb.id === 'client-info' ? { ...tb, text: clientText } : tb);
      } else {
        return [...prev, {
          id: 'client-info',
          x: 40, y: 150, w: 320, h: 110,
          text: clientText,
          align: 'left', fontSize: 12, color: '#374151', isBold: false, isUnderline: false
        }];
      }
    });
  };

  // Insert Item from Catalog
  const handleInsertCatalogItem = (newItem) => {
    saveSnapshot();
    setItems(prev => [
      ...prev,
      { id: Date.now(), desc: newItem.desc, qty: newItem.qty || 1, price: newItem.price || 0, customData: {} }
    ]);
  };

  // Handlers for Items
  const addItem = () => {
    saveSnapshot();
    setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0, customData: {} }]);
  };

  const removeItem = (id) => {
    saveSnapshot();
    setItems(items.filter(item => item.id !== id));
  };

  const updateItemField = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateItemCustomData = (itemId, colId, value) => {
    setItems(items.map(item => item.id === itemId ? { ...item, customData: { ...item.customData, [colId]: value } } : item));
  };

  // Columns Handlers
  const addColumn = () => {
    saveSnapshot();
    const newColId = 'col_' + Date.now();
    setCustomCols([...customCols, { id: newColId, name: 'Nouvelle Colonne' }]);
    setColWidths(prev => ({ ...prev, [newColId]: 80 }));
  };

  const removeColumn = (id) => {
    saveSnapshot();
    setCustomCols(customCols.filter(c => c.id !== id));
    setColWidths(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateColumnName = (id, name) => {
    setCustomCols(customCols.map(c => c.id === id ? { ...c, name } : c));
  };

  // Textboxes Handlers
  const addTextbox = () => {
    saveSnapshot();
    setCustomTextboxes([...customTextboxes, { 
      id: Date.now().toString(), 
      x: invoiceRef.current ? invoiceRef.current.offsetWidth / 2 - 100 : 50, 
      y: 100, 
      w: 220, h: 60,
      text: 'Nouveau texte',
      align: 'left',
      fontSize: 12,
      color: '#374151',
      isBold: false,
      isUnderline: false
    }]);
  };

  const updateTextbox = (id, changes) => setCustomTextboxes(customTextboxes.map(tb => tb.id === id ? { ...tb, ...changes } : tb));
  const removeTextbox = (id) => {
    saveSnapshot();
    setCustomTextboxes(customTextboxes.filter(tb => tb.id !== id));
  };

  // Logo & Images Handlers
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        saveSnapshot();
        setLogo({ ...logo, src: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    saveSnapshot();
    setLogo({ ...logo, src: null });
  };

  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        saveSnapshot();
        setCustomImages([...customImages, {
          id: 'img_' + Date.now(),
          src: event.target.result,
          x: invoiceRef.current ? invoiceRef.current.offsetWidth / 2 - 75 : 50,
          y: 100,
          w: 140,
          h: 140
        }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const updateCustomImage = (id, changes) => setCustomImages(customImages.map(img => img.id === id ? { ...img, ...changes } : img));
  const removeCustomImage = (id) => {
    saveSnapshot();
    setCustomImages(customImages.filter(img => img.id !== id));
  };

  // Resizing Handlers
  const handleTableMarginResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    let startY = e.clientY;
    let startMargin = tableMarginTop;

    const onPointerMove = (moveEvent) => {
      const dy = moveEvent.clientY - startY;
      setTableMarginTop(Math.max(0, startMargin + dy));
    };
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleColResize = (e, colId) => {
    e.stopPropagation();
    e.preventDefault();
    let startX = e.clientX;
    let startWidth = colWidths[colId] || 100;

    const onPointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [colId]: Math.max(35, startWidth + dx)
      }));
    };
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Reset Project
  const resetProject = () => {
    if (window.confirm("Êtes-vous sûr de vouloir commencer un nouveau document ? Les données actuelles seront réinitialisées.")) {
      localStorage.removeItem('invoiceAppSavedState_v2');
      window.location.reload();
    }
  };

  // Export PDF & PNG
  const exportPDF = async () => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    document.body.click(); 
    invoiceRef.current.classList.add('is-exporting');
    
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(invoiceRef.current, { 
          scale: 2.5, 
          useCORS: true,
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        
        const isLandscape = currentFormat.orientation === 'l';
        const pdf = new jsPDF({
          orientation: currentFormat.orientation,
          unit: 'mm',
          format: currentFormat.jsPdfFormat
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasRatio = canvas.height / canvas.width;
        const targetHeight = pdfWidth * canvasRatio;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, targetHeight));
        pdf.save(`${currentDocType.primaryTitle}_${invoiceMeta.number}.pdf`);
      } catch (err) {
        console.error('PDF export failed', err);
        alert('Erreur lors de la génération du PDF.');
      } finally {
        invoiceRef.current.classList.remove('is-exporting');
        setIsExporting(false);
      }
    }, 120);
  };

  const exportPNG = async () => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    document.body.click(); 
    invoiceRef.current.classList.add('is-exporting');
    
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(invoiceRef.current, { scale: 2.5, useCORS: true });
        const link = document.createElement('a');
        link.download = `${currentDocType.primaryTitle}_${invoiceMeta.number}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('PNG export failed', err);
        alert('Erreur lors de l’export PNG.');
      } finally {
        invoiceRef.current.classList.remove('is-exporting');
        setIsExporting(false);
      }
    }, 120);
  };

  // Save / Load Project JSON file
  const saveProject = () => {
    const state = {
      documentType, paperFormat, theme, accentColor, fontFamily, currency, wordsLanguage,
      watermark, showGrid, logo, invoiceMeta, tableHeaders, customCols, items, taxRate,
      discountPercent, downPayment, customTextboxes, customImages, signatureLabel,
      signatureBox, amountBox, bankDetailsBox, tableMarginTop, colWidths, rowHeights
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `Projet_${currentDocType.primaryTitle}_${invoiceMeta.number}.invoice`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const loadProject = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          applyStateFromJson(event.target.result);
          alert('Projet chargé avec succès !');
        } catch {
          alert('Format de fichier de projet invalide.');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // All interactive boxes for snap calculations
  const allCanvasItems = [
    logo.src ? logo : null,
    signatureBox,
    amountBox,
    bankDetailsBox,
    ...customTextboxes,
    ...customImages
  ].filter(Boolean);

  return (
    <div 
      className="studio-app" 
      style={{ 
        '--accent-color': accentColor,
        '--doc-font': fontFamily 
      }}
    >
      {/* Top Professional Toolbar */}
      <StudioToolbar
        documentType={documentType}
        setDocumentType={handleDocumentTypeChange}
        paperFormat={paperFormat}
        setPaperFormat={setPaperFormat}
        theme={theme}
        setTheme={setTheme}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        currency={currency}
        setCurrency={setCurrency}
        wordsLanguage={wordsLanguage}
        setWordsLanguage={setWordsLanguage}
        watermark={watermark}
        setWatermark={setWatermark}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenClients={() => setIsClientModalOpen(true)}
        onOpenCatalog={() => setIsCatalogModalOpen(true)}
        onConvertToInvoice={handleConvertToInvoice}
        onResetProject={resetProject}
        onSaveProject={saveProject}
        onLoadProjectClick={() => jsonInputRef.current && jsonInputRef.current.click()}
        onExportPDF={exportPDF}
        onExportPNG={exportPNG}
        isExporting={isExporting}
      />

      {/* Hidden File Inputs */}
      <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
      <input type="file" ref={jsonInputRef} onChange={loadProject} accept=".invoice,.json" style={{ display: 'none' }} />
      <input type="file" ref={addImageInputRef} onChange={handleAddImage} accept="image/*" style={{ display: 'none' }} />

      {/* Main Workspace Area */}
      <div className="studio-workspace">
        {/* Floating Quick Action Drawer / Sidebar */}
        <aside className="studio-sidebar print-hide">
          <div className="sidebar-group">
            <span className="sidebar-group-title">Éléments</span>
            <button className="sidebar-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
              <ImageIcon size={16}/> {logo.src ? 'Changer Logo' : 'Ajouter Logo'}
            </button>
            <button className="sidebar-btn" onClick={addTextbox}>
              <Type size={16}/> Ajouter Texte
            </button>
            <button className="sidebar-btn" onClick={() => addImageInputRef.current && addImageInputRef.current.click()}>
              <ImageIcon size={16}/> Insérer Image / Tampon
            </button>
            <button className="sidebar-btn" onClick={addColumn}>
              <Columns size={16}/> Ajouter Colonne
            </button>
            <button className="sidebar-btn" onClick={addItem}>
              <Plus size={16}/> Ajouter Ligne
            </button>
          </div>

          <div className="sidebar-group">
            <span className="sidebar-group-title">Données Rapides</span>
            <button className="sidebar-btn" onClick={() => setIsClientModalOpen(true)}>
              <CreditCard size={16}/> Carnet Clients
            </button>
            <button className="sidebar-btn" onClick={() => setIsCatalogModalOpen(true)}>
              <Sparkles size={16}/> Catalogue Articles
            </button>
          </div>
        </aside>

        {/* Canvas Viewport */}
        <main className="canvas-viewport">
          <div 
            ref={invoiceRef} 
            className={`document-canvas theme-${theme} format-${paperFormat} ${showGrid ? 'show-grid-bg' : ''}`}
            style={{ 
              width: `${currentFormat.width}px`, 
              minHeight: `${currentFormat.height}px` 
            }}
          >
            {/* Watermark / Stamp Overlay */}
            {currentWatermark.text && (
              <div 
                className="watermark-overlay print-show" 
                style={{ borderColor: currentWatermark.color, color: currentWatermark.color }}
              >
                {currentWatermark.text}
              </div>
            )}

            {/* Alignment Guide Snap Lines */}
            {snapLines.x !== null && (
              <div className="snap-line-v print-hide" style={{ left: snapLines.x }}></div>
            )}
            {snapLines.y !== null && (
              <div className="snap-line-h print-hide" style={{ top: snapLines.y }}></div>
            )}

            {/* Document Header Band (for Creative & Corporate themes) */}
            <div className="doc-theme-header-band">
              <div className="doc-theme-title-tag">
                <span className="doc-main-badge">{currentDocType.primaryTitle}</span>
              </div>
            </div>

            {/* Logo Box */}
            {logo.src ? (
              <DraggableBox 
                item={logo} 
                updateItem={(id, changes) => setLogo({ ...logo, ...changes })}
                removeItem={removeLogo}
                isLogo={true}
                canvasRef={invoiceRef}
                setSnapLines={setSnapLines}
                allItems={allCanvasItems}
                showGrid={showGrid}
              >
                <img src={logo.src} alt="Logo Entreprise" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </DraggableBox>
            ) : (
              <div 
                className="logo-placeholder print-hide"
                style={{ left: logo.x, top: logo.y, width: logo.w, height: logo.h }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <ImageIcon size={24} className="text-muted"/>
                <span>Cliquer pour insérer votre logo</span>
              </div>
            )}

            {/* Custom Textboxes (Company Info, Client Info, Custom Notes) */}
            {customTextboxes.map(tb => (
              <DraggableBox 
                key={tb.id} 
                item={tb} 
                updateItem={updateTextbox} 
                removeItem={removeTextbox}
                canvasRef={invoiceRef}
                setSnapLines={setSnapLines}
                allItems={allCanvasItems}
                showGrid={showGrid}
              >
                <textarea 
                  className={`free-textbox ${tb.isBold ? 'font-bold' : ''} ${tb.isUnderline ? 'underline' : ''}`}
                  style={{ 
                    textAlign: tb.align || 'left', 
                    fontSize: `${tb.fontSize || 12}px`, 
                    color: tb.color || '#374151' 
                  }}
                  value={tb.text}
                  onChange={(e) => updateTextbox(tb.id, { text: e.target.value })}
                  placeholder="Écrivez votre texte ici..."
                />
              </DraggableBox>
            ))}

            {/* Custom Inserted Images / Badges */}
            {customImages.map(img => (
              <DraggableBox 
                key={img.id} 
                item={img} 
                updateItem={updateCustomImage} 
                removeItem={removeCustomImage}
                isLogo={true}
                canvasRef={invoiceRef}
                setSnapLines={setSnapLines}
                allItems={allCanvasItems}
                showGrid={showGrid}
              >
                <img src={img.src} alt="Image personnalisée" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </DraggableBox>
            ))}

            {/* Document Metadata Box (Number, Date, Due Date, PO) */}
            <div className="doc-meta-card">
              <div className="doc-meta-title-row">
                <h1 className="doc-type-heading">{currentDocType.primaryTitle}</h1>
                <input 
                  type="text" 
                  className="doc-number-input"
                  value={invoiceMeta.number}
                  onChange={e => setInvoiceMeta({ ...invoiceMeta, number: e.target.value })}
                  title="Numéro du document"
                />
              </div>

              <div className="doc-meta-fields-grid">
                <div className="meta-field">
                  <span className="meta-label">Date :</span>
                  <input 
                    type="date" 
                    value={invoiceMeta.date} 
                    onChange={e => setInvoiceMeta({ ...invoiceMeta, date: e.target.value })}
                    className="meta-value-input"
                  />
                </div>

                {currentDocType.showDueDate && (
                  <div className="meta-field">
                    <span className="meta-label">Date d'échéance :</span>
                    <input 
                      type="date" 
                      value={invoiceMeta.dueDate} 
                      onChange={e => setInvoiceMeta({ ...invoiceMeta, dueDate: e.target.value })}
                      className="meta-value-input"
                    />
                  </div>
                )}

                {documentType === 'devis' && (
                  <div className="meta-field">
                    <span className="meta-label">Validité de l'offre :</span>
                    <input 
                      type="text" 
                      value={invoiceMeta.validity || '30 jours'} 
                      onChange={e => setInvoiceMeta({ ...invoiceMeta, validity: e.target.value })}
                      className="meta-value-input"
                    />
                  </div>
                )}

                {(documentType === 'facture' || documentType === 'commande') && (
                  <div className="meta-field">
                    <span className="meta-label">Réf. Bon de commande :</span>
                    <input 
                      type="text" 
                      value={invoiceMeta.poNumber || ''} 
                      placeholder="ex: BC-2026-08"
                      onChange={e => setInvoiceMeta({ ...invoiceMeta, poNumber: e.target.value })}
                      className="meta-value-input"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Drag Handle to Adjust Table Top Margin */}
            <div 
              className="table-margin-handle print-hide"
              style={{ top: `${tableMarginTop}px` }}
              onPointerDown={handleTableMarginResize}
              title="Faites glisser verticalement pour ajuster l'espacement du tableau"
            >
              <span>↕ Espacement du tableau ({tableMarginTop}px)</span>
            </div>

            {/* Main Interactive Items Table */}
            <div className="document-table-section" style={{ marginTop: `${tableMarginTop}px` }}>
              <table className="items-table">
                <thead>
                  <tr>
                    {customCols.map(col => (
                      <th key={col.id} style={{ width: colWidths[col.id] || 80 }}>
                        <div className="th-content">
                          <input 
                            type="text" 
                            value={col.name} 
                            onChange={e => updateColumnName(col.id, e.target.value)} 
                            className="th-input"
                          />
                          <button 
                            className="btn-remove-col print-hide" 
                            onClick={() => removeColumn(col.id)} 
                            title="Supprimer la colonne"
                          >
                            ×
                          </button>
                        </div>
                        <div className="col-resize-handle print-hide" onPointerDown={e => handleColResize(e, col.id)}></div>
                      </th>
                    ))}

                    <th style={{ width: colWidths.desc || 360 }}>
                      <div className="th-content">
                        <input 
                          type="text" 
                          value={tableHeaders.desc} 
                          onChange={e => setTableHeaders({ ...tableHeaders, desc: e.target.value })} 
                          className="th-input"
                        />
                      </div>
                      <div className="col-resize-handle print-hide" onPointerDown={e => handleColResize(e, 'desc')}></div>
                    </th>

                    <th style={{ width: colWidths.qty || 70, textAlign: 'center' }}>
                      <div className="th-content">
                        <input 
                          type="text" 
                          value={tableHeaders.qty} 
                          onChange={e => setTableHeaders({ ...tableHeaders, qty: e.target.value })} 
                          className="th-input text-center"
                        />
                      </div>
                      <div className="col-resize-handle print-hide" onPointerDown={e => handleColResize(e, 'qty')}></div>
                    </th>

                    <th style={{ width: colWidths.price || 110, textAlign: 'right' }}>
                      <div className="th-content">
                        <input 
                          type="text" 
                          value={tableHeaders.price} 
                          onChange={e => setTableHeaders({ ...tableHeaders, price: e.target.value })} 
                          className="th-input text-right"
                        />
                      </div>
                      <div className="col-resize-handle print-hide" onPointerDown={e => handleColResize(e, 'price')}></div>
                    </th>

                    <th style={{ width: colWidths.total || 110, textAlign: 'right' }}>
                      <div className="th-content">
                        <input 
                          type="text" 
                          value={tableHeaders.total} 
                          onChange={e => setTableHeaders({ ...tableHeaders, total: e.target.value })} 
                          className="th-input text-right"
                        />
                      </div>
                      <div className="col-resize-handle print-hide" onPointerDown={e => handleColResize(e, 'total')}></div>
                    </th>

                    <th className="print-hide th-action-col"></th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(item => {
                    const lineTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
                    return (
                      <tr key={item.id} style={{ height: rowHeights[item.id] || 40 }}>
                        {customCols.map(col => (
                          <td key={col.id}>
                            <input 
                              type="text" 
                              value={item.customData[col.id] || ''} 
                              onChange={e => updateItemCustomData(item.id, col.id, e.target.value)} 
                              className="td-input"
                            />
                          </td>
                        ))}

                        <td>
                          <textarea 
                            rows={1}
                            value={item.desc} 
                            onChange={e => updateItemField(item.id, 'desc', e.target.value)} 
                            placeholder="Description de la prestation ou de l'article..."
                            className="td-input td-textarea"
                          />
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="number" 
                            step="any"
                            value={item.qty} 
                            onChange={e => updateItemField(item.id, 'qty', parseFloat(e.target.value) || 0)} 
                            className="td-input text-center"
                          />
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div className="price-cell">
                            <input 
                              type="number" 
                              step="any"
                              value={item.price} 
                              onChange={e => updateItemField(item.id, 'price', parseFloat(e.target.value) || 0)} 
                              className="td-input text-right"
                            />
                            <span className="currency-tag">{curr.symbol}</span>
                          </div>
                        </td>

                        <td style={{ textAlign: 'right', fontWeight: '600' }}>
                          {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {curr.symbol}
                        </td>

                        <td className="print-hide td-action-col">
                          <button className="btn-icon btn-sm text-danger" onClick={() => removeItem(item.id)} title="Supprimer la ligne">
                            <Trash2 size={13}/>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add row button */}
              <div className="table-bottom-actions print-hide">
                <button className="btn btn-sm btn-secondary" onClick={addItem}>
                  <Plus size={14}/> Ajouter une ligne
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setIsCatalogModalOpen(true)}>
                  <Sparkles size={14}/> Depuis le catalogue
                </button>
              </div>

              {/* Summary & Totals Calculation Block */}
              <div className="totals-summary-container">
                <div className="totals-card">
                  {/* Subtotal HT */}
                  <div className="total-row">
                    <span className="total-label">Total HT :</span>
                    <span className="total-val">
                      {subtotalHT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {curr.symbol}
                    </span>
                  </div>

                  {/* Discount */}
                  <div className="total-row editable-row">
                    <span className="total-label">
                      Remise (<input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={discountPercent} 
                        onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
                        className="inline-number-input"
                      /> %) :
                    </span>
                    <span className="total-val text-danger">
                      - {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {curr.symbol}
                    </span>
                  </div>

                  {/* VAT / TVA */}
                  <div className="total-row editable-row">
                    <span className="total-label">
                      TVA (<input 
                        type="number" 
                        min="0" 
                        step="any"
                        value={taxRate} 
                        onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="inline-number-input"
                      /> %) :
                    </span>
                    <span className="total-val">
                      {tvaAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {curr.symbol}
                    </span>
                  </div>

                  {/* Total TTC */}
                  <div className="total-row total-ttc-row">
                    <span className="total-label">Total TTC :</span>
                    <span className="total-val">
                      {totalTTC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {curr.symbol}
                    </span>
                  </div>

                  {/* Down Payment / Acompte */}
                  <div className="total-row editable-row">
                    <span className="total-label">Acompte déjà versé :</span>
                    <div className="total-input-wrapper">
                      <input 
                        type="number" 
                        step="any"
                        value={downPayment} 
                        onChange={e => setDownPayment(parseFloat(e.target.value) || 0)}
                        className="inline-number-input-lg text-right"
                      />
                      <span className="currency-tag-sm">{curr.symbol}</span>
                    </div>
                  </div>

                  {/* Net to Pay / Balance Due */}
                  <div className="total-row net-to-pay-row">
                    <span className="total-label">NET À PAYER :</span>
                    <span className="total-val-highlight">
                      {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {curr.symbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Draggable Amount in Letters Box */}
            <DraggableBox 
              item={amountBox} 
              updateItem={(id, changes) => setAmountBox({ ...amountBox, ...changes })}
              canvasRef={invoiceRef}
              setSnapLines={setSnapLines}
              allItems={allCanvasItems}
              showGrid={showGrid}
            >
              <div className="amount-letters-card">
                <span className="amount-letters-title">Montant arrêté en toutes lettres :</span>
                <p className="amount-letters-text">{ttcInLetters || '—'}</p>
              </div>
            </DraggableBox>

            {/* Draggable Bank Details Box */}
            <DraggableBox 
              item={bankDetailsBox} 
              updateItem={(id, changes) => setBankDetailsBox({ ...bankDetailsBox, ...changes })}
              canvasRef={invoiceRef}
              setSnapLines={setSnapLines}
              allItems={allCanvasItems}
              showGrid={showGrid}
            >
              <textarea 
                className="bank-details-textarea"
                value={bankDetailsBox.text}
                onChange={e => setBankDetailsBox({ ...bankDetailsBox, text: e.target.value })}
                placeholder="Coordonnées bancaires, IBAN, instructions de paiement..."
              />
            </DraggableBox>

            {/* Draggable Signature Box */}
            <DraggableBox 
              item={signatureBox} 
              updateItem={(id, changes) => setSignatureBox({ ...signatureBox, ...changes })}
              canvasRef={invoiceRef}
              setSnapLines={setSnapLines}
              allItems={allCanvasItems}
              showGrid={showGrid}
            >
              <div className="signature-card">
                <input 
                  type="text" 
                  className="signature-label-input"
                  value={signatureLabel}
                  onChange={e => setSignatureLabel(e.target.value)}
                  placeholder="Date et Signature"
                />
                <div className="signature-stamp-area">
                  <span className="stamp-placeholder print-hide">Emplacement signature / cachet</span>
                </div>
              </div>
            </DraggableBox>
          </div>
        </main>
      </div>

      {/* Client Address Book Modal */}
      <ClientManagerModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSelectClient={handleApplyClient}
      />

      {/* Item & Product Catalog Modal */}
      <ItemCatalogModal 
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        onInsertItem={handleInsertCatalogItem}
        currencySymbol={curr.symbol}
      />
    </div>
  );
}
