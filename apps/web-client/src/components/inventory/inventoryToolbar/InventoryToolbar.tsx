import InventoryAddRem from "../inventoryAddRem/InventoryAddRem";
import "./InventoryToolbar.css";
import { useNavigate } from "react-router-dom";

const InventoryToolbar = (
    { searchTerm, onSearchChange, filters, onFilterChange, sort, onSortChange }: any ) => {

    const navigate = useNavigate();

    const handleRouteToAddItem = () => {
        navigate("/addItem");
    };

    const handleRouteToRemItem = () => {
      navigate("/remItem");
    }
      
  return (
    <div className="toolbar">
      <input
        type="text"
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
      <button onClick={handleRouteToAddItem} type="button">Add Item</button>
      <button onClick={handleRouteToRemItem} type="button">Remove Item</button>
    </div>
  );
}

export default InventoryToolbar;