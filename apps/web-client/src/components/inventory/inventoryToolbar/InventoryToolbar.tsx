const InventoryToolbar = (
    { searchTerm, onSearchChange, filters, onFilterChange, sort, onSortChange }: any ) => {
  return (
    <div className="toolbar">
      <input
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search by name, brand, EAN..."
      />
      <select onChange={e => onFilterChange('storageLocation', e.target.value || undefined)}>
        <option value="">All locations</option>
        {/* options */}
      </select>
      <select onChange={e => onSortChange({ key: e.target.value, dir: 'asc' })}>
        <option value="product.name">Name</option>
        <option value="expiry_date">Expiry date</option>
        <option value="quantity">Quantity</option>
      </select>
    </div>
  );
}

export default InventoryToolbar;