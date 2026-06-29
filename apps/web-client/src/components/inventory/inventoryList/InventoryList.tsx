import "./InventoryList.css";
import type { RichInventory } from "../../../model/richInventory";
import InventoryItem from "../inventoryItem/InventoryItem";

interface Props {
    items: RichInventory[];
}

const InventoryList = ({items}: Props) => {
    console.log(items)
    
    return (
        <>
            {items.map(item => <InventoryItem key={item.id} item={item} />)}
        </>
    )
}

export default InventoryList;