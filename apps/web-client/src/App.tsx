import './App.css'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import InventoryPage from './components/inventory/inventoryPage/InventoryPage';
import InventoryAddRem from './components/inventory/inventoryAddRem/InventoryAddRem';
import InventoryRem from './components/inventory/inventoryAddRem/inventoryRem/InventoryRem';

function App() {
	return (
		<>
			<Router>
				<Routes>
					<Route
						path="/"
						element={<InventoryPage />}
					/>
					<Route
						path="addItem"
						element={<InventoryAddRem />}
					/>
					<Route
						path="remItem"
						element={<InventoryRem />}
					/>
				</Routes>
			</Router>
		</>
	)
}

export default App
