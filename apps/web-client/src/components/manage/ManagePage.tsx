import CategoryManager from '../categories/CategoryManager';
import LocationManager from '../locations/LocationManager';
import './ManagePage.css';

/** Organise the things products and items refer to: categories and storage locations. */
const ManagePage = () => (
    <div className="page">
        <div className="page-header">
            <div>
                <h1>Manage</h1>
                <p>Categories and storage locations.</p>
            </div>
            <nav className="manage-jump" aria-label="Sections">
                <a href="#categories-title" className="btn btn-sm">
                    Categories
                </a>
                <a href="#locations-title" className="btn btn-sm">
                    Locations
                </a>
            </nav>
        </div>
        <CategoryManager />
        <LocationManager />
    </div>
);

export default ManagePage;
