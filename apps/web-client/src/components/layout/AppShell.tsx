import { NavLink, Outlet } from 'react-router-dom';
import { BoxIcon, ListIcon, LogoutIcon, MinusIcon, PlusIcon, TreeIcon } from './Icons';
import './AppShell.css';

const NAV = [
    { to: '/', label: 'Inventory', icon: <ListIcon />, end: true },
    { to: '/add', label: 'Add', icon: <PlusIcon /> },
    { to: '/remove', label: 'Remove', icon: <MinusIcon /> },
    { to: '/products', label: 'Products', icon: <BoxIcon /> },
    { to: '/manage', label: 'Manage', icon: <TreeIcon /> },
];

/** Top bar on wider screens; bottom tab bar on phones. */
const AppShell = () => (
    <div className="shell">
        <header className="topbar">
            <div className="topbar-inner">
                <NavLink to="/" className="brand">
                    Inventory
                </NavLink>
                <nav className="topnav" aria-label="Main">
                    {NAV.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.end} className="topnav-link">
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <NavLink to="/logout" className="btn btn-ghost btn-sm logout-link" title="Log out">
                    <LogoutIcon />
                    <span className="logout-text">Log out</span>
                </NavLink>
            </div>
        </header>

        <main className="shell-main">
            <Outlet />
        </main>

        <nav className="tabbar" aria-label="Main">
            {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className="tab">
                    {item.icon}
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    </div>
);

export default AppShell;
