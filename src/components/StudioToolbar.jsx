import React from 'react';
import { 
  FileText, Palette, Layout, Globe, Users, Package, 
  RotateCcw, RotateCw, Grid, Download, Save, Upload, 
  RefreshCw, FileCheck, Layers, Type, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { 
  DOCUMENT_TYPES, PAPER_FORMATS, THEMES, ACCENT_COLORS, 
  CURRENCIES, FONT_FAMILIES, WATERMARKS 
} from '../types/documentTypes';

export default function StudioToolbar({
  documentType,
  setDocumentType,
  paperFormat,
  setPaperFormat,
  theme,
  setTheme,
  accentColor,
  setAccentColor,
  fontFamily,
  setFontFamily,
  currency,
  setCurrency,
  wordsLanguage,
  setWordsLanguage,
  watermark,
  setWatermark,
  showGrid,
  setShowGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenClients,
  onOpenCatalog,
  onConvertToInvoice,
  onResetProject,
  onSaveProject,
  onLoadProjectClick,
  onExportPDF,
  onExportPNG,
  isExporting
}) {
  const currentDocConfig = DOCUMENT_TYPES[documentType] || DOCUMENT_TYPES.facture;

  return (
    <header className="studio-top-toolbar print-hide">
      {/* Top Main Bar */}
      <div className="toolbar-main-row">
        {/* Brand & Document Switcher */}
        <div className="toolbar-left-group">
          <div className="brand-badge">
            <Sparkles size={18} className="brand-icon" />
            <span className="brand-title">Facture Studio Pro</span>
          </div>

          <div className="doc-type-selector-wrapper">
            <FileText size={16} className="text-muted" />
            <select 
              value={documentType} 
              onChange={e => setDocumentType(e.target.value)}
              className="doc-type-select"
            >
              {Object.values(DOCUMENT_TYPES).map(dt => (
                <option key={dt.id} value={dt.id}>
                  {dt.label} ({dt.labelEn})
                </option>
              ))}
            </select>
          </div>

          {documentType === 'devis' && (
            <button 
              className="btn btn-xs btn-convert" 
              onClick={onConvertToInvoice}
              title="Convertir ce devis en facture immédiatement"
            >
              <FileCheck size={14} /> Convertir en Facture
            </button>
          )}
        </div>

        {/* Quick Tools & Modals */}
        <div className="toolbar-center-group">
          {/* History Undo / Redo */}
          <div className="btn-group">
            <button 
              className="btn-icon" 
              onClick={onUndo} 
              disabled={!canUndo} 
              title="Annuler (Ctrl+Z)"
            >
              <RotateCcw size={16} />
            </button>
            <button 
              className="btn-icon" 
              onClick={onRedo} 
              disabled={!canRedo} 
              title="Rétablir (Ctrl+Y)"
            >
              <RotateCw size={16} />
            </button>
          </div>

          <div className="divider-vertical"></div>

          {/* Grid Snap */}
          <button 
            className={`btn btn-sm ${showGrid ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Afficher / Masquer la grille d'alignement"
          >
            <Grid size={15} /> Grille
          </button>

          {/* Client Address Book */}
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onOpenClients}
            title="Ouvrir le carnet d'adresses clients"
          >
            <Users size={15} /> Clients
          </button>

          {/* Products Catalog */}
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onOpenCatalog}
            title="Insérer un article ou prestation depuis le catalogue"
          >
            <Package size={15} /> Articles
          </button>
        </div>

        {/* Project & Export Actions */}
        <div className="toolbar-right-group">
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onResetProject} 
            title="Nouveau document vierge"
          >
            <RefreshCw size={15} /> Nouveau
          </button>

          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onSaveProject} 
            title="Sauvegarder le projet (.invoice)"
          >
            <Save size={15} /> Sauvegarder
          </button>

          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onLoadProjectClick} 
            title="Charger un projet (.invoice)"
          >
            <Upload size={15} /> Ouvrir
          </button>

          <div className="divider-vertical"></div>

          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onExportPNG} 
            disabled={isExporting}
            title="Exporter comme image PNG HD"
          >
            <Download size={15} /> PNG
          </button>

          <button 
            className="btn btn-sm btn-primary-gradient" 
            onClick={onExportPDF} 
            disabled={isExporting}
            title="Générer le PDF vectoriel haute définition"
          >
            <Download size={16} /> Exporter PDF
          </button>
        </div>
      </div>

      {/* Secondary Controls Bar: Format, Theme, Colors, Fonts, Currencies, Watermark */}
      <div className="toolbar-secondary-row">
        {/* Paper Format */}
        <div className="control-chip">
          <Layout size={14} className="text-muted" />
          <span className="chip-label">Format :</span>
          <select 
            value={paperFormat} 
            onChange={e => setPaperFormat(e.target.value)}
            className="chip-select"
          >
            {Object.values(PAPER_FORMATS).map(pf => (
              <option key={pf.id} value={pf.id}>{pf.label}</option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div className="control-chip">
          <Palette size={14} className="text-muted" />
          <span className="chip-label">Thème :</span>
          <select 
            value={theme} 
            onChange={e => setTheme(e.target.value)}
            className="chip-select"
          >
            {Object.values(THEMES).map(th => (
              <option key={th.id} value={th.id}>{th.name}</option>
            ))}
          </select>
        </div>

        {/* Accent Color */}
        <div className="control-chip color-chip">
          <span className="chip-label">Couleur :</span>
          <div className="color-dots-group">
            {ACCENT_COLORS.map(c => (
              <button
                key={c.value}
                className={`color-dot ${accentColor === c.value ? 'active' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setAccentColor(c.value)}
                title={c.name}
              />
            ))}
            <input 
              type="color" 
              value={accentColor} 
              onChange={e => setAccentColor(e.target.value)}
              className="color-picker-input"
              title="Couleur personnalisée"
            />
          </div>
        </div>

        {/* Typography */}
        <div className="control-chip">
          <Type size={14} className="text-muted" />
          <span className="chip-label">Police :</span>
          <select 
            value={fontFamily} 
            onChange={e => setFontFamily(e.target.value)}
            className="chip-select"
          >
            {FONT_FAMILIES.map(f => (
              <option key={f.value} value={f.value}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div className="control-chip">
          <Globe size={14} className="text-muted" />
          <span className="chip-label">Devise :</span>
          <select 
            value={currency} 
            onChange={e => setCurrency(e.target.value)}
            className="chip-select"
          >
            {Object.values(CURRENCIES).map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.code} ({curr.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Number to Words Language */}
        <div className="control-chip">
          <span className="chip-label">Lettres :</span>
          <select 
            value={wordsLanguage} 
            onChange={e => setWordsLanguage(e.target.value)}
            className="chip-select"
          >
            <option value="fr">Français (FR)</option>
            <option value="en">English (EN)</option>
            <option value="ar">العربية (AR)</option>
            <option value="es">Español (ES)</option>
          </select>
        </div>

        {/* Watermark */}
        <div className="control-chip">
          <Layers size={14} className="text-muted" />
          <span className="chip-label">Tampon :</span>
          <select 
            value={watermark} 
            onChange={e => setWatermark(e.target.value)}
            className="chip-select"
          >
            {WATERMARKS.map(w => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
