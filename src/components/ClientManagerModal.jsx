import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2, Edit2, Check, X, Download, Upload, Building, Mail, Phone, MapPin, Hash } from 'lucide-react';

const STORAGE_KEY = 'invoiceApp_clientAddressBook';

const defaultClients = [
  {
    id: 'c1',
    name: 'Entreprise ACME SARL',
    contactPerson: 'Jean Dupont',
    address: '15 Boulevard Haussmann, 75009 Paris',
    email: 'contact@acme-corp.com',
    phone: '+33 1 42 68 55 00',
    taxId: 'FR 32 123456789',
    notes: 'Client régulier - TVA standard'
  },
  {
    id: 'c2',
    name: 'Atlas Digital Solutions',
    contactPerson: 'Karim Bennani',
    address: 'Angle Bd Zerktouni & Roudani, Casablanca',
    email: 'info@atlasdigital.ma',
    phone: '+212 522 34 56 78',
    taxId: 'ICE: 001234567890001',
    notes: 'Règlement à 30 jours'
  },
  {
    id: 'c3',
    name: 'Global Tech Consulting',
    contactPerson: 'Sarah Jenkins',
    address: '742 Evergreen Terrace, London UK',
    email: 'accounts@globaltech.co.uk',
    phone: '+44 20 7946 0912',
    taxId: 'GB 987 6543 21',
    notes: 'Devise GBP / EUR'
  }
];

export default function ClientManagerModal({ isOpen, onClose, onSelectClient }) {
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultClients;
    } catch {
      return defaultClients;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    address: '',
    email: '',
    phone: '',
    taxId: '',
    notes: ''
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  if (!isOpen) return null;

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.taxId && c.taxId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenForm = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        contactPerson: '',
        address: '',
        email: '',
        phone: '',
        taxId: '',
        notes: ''
      });
    }
    setIsFormOpen(true);
  };

  const handleSaveClient = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...formData, id: c.id } : c));
    } else {
      setClients([...clients, { ...formData, id: 'client_' + Date.now() }]);
    }
    setIsFormOpen(false);
  };

  const handleDeleteClient = (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce client du carnet ?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  const handleApply = (client) => {
    let formattedText = `${client.name}`;
    if (client.contactPerson) formattedText += `\nAttn: ${client.contactPerson}`;
    if (client.address) formattedText += `\n${client.address}`;
    if (client.email) formattedText += `\n${client.email}`;
    if (client.phone) formattedText += `\n${client.phone}`;
    if (client.taxId) formattedText += `\nN° TVA / SIRET / ICE: ${client.taxId}`;

    onSelectClient(formattedText);
    onClose();
  };

  const handleExportClients = () => {
    const blob = new Blob([JSON.stringify(clients, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'clients_carnet_adresses.json';
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handleImportClients = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (Array.isArray(imported)) {
            setClients(imported);
            alert(`${imported.length} clients importés avec succès !`);
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
            <Users size={22} className="modal-icon text-primary" />
            <div>
              <h3>Carnet d'Adresses Clients</h3>
              <p className="modal-subtitle">Gérez et insérez vos clients réguliers en 1 clic</p>
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
                  placeholder="Rechercher par nom, email, TVA, ICE..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="clear-btn"><X size={14}/></button>}
              </div>

              <div className="action-buttons-group">
                <button className="btn btn-primary" onClick={() => handleOpenForm()}>
                  <Plus size={16}/> Nouveau Client
                </button>
                <button className="btn btn-secondary" onClick={handleExportClients} title="Exporter en JSON">
                  <Download size={15}/>
                </button>
                <label className="btn btn-secondary cursor-pointer" title="Importer depuis JSON">
                  <Upload size={15}/>
                  <input type="file" accept=".json" onChange={handleImportClients} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div className="clients-list-container">
              {filteredClients.length === 0 ? (
                <div className="empty-state">
                  <Building size={40} className="text-muted"/>
                  <p>Aucun client trouvé.</p>
                  <button className="btn btn-sm btn-primary mt-2" onClick={() => handleOpenForm()}>
                    Ajouter un client
                  </button>
                </div>
              ) : (
                filteredClients.map(client => (
                  <div key={client.id} className="client-card">
                    <div className="client-info">
                      <div className="client-header">
                        <h4>{client.name}</h4>
                        {client.contactPerson && <span className="badge-contact">{client.contactPerson}</span>}
                      </div>

                      <div className="client-details-grid">
                        {client.address && (
                          <div className="detail-item"><MapPin size={13}/> <span>{client.address}</span></div>
                        )}
                        {client.email && (
                          <div className="detail-item"><Mail size={13}/> <span>{client.email}</span></div>
                        )}
                        {client.phone && (
                          <div className="detail-item"><Phone size={13}/> <span>{client.phone}</span></div>
                        )}
                        {client.taxId && (
                          <div className="detail-item"><Hash size={13}/> <span>{client.taxId}</span></div>
                        )}
                      </div>

                      {client.notes && <div className="client-notes">{client.notes}</div>}
                    </div>

                    <div className="client-actions">
                      <button 
                        className="btn btn-sm btn-apply" 
                        onClick={() => handleApply(client)}
                        title="Appliquer les coordonnées à la facture"
                      >
                        <Check size={14}/> Insérer
                      </button>
                      <button className="btn-icon btn-sm" onClick={() => handleOpenForm(client)} title="Modifier">
                        <Edit2 size={14}/>
                      </button>
                      <button className="btn-icon btn-sm text-danger" onClick={() => handleDeleteClient(client.id)} title="Supprimer">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSaveClient} className="modal-form">
            <h4 className="form-heading">{editingClient ? 'Modifier le Client' : 'Ajouter un Nouveau Client'}</h4>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Nom de l'entreprise ou du client *</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: ACME Technologies SAS" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Personne de contact / Interlocuteur</label>
                <input 
                  type="text" 
                  placeholder="ex: M. Dupont" 
                  value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>N° TVA / SIRET / ICE / Identifiant Fiscal</label>
                <input 
                  type="text" 
                  placeholder="ex: FR 12 345678901 ou ICE: 00123..." 
                  value={formData.taxId}
                  onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email de facturation</label>
                <input 
                  type="email" 
                  placeholder="facturation@entreprise.com" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                <input 
                  type="text" 
                  placeholder="+33 1 23 45 67 89" 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label>Adresse postale complète</label>
                <textarea 
                  rows={2}
                  placeholder="123 Rue de la République, 75001 Paris" 
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label>Notes internes / Conditions particulières</label>
                <input 
                  type="text" 
                  placeholder="ex: Paiement par virement à 30 jours, remise 5%" 
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="form-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                {editingClient ? 'Enregistrer les modifications' : 'Ajouter le client'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
