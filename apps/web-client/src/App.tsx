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
					<Route
						path="login"
						element={<LoginPage />}
					/>
					<Route
						path="logout"
						element={<LogoutPage />}
					/>
				</Routes>
			</Router>
		</>
	)
}

export default App
