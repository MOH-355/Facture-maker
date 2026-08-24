import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, Edit2, Check, X, Download, Upload, Tag } from 'lucide-react';

const STORAGE_KEY = 'invoiceApp_productCatalog';

const defaultCatalog = [
  { id: 'p1', name: 'Développement Web Frontend & Backend', category: 'Services', price: 1200, unit: 'jour/forfait' },
  { id: 'p2', name: 'Hébergement Cloud Haute Disponibilité (Annuel)', category: 'Hébergement', price: 250, unit: 'an' },
  { id: 'p3', name: 'Maintenance & Support Technique Mensuel', category: 'Support', price: 150, unit: 'mois' },
  { id: 'p4', name: 'Création d’Identité Visuelle & Charte Graphique', category: 'Design', price: 800, unit: 'prestation' },
  { id: 'p5', name: 'Audit de Sécurité & Optimisation SEO', category: 'Conseil', price: 650, unit: 'audit' }
];

export default function ItemCatalogModal({ isOpen, onClose, onInsertItem, currencySymbol = '€' }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultCatalog;
    } catch {
      return defaultCatalog;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Services',
    price: 0,
    unit: 'unité'
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  if (!isOpen) return null;

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenForm = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: 'Services',
        price: 100,
        unit: 'prestation'
      });
    }
    setIsFormOpen(true);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      setItems(items.map(it => it.id === editingItem.id ? { ...formData, id: it.id } : it));
    } else {
      setItems([...items, { ...formData, id: 'item_' + Date.now() }]);
    }
    setIsFormOpen(false);
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('Supprimer cet article du catalogue ?')) {
      setItems(items.filter(it => it.id !== id));
    }
  };

  const handleApply = (item) => {
    onInsertItem({
      desc: item.name + (item.unit ? ` (${item.unit})` : ''),
      price: parseFloat(item.price) || 0,
      qty: 1
    });
    onClose();
  };

  const handleExportCatalog = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'catalogue_produits_services.json';
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handleImportCatalog = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (Array.isArray(imported)) {
            setItems(imported);
            alert(`${imported.length} articles importés avec succès !`);
          }
        } catch {
          alert('Erreur lors de la lecture du fichier JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Package size={22} className="modal-icon text-primary" />
            <div>
              <h3>Catalogue de Produits & Services</h3>
              <p className="modal-subtitle">Insérez rapidement vos prestations et tarifs dans vos documents</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20}/></button>
        </div>

        {!isFormOpen ? (
          <>
            <div className="modal-actions-bar">
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon"/>
                <input 
                  type="text" 
                  placeholder="Rechercher une prestation ou un article..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="clear-btn"><X size={14}/></button>}
              </div>

              <div className="action-buttons-group">
                <button className="btn btn-primary" onClick={() => handleOpenForm()}>
                  <Plus size={16}/> Nouvel Article
                </button>
                <button className="btn btn-secondary" onClick={handleExportCatalog} title="Exporter en JSON">
                  <Download size={15}/>
                </button>
                <label className="btn btn-secondary cursor-pointer" title="Importer depuis JSON">
                  <Upload size={15}/>
                  <input type="file" accept=".json" onChange={handleImportCatalog} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div className="catalog-list-container">
              {filteredItems.length === 0 ? (
                <div className="empty-state">
                  <Package size={40} className="text-muted"/>
                  <p>Aucun article trouvé dans le catalogue.</p>
                  <button className="btn btn-sm btn-primary mt-2" onClick={() => handleOpenForm()}>
                    Ajouter une prestation
                  </button>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div key={item.id} className="catalog-card">
                    <div className="catalog-info">
                      <div className="catalog-header">
                        <h4>{item.name}</h4>
                        {item.category && <span className="badge-category">{item.category}</span>}
                      </div>
                      <div className="catalog-price-tag">
                        <span className="price-amount">{item.price} {currencySymbol}</span>
                        {item.unit && <span className="price-unit">/ {item.unit}</span>}
                      </div>
                    </div>

                    <div className="client-actions">
                      <button 
                        className="btn btn-sm btn-apply" 
                        onClick={() => handleApply(item)}
                        title="Ajouter comme nouvelle ligne dans le tableau"
                      >
                        <Plus size={14}/> Insérer
                      </button>
                      <button className="btn-icon btn-sm" onClick={() => handleOpenForm(item)} title="Modifier">
                        <Edit2 size={14}/>
                      </button>
                      <button className="btn-icon btn-sm text-danger" onClick={() => handleDeleteItem(item.id)} title="Supprimer">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSaveItem} className="modal-form">
            <h4 className="form-heading">{editingItem ? 'Modifier l’Article' : 'Ajouter au Catalogue'}</h4>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Description / Intitulé du produit ou service *</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Développement site web sur mesure" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Catégorie</label>
                <input 
                  type="text" 
                  placeholder="ex: Prestations, Matériel, Conseil" 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Prix Unitaire HT ({currencySymbol}) *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  placeholder="0.00" 
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group full-width">
                <label>Unité de facturation</label>
                <input 
                  type="text" 
                  placeholder="ex: heure, jour, forfait, licence, unité" 
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="form-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                {editingItem ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
