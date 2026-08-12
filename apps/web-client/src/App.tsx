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
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';

function App() {
	return (
		<>
			<Router>
				<AuthProvider>
					<Routes>
						{/* Public routes */}
						<Route
							path="login"
							element={<LoginPage />}
						/>

						{/* Protected routes */}
						<Route element={<ProtectedRoute />}>
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
								path="logout"
								element={<LogoutPage />}
							/>
							<Route
								path="categorymanager"
								element={<CategoryManager />}
							/>
						</Route>
					</Routes>
				</AuthProvider>
			</Router>
		</>
	)
}

export default App
