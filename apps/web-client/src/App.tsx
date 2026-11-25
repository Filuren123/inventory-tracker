import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import InventoryPage from './components/inventory/InventoryPage';
import InventoryAdd from './components/inventory/InventoryAdd';
import InventoryRemove from './components/inventory/InventoryRemove';
import ManagePage from './components/manage/ManagePage';
import ProductsPage from './components/product/ProductsPage';
import LoginPage from './components/user/LoginPage';
import LogoutPage from './components/user/LogoutPage';

// Page paths must not collide with API prefixes (/inventory, /product, /categories, /locations, /user):
// in production the server would answer a page refresh with API JSON instead of the app.
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="login" element={<LoginPage />} />
                <Route element={<AppShell />}>
                    <Route index element={<InventoryPage />} />
                    <Route path="add" element={<InventoryAdd />} />
                    <Route path="remove" element={<InventoryRemove />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="manage" element={<ManagePage />} />
                    <Route path="logout" element={<LogoutPage />} />
                    {/* old paths */}
                    <Route path="addItem" element={<Navigate to="/add" replace />} />
                    <Route path="remItem" element={<Navigate to="/remove" replace />} />
                    <Route path="categorymanager" element={<Navigate to="/manage" replace />} />
                    <Route path="manage-categories" element={<Navigate to="/manage" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
