import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Image as ImageIcon, Save, Upload, Type, AlignLeft, AlignCenter, AlignRight, Bold, Underline, Columns, FilePlus } from 'lucide-react';
import writtenNumber from 'written-number';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Default State Values
const defaultLogo = { id: 'logo', src: null, x: 50, y: 50, w: 200, h: 100 };
const defaultSignature = { id: 'signature', x: 450, y: 800, w: 250, h: 150 };
const defaultAmountBox = { id: 'amountLetters', x: 50, y: 800, w: 350, h: 100 };
const defaultInvoiceMeta = {
  number: 'INV-2023-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
};
const defaultTableHeaders = {
  desc: 'Description',
  qty: 'Qté',
  price: 'Prix Unitaire HT',
  total: 'Montant HT'
};
const defaultItems = [
  { id: 1, desc: 'Service de développement web', qty: 1, price: 1500, customData: {} },
  { id: 2, desc: 'Hébergement annuel', qty: 1, price: 200, customData: {} },
  { id: 3, desc: 'Maintenance technique', qty: 12, price: 50, customData: {} },
  { id: 4, desc: '', qty: 0, price: 0, customData: {} },
  { id: 5, desc: '', qty: 0, price: 0, customData: {} },
  { id: 6, desc: '', qty: 0, price: 0, customData: {} }
];
const defaultCustomTextboxes = [
  {
    id: 'company-info',
    x: 450, y: 50, w: 250, h: 120,
    text: 'VOTRE ENTREPRISE\n123 Rue de la Paix\n75000 Paris, France\ncontact@entreprise.com\n+33 1 23 45 67 89\nSIRET: 123 456 789 00012',
    align: 'right',
    fontSize: 14, color: '#1f2937', isBold: false, isUnderline: false
  },
  {
    id: 'client-info',
    x: 50, y: 180, w: 250, h: 100,
    text: 'Facturé à :\nNOM DU CLIENT\n456 Avenue des Champs\n69000 Lyon, France\nclient@email.com',
    align: 'left',
    fontSize: 14, color: '#1f2937', isBold: false, isUnderline: false
  }
];

// Helper to load state
const loadSavedData = () => {
  try {
    const saved = localStorage.getItem('invoiceAppSavedState');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse saved state", e);
  }
  return null;
};

