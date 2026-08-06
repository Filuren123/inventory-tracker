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
import LoginPage from './components/user/login';
import LogoutPage from './components/user/logout';
import CategoryManager from './components/categories/categoryManager/CategoryManager';
import InventoryAdd from './components/inventory/inventoryAddRem/inventoryAdd/InventoryAdd';

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
						element={<InventoryAdd />}
					/>
					<Route
						path="remItem"
						element={<InventoryRem />}
					/>
					<Route
						path="login"
						element={<LoginPage />}
					/>
					<Route
						path="logout"
						element={<LogoutPage />}
					/>
					<Route
						path="categorymanager"
						element={<CategoryManager />}
					/>
				</Routes>
			</Router>
		</>
	)
}

export default App
