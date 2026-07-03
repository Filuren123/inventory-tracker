import { useRef, useEffect, useState } from 'react';
import './InventoryRem.css';
import { getAllInventory, deleteInventory } from '../../../../api/inventory';
import type { RichInventory } from '../../../../model/richInventory';

// ---------------------------------------------------------------------------
// Toast State
// ---------------------------------------------------------------------------
interface ToastState {
  message: string;
  visible: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const InventoryRem = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allInventory, setAllInventory] = useState<RichInventory[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<RichInventory[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search bar and fetch all data on mount
  useEffect(() => {
    searchInputRef.current?.focus();
    fetchInitialInventory();
  }, []);

  const showToast = (message: string, duration = 4000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setToast(null), 300); // allow fade-out animation
    }, duration);
  };

  const fetchInitialInventory = async () => {
    setLoading(true);
    try {
      const data = await getAllInventory();
      setAllInventory(data);
      setFilteredInventory(data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      showToast('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering based on the loaded inventory
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    const lowerQuery = value.toLowerCase().trim();
    
    if (!lowerQuery) {
      setFilteredInventory(allInventory);
      return;
    }

    const filtered = allInventory.filter(item => {
      // Accessing the nested product object
      const nameMatch = (item.product?.name || '').toLowerCase().includes(lowerQuery);
      const brandMatch = (item.product?.brand || '').toLowerCase().includes(lowerQuery);
      const eanMatch = (item.product?.ean_code || '').toLowerCase().includes(lowerQuery);
      
      return nameMatch || brandMatch || eanMatch;
    });

    setFilteredInventory(filtered);
  };

  const handleRemove = async (item: RichInventory) => {
    // Optimistically remove from UI using 'id' instead of 'inventory_id'
    setAllInventory(prev => prev.filter(inv => inv.id !== item.id));
    setFilteredInventory(prev => prev.filter(inv => inv.id !== item.id));
    
    try {
      // Ensure the ID is passed as a string
      await deleteInventory(String(item.id));
      showToast(`Removed ${item.product?.name || 'item'} from inventory`);
    } catch (err) {
      console.error('Failed to remove item:', err);
      showToast(`Error removing ${item.product?.name || 'item'}`);
      // Revert UI if it failed by refetching
      fetchInitialInventory(); 
    }
  };

  // Helper to safely format dates coming from JSON
  const formatExpiry = (dateVal: Date | string | null) => {
    if (!dateVal) return null;
    return String(dateVal).split('T')[0]; // Grabs YYYY-MM-DD from an ISO string
  };

  return (
    <>
      {/* ── Toast ── */}
      {toast && (
        <div className={`ap-toast ap-toast--remove ${toast.visible ? 'ap-toast--in' : 'ap-toast--out'}`}>
          <span className="ap-toast-icon">✓</span>
          {toast.message}
        </div>
      )}

      <div className="ap-page">
        <div className="ap-panel ap-panel--full">
          <div className="ap-panel-header ap-panel-header--center">
            <span className="ap-eyebrow">Inventory Management</span>
            <h1 className="ap-title">Remove items</h1>
            <p className="ap-subtitle">Search by EAN, Name, or Brand and click a card to remove it from stock.</p>
          </div>

          {/* ── Big Search Bar ── */}
          <div className="ap-search-container">
            <svg className="ap-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="ap-input-big"
              placeholder="Search EAN, product name, or brand..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {loading && <div className="ap-loading-spinner" />}
          </div>

          <div className="ap-divider" />

          {/* ── Results Grid ── */}
          {filteredInventory.length === 0 && !loading ? (
            <div className="ap-empty-state">
              <p>{searchQuery ? "No matching items found." : "No inventory items found."}</p>
            </div>
          ) : (
            <div className="ap-inventory-grid">
              {filteredInventory.map(item => (
                <div 
                  key={item.id} 
                  className="ap-card" 
                  onClick={() => handleRemove(item)}
                  title={`Click to remove ${item.product?.name || 'this item'}`}
                >
                  <div className="ap-card-top">
                    <span className="ap-card-brand">{item.product?.brand || 'No Brand'}</span>
                    <span className="ap-card-location">{item.storage_location}</span>
                  </div>
                  
                  <h3 className="ap-card-title">{item.product?.name || 'Unknown Product'}</h3>
                  <p className="ap-card-ean">{item.product?.ean_code}</p>

                  <div className="ap-card-expiry-box">
                    <span className="ap-card-expiry-label">EXPIRY DATE</span>
                    <span className={`ap-card-expiry-date ${!item.expiry_date ? 'ap-card-expiry-none' : ''}`}>
                      {formatExpiry(item.expiry_date) || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="ap-card-action">
                    <span>Click to remove</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InventoryRem;