// Reusable Draggable & Resizable Box
const DraggableBox = ({ item, updateItem, removeItem, children, isLogo, canvasRef, setSnapLines, allItems }) => {
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

        const SNAP_THRESHOLD = 15;

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
            else if (Math.abs(targetX - 50) < SNAP_THRESHOLD) { targetX = 50; snapX = 50; }
            else if (Math.abs((targetX + startW) - (canvasWidth - 50)) < SNAP_THRESHOLD) { targetX = canvasWidth - startW - 50; snapX = canvasWidth - 50; }
          }
        }

        setSnapLines({ x: snapX, y: snapY });
        updateItem(item.id, { x: targetX, y: targetY });
      } else if (type === 'resize') {
        updateItem(item.id, { w: Math.max(50, startW + dx), h: Math.max(30, startH + dy) });
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
          <button className={item.isBold ? 'active' : ''} onClick={() => updateItem(item.id, { isBold: !item.isBold })}><Bold size={14}/></button>
          <button className={item.isUnderline ? 'active' : ''} onClick={() => updateItem(item.id, { isUnderline: !item.isUnderline })}><Underline size={14}/></button>
          
          <div className="controls-divider"></div>
          
          <input 
            type="color" 
            value={item.color || '#1f2937'} 
            onChange={(e) => updateItem(item.id, { color: e.target.value })} 
            title="Couleur du texte"
          />
          <input 
            type="number" 
            style={{ width: '50px' }}
            value={item.fontSize || 14} 
            onChange={(e) => updateItem(item.id, { fontSize: parseInt(e.target.value) || 14 })}
            title="Taille de la police"
          />

          <div className="controls-divider"></div>

          <button className={item.align === 'left' ? 'active' : ''} onClick={() => updateItem(item.id, { align: 'left' })}><AlignLeft size={14}/></button>
          <button className={item.align === 'center' ? 'active' : ''} onClick={() => updateItem(item.id, { align: 'center' })}><AlignCenter size={14}/></button>
          <button className={item.align === 'right' ? 'active' : ''} onClick={() => updateItem(item.id, { align: 'right' })}><AlignRight size={14}/></button>
          
          <div className="controls-divider"></div>
          
          {removeItem && <button onClick={() => removeItem(item.id)} style={{ color: 'var(--danger-color)' }}><Trash2 size={14}/></button>}
        </div>
      )}
      
      {isLogo && active && (
        <div className="controls print-hide" onClick={(e) => e.stopPropagation()}>
           <button onClick={() => removeItem(item.id)} style={{ color: 'var(--danger-color)' }}><Trash2 size={14}/></button>
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

  const [logo, setLogo] = useState(savedData?.logo || defaultLogo);
  const [invoiceMeta, setInvoiceMeta] = useState(savedData?.invoiceMeta || defaultInvoiceMeta);
  const [tableHeaders, setTableHeaders] = useState(savedData?.tableHeaders || defaultTableHeaders);
  const [customCols, setCustomCols] = useState(savedData?.customCols || []);
  const [items, setItems] = useState(savedData?.items || defaultItems);
  const [taxRate, setTaxRate] = useState(savedData?.taxRate !== undefined ? savedData.taxRate : 20);
  const [customTextboxes, setCustomTextboxes] = useState(savedData?.customTextboxes || defaultCustomTextboxes);
  const [signatureLabel, setSignatureLabel] = useState(savedData?.signatureLabel || 'Signature');
  const [signatureBox, setSignatureBox] = useState(savedData?.signatureBox || defaultSignature);
  const [amountBox, setAmountBox] = useState(savedData?.amountBox || defaultAmountBox);
  const [tableMarginTop, setTableMarginTop] = useState(savedData?.tableMarginTop ?? 300);
  const [customImages, setCustomImages] = useState(savedData?.customImages || []);
  
  // Table Resizing State
  const [colWidths, setColWidths] = useState(savedData?.colWidths || { desc: 350, qty: 80, price: 100, total: 100 });
  const [rowHeights, setRowHeights] = useState(savedData?.rowHeights || {});

  const [snapLines, setSnapLines] = useState({ x: null, y: null });
  const [ttcInLetters, setTtcInLetters] = useState('');
  
  const invoiceRef = useRef(null);
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const addImageInputRef = useRef(null);

  // Auto-Save to Local Storage
  useEffect(() => {
    const data = { logo, invoiceMeta, items, taxRate, customTextboxes, customImages, tableHeaders, signatureLabel, customCols, colWidths, rowHeights, signatureBox, amountBox, tableMarginTop };
    localStorage.setItem('invoiceAppSavedState', JSON.stringify(data));
  }, [logo, invoiceMeta, items, taxRate, customTextboxes, customImages, tableHeaders, signatureLabel, customCols, colWidths, rowHeights, signatureBox, amountBox, tableMarginTop]);

  // Calculations
  const totalHT = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const tvaAmount = totalHT * (taxRate / 100);
  const totalTTC = totalHT + tvaAmount;

  useEffect(() => {
    try {
      const integerPart = Math.floor(totalTTC);
      const decimalPart = Math.round((totalTTC - integerPart) * 100);
      
      let text = writtenNumber(integerPart, { lang: 'fr' });
      text += ' euro' + (integerPart > 1 ? 's' : '');
      
      if (decimalPart > 0) {
        text += ' et ' + writtenNumber(decimalPart, { lang: 'fr' }) + ' centime' + (decimalPart > 1 ? 's' : '');
      }
      
      setTtcInLetters(text.charAt(0).toUpperCase() + text.slice(1));
    } catch (e) {
      setTtcInLetters('');
    }
  }, [totalTTC]);

  useEffect(() => {
    const textareas = document.querySelectorAll('textarea.td-input');
    textareas.forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  });

  // Handlers
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogo({ ...logo, src: event.target.result });
      reader.readAsDataURL(file);
    }
  };

  const updateLogo = (id, changes) => setLogo({ ...logo, ...changes });
  const removeLogo = () => setLogo({ ...logo, src: null });
  
  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImages([...customImages, {
          id: 'img_' + Date.now(),
          src: event.target.result,
          x: invoiceRef.current ? invoiceRef.current.offsetWidth / 2 - 75 : 50,
          y: 100,
          w: 150,
          h: 150
        }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset input so same file can be selected again
  };

  const updateCustomImage = (id, changes) => setCustomImages(customImages.map(img => img.id === id ? { ...img, ...changes } : img));
  const removeCustomImage = (id) => setCustomImages(customImages.filter(img => img.id !== id));

  const addItem = () => setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0, customData: {} }]);
  const removeItem = (id) => setItems(items.filter(item => item.id !== id));
  
  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const updateItemCustomData = (itemId, colId, value) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, customData: { ...item.customData, [colId]: value } };
      }
      return item;
    }));
  };

  const addColumn = () => setCustomCols([...customCols, { id: 'col_' + Date.now(), name: 'Nouvelle Colonne' }]);
  const removeColumn = (id) => setCustomCols(customCols.filter(c => c.id !== id));
  const updateColumn = (id, name) => setCustomCols(customCols.map(c => c.id === id ? { ...c, name } : c));

  const addTextbox = () => {
    setCustomTextboxes([...customTextboxes, { 
      id: Date.now().toString(), 
      x: invoiceRef.current ? invoiceRef.current.offsetWidth/2 - 100 : 50, 
      y: 100, 
      w: 200, h: 50,
      text: 'Nouveau texte',
      align: 'center',
      fontSize: 14,
      color: '#1f2937',
      isBold: false,
      isUnderline: false
    }]);
  };

  const updateTextbox = (id, changes) => setCustomTextboxes(customTextboxes.map(tb => tb.id === id ? { ...tb, ...changes } : tb));
  const removeTextbox = (id) => setCustomTextboxes(customTextboxes.filter(tb => tb.id !== id));

  // Reset / New Project
  const resetProject = () => {
    if (window.confirm("Êtes-vous sûr de vouloir commencer un nouveau projet ? Toutes les modifications non sauvegardées seront perdues.")) {
      localStorage.removeItem('invoiceAppSavedState');
      window.location.reload();
    }
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

    const columnsList = [...customCols.map(c => c.id), 'desc', 'qty', 'price', 'total'];
    const nextColId = columnsList[columnsList.indexOf(colId) + 1];
    let startNextWidth = nextColId ? (colWidths[nextColId] || 100) : null;

    const onPointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      
      setColWidths(prev => {
        const newWidth = Math.max(40, startWidth + dx);
        const actualDx = newWidth - startWidth;

        if (nextColId) {
          const newNextWidth = Math.max(40, startNextWidth - actualDx);
          const finalDx = startNextWidth - newNextWidth;
          return { 
             ...prev, 
             [colId]: startWidth + finalDx,
             [nextColId]: newNextWidth
          };
        } else {
          return { ...prev, [colId]: newWidth };
        }
      });
    };
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleRowResize = (e, rowId) => {
    e.stopPropagation();
    e.preventDefault();
    let startY = e.clientY;
    let startHeight = rowHeights[rowId] || 40; 

    const onPointerMove = (moveEvent) => {
      const dy = moveEvent.clientY - startY;
      setRowHeights(prev => ({ ...prev, [rowId]: Math.max(30, startHeight + dy) }));
    };
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Export & Save
  const exportPDF = async () => {
    if (!invoiceRef.current) return;
    document.body.click(); 
    invoiceRef.current.classList.add('is-exporting');
    
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Facture_${invoiceMeta.number}.pdf`);
      } finally {
        invoiceRef.current.classList.remove('is-exporting');
      }
    }, 100);
  };

  const exportPNG = async () => {
    if (!invoiceRef.current) return;
    document.body.click();
    invoiceRef.current.classList.add('is-exporting');
    
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
        const link = document.createElement('a');
        link.download = `Facture_${invoiceMeta.number}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } finally {
        invoiceRef.current.classList.remove('is-exporting');
      }
    }, 100);
  };

  const saveProject = () => {
    const data = { logo, invoiceMeta, items, taxRate, customTextboxes, customImages, tableHeaders, signatureLabel, customCols, colWidths, rowHeights, signatureBox, amountBox, tableMarginTop };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `Project_${invoiceMeta.number}.invoice`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const loadProject = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.invoiceMeta) setInvoiceMeta(data.invoiceMeta);
          if (data.items) setItems(data.items.map(i => ({...i, customData: i.customData || {}})));
          if (data.taxRate !== undefined) setTaxRate(data.taxRate);
          if (data.customTextboxes) setCustomTextboxes(data.customTextboxes);
          if (data.customImages) setCustomImages(data.customImages);
          if (data.logo) setLogo(data.logo);
          if (data.tableHeaders) setTableHeaders(data.tableHeaders);
          if (data.signatureLabel) setSignatureLabel(data.signatureLabel);
          if (data.customCols) setCustomCols(data.customCols);
          if (data.colWidths) setColWidths(data.colWidths);
          if (data.rowHeights) setRowHeights(data.rowHeights);
          if (data.signatureBox) setSignatureBox(data.signatureBox);
          if (data.amountBox) setAmountBox(data.amountBox);
          if (data.tableMarginTop !== undefined) setTableMarginTop(data.tableMarginTop);
        } catch (err) {
          alert("Fichier de projet invalide.");
        }
      };
      reader.readAsText(file);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  const allItems = [logo, ...customTextboxes, ...customImages];

  return (
    <div className="app-container">
      <div className="toolbar">
        <button className="btn" onClick={resetProject}>
          <FilePlus size={16} /> Nouveau Projet
        </button>
        <button className="btn" onClick={() => fileInputRef.current.click()}>
          <ImageIcon size={16} /> Changer Logo
        </button>
        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden-file-input" accept="image/*" />
        
        <button className="btn" onClick={() => addImageInputRef.current.click()}>
          <ImageIcon size={16} /> Ajouter Image
        </button>
        <input type="file" ref={addImageInputRef} onChange={handleAddImage} className="hidden-file-input" accept="image/*" />

        <button className="btn" onClick={addTextbox}>
          <Type size={16} /> Ajouter Texte Libre
        </button>

        <div className="toolbar-divider"></div>

        <button className="btn" onClick={addColumn}>
          <Columns size={16} /> Ajouter une colonne
        </button>
        <button className="btn" onClick={addItem}>
          <Plus size={16} /> Ajouter une ligne
        </button>

        <div style={{ flex: 1 }}></div>

        <button className="btn" onClick={() => jsonInputRef.current.click()}>
          <Upload size={16} /> Charger Projet
        </button>
        <input type="file" ref={jsonInputRef} onChange={loadProject} className="hidden-file-input" accept=".invoice,.json" />
        
        <button className="btn" onClick={saveProject}>
          <Save size={16} /> Sauvegarder Projet
        </button>
        <button className="btn" onClick={exportPNG}>
          <ImageIcon size={16} /> Exporter PNG
        </button>
        <button className="btn btn-primary" onClick={exportPDF}>
          <Download size={16} /> Exporter PDF
        </button>
      </div>

      <div className="workspace">
        <div className="invoice-page" ref={invoiceRef}>
          
          {/* Snapping Overlays */}
          {snapLines.x !== null && <div className="snap-line-v" style={{ left: snapLines.x }}></div>}
          {snapLines.y !== null && <div className="snap-line-h" style={{ top: snapLines.y }}></div>}

          {/* LOGO */}
          <DraggableBox item={logo} updateItem={updateLogo} removeItem={removeLogo} isLogo={true} canvasRef={invoiceRef} setSnapLines={setSnapLines} allItems={allItems}>
            {logo.src ? (
              <img src={logo.src} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div className="logo-content" onClick={() => fileInputRef.current.click()}>
                <span>Cliquez pour ajouter Logo</span>
              </div>
            )}
          </DraggableBox>

          {/* Custom Images */}
          {customImages.map(img => (
            <DraggableBox key={img.id} item={img} updateItem={updateCustomImage} removeItem={removeCustomImage} isLogo={true} canvasRef={invoiceRef} setSnapLines={setSnapLines} allItems={allItems}>
              <img src={img.src} alt="Custom" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </DraggableBox>
          ))}

          {/* Draggable Textboxes */}
          {customTextboxes.map(tb => (
            <DraggableBox key={tb.id} item={tb} updateItem={updateTextbox} removeItem={removeTextbox} isLogo={false} canvasRef={invoiceRef} setSnapLines={setSnapLines} allItems={allItems}>
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <textarea 
                  className="editable-text export-hide"
                  style={{ 
                    width: '100%', height: '100%', resize: 'none', 
                    textAlign: tb.align || 'left', 
                    fontWeight: tb.isBold || String(tb.id).includes('info') ? 'bold' : 'normal',
                    textDecoration: tb.isUnderline ? 'underline' : 'none',
                    color: tb.color || '#1f2937',
                    fontSize: `${tb.fontSize || 14}px`
                  }}
                  value={tb.text} 
                  onChange={e => updateTextbox(tb.id, { text: e.target.value })}
                />
                <div 
                  className="export-show"
                  style={{
                    width: '100%', height: '100%',
                    textAlign: tb.align || 'left', 
                    fontWeight: tb.isBold || String(tb.id).includes('info') ? 'bold' : 'normal',
                    textDecoration: tb.isUnderline ? 'underline' : 'none',
                    color: tb.color || '#1f2937',
                    fontSize: `${tb.fontSize || 14}px`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    padding: '2px 4px',
                    overflow: 'hidden'
                  }}
                >
                  {tb.text}
                </div>
              </div>
            </DraggableBox>
          ))}

          {/* Table Area */}
          <div className="table-area" style={{ marginTop: `${tableMarginTop}px` }}>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div style={{ padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', width: '300px' }}>
                <h3 style={{ fontSize: '14px', color: '#000', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>Détails Facture</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#000', fontWeight: 'bold' }}>Numéro:</span>
                  <input className="editable-text" style={{ width: '150px', textAlign: 'right', fontWeight: 'bold', color: '#000' }} 
                    value={invoiceMeta.number} onChange={e => setInvoiceMeta({...invoiceMeta, number: e.target.value})} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#000', fontWeight: 'bold' }}>Date:</span>
                  <input type="date" className="editable-text" style={{ width: '150px', textAlign: 'right', fontWeight: 'bold', color: '#000' }} 
                    value={invoiceMeta.date} onChange={e => setInvoiceMeta({...invoiceMeta, date: e.target.value})} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#000', fontWeight: 'bold' }}>Échéance:</span>
                  <input type="date" className="editable-text" style={{ width: '150px', textAlign: 'right', fontWeight: 'bold', color: '#000' }} 
                    value={invoiceMeta.dueDate} onChange={e => setInvoiceMeta({...invoiceMeta, dueDate: e.target.value})} />
                </div>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  {customCols.map(col => (
                    <th key={col.id} style={{ position: 'relative', width: colWidths[col.id] || 100 }}>
                      <input className="th-input" value={col.name} onChange={(e) => updateColumn(col.id, e.target.value)} />
                      <button className="print-hide" onClick={() => removeColumn(col.id)} style={{ position: 'absolute', right: '5px', top: '10px', background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><Trash2 size={12}/></button>
                      <div className="resizer col-resizer print-hide" onPointerDown={(e) => handleColResize(e, col.id)} />
                    </th>
                  ))}
                  <th className="col-desc" style={{ position: 'relative', width: colWidths['desc'] || 350 }}>
                    <input className="th-input" value={tableHeaders.desc} onChange={(e) => setTableHeaders({...tableHeaders, desc: e.target.value})} />
                    <div className="resizer col-resizer print-hide" onPointerDown={(e) => handleColResize(e, 'desc')} />
                  </th>
                  <th className="col-qty" style={{ position: 'relative', width: colWidths['qty'] || 80 }}>
                    <input className="th-input cell-center" value={tableHeaders.qty} onChange={(e) => setTableHeaders({...tableHeaders, qty: e.target.value})} />
                    <div className="resizer col-resizer print-hide" onPointerDown={(e) => handleColResize(e, 'qty')} />
                  </th>
                  <th className="col-price" style={{ position: 'relative', width: colWidths['price'] || 100 }}>
                    <input className="th-input cell-center" value={tableHeaders.price} onChange={(e) => setTableHeaders({...tableHeaders, price: e.target.value})} />
                    <div className="resizer col-resizer print-hide" onPointerDown={(e) => handleColResize(e, 'price')} />
                  </th>
                  <th className="col-total" style={{ position: 'relative', width: colWidths['total'] || 100 }}>
                    <input className="th-input cell-right" value={tableHeaders.total} onChange={(e) => setTableHeaders({...tableHeaders, total: e.target.value})} />
                  </th>
                  <th className="col-actions print-hide" style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ height: rowHeights[item.id] || 40 }}>
                    {customCols.map(col => (
                      <td key={col.id}>
                        <textarea 
                          className="td-input export-hide" 
                          value={item.customData?.[col.id] || ''} 
                          onChange={(e) => updateItemCustomData(item.id, col.id, e.target.value)} 
                        />
                        <div className="export-show" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 'inherit', fontFamily: 'inherit' }}>
                          {item.customData?.[col.id] || ''}
                        </div>
                        <div className="resizer row-resizer print-hide" onPointerDown={(e) => handleRowResize(e, item.id)} />
                      </td>
                    ))}
                    <td>
                      <textarea 
                        className="td-input export-hide" 
                        value={item.desc} 
                        onChange={(e) => updateItem(item.id, 'desc', e.target.value)} 
                        placeholder="Description..."
                      />
                      <div className="export-show" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 'inherit', fontFamily: 'inherit' }}>
                        {item.desc}
                      </div>
                      <div className="resizer row-resizer print-hide" onPointerDown={(e) => handleRowResize(e, item.id)} />
                    </td>
                    <td className="cell-center">
                      <input 
                        type="number" 
                        className="td-input cell-center" 
                        value={item.qty} 
                        onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} 
                      />
                      <div className="resizer row-resizer print-hide" onPointerDown={(e) => handleRowResize(e, item.id)} />
                    </td>
                    <td className="cell-center">
                      <input 
                        type="number" 
                        className="td-input cell-center" 
                        value={item.price} 
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} 
                      />
                      <div className="resizer row-resizer print-hide" onPointerDown={(e) => handleRowResize(e, item.id)} />
                    </td>
                    <td className="cell-right">
                      {formatCurrency(item.qty * item.price)}
                      <div className="resizer row-resizer print-hide" onPointerDown={(e) => handleRowResize(e, item.id)} />
                    </td>
                    <td className="col-actions print-hide" style={{ textAlign: 'center' }}>
                      <button className="btn btn-danger btn-small" onClick={() => removeItem(item.id)}>
                        <Trash2 size={14} />
                      </button>
                      <div className="resizer row-resizer print-hide" onPointerDown={(e) => handleRowResize(e, item.id)} />
                    </td>
                  </tr>
                ))}
                <tr className="totals-row">
                  <td colSpan={customCols.length + 3} style={{ textAlign: "right", paddingRight: "10px", verticalAlign: "middle" }}>
                    <input className="td-input" style={{textAlign: "right", fontWeight: "bold", padding: 0}} value="Total HT (TTH)" readOnly />
                  </td>
                  <td className="cell-right" style={{ padding: '10px', verticalAlign: 'middle', fontWeight: "bold" }}>{formatCurrency(totalHT)}</td>
                  <td className="col-actions print-hide"></td>
                </tr>
                <tr className="totals-row">
                  <td colSpan={customCols.length + 3} style={{ textAlign: "right", paddingRight: "10px", verticalAlign: "middle", fontWeight: "bold" }}>
                    <div className="export-hide">
                      TVA(<input type="number" className="tva-input" style={{width: '45px', display: 'inline-block', textAlign: 'center', margin: '0', padding: '0'}} value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} />%)
                    </div>
                    <div className="export-show">
                      TVA({taxRate}%)
                    </div>
                  </td>
                  <td className="cell-right" style={{ padding: '10px', verticalAlign: 'middle', fontWeight: "bold" }}>{formatCurrency(tvaAmount)}</td>
                  <td className="col-actions print-hide"></td>
                </tr>
                <tr className="totals-row">
                  <td colSpan={customCols.length + 3} style={{ textAlign: "right", paddingRight: "10px", verticalAlign: "middle" }}>
                    <input className="td-input" style={{textAlign: "right", fontWeight: "bold", padding: 0}} value="Total TTC" readOnly />
                  </td>
                  <td className="cell-right" style={{ padding: '10px', verticalAlign: 'middle', fontWeight: "bold" }}>{formatCurrency(totalTTC)}</td>
                  <td className="col-actions print-hide"></td>
                </tr>
              </tbody>
            </table>

            <div 
              className="print-hide" 
              style={{ height: '20px', cursor: 'row-resize', background: 'rgba(37, 99, 235, 0.05)', border: '1px dashed rgba(37, 99, 235, 0.3)', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', color: 'var(--primary-color)', marginTop: '20px' }} 
              onPointerDown={handleTableMarginResize}
            >
               ↕ Glisser pour ajuster la position verticale du tableau
            </div>

          </div>

          {/* Floating Amount In Letters */}
          <DraggableBox item={amountBox} updateItem={(id, changes) => setAmountBox({ ...amountBox, ...changes })} isLogo={false} canvasRef={invoiceRef} setSnapLines={setSnapLines} allItems={allItems} removeItem={null}>
            <div className="amount-in-letters" style={{ width: '100%', height: '100%', margin: 0, padding: '10px' }}>
              <strong>Arrêté la présente facture à la somme de :</strong>
              <p>{ttcInLetters}</p>
            </div>
          </DraggableBox>

          {/* Floating Signature */}
          <DraggableBox item={signatureBox} updateItem={(id, changes) => setSignatureBox({ ...signatureBox, ...changes })} isLogo={false} canvasRef={invoiceRef} setSnapLines={setSnapLines} allItems={allItems} removeItem={null}>
            <div className="signature-box" style={{ width: '100%', height: '100%' }}>
              <input 
                className="editable-text" 
                style={{ textAlign: 'center' }} 
                value={signatureLabel} 
                onChange={(e) => setSignatureLabel(e.target.value)} 
              />
              <div className="signature-area" style={{ flex: 1 }}></div>
            </div>
          </DraggableBox>

        </div>
      </div>
    </div>
  );
}
