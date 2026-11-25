// Small stroke icons used by the navigation. 20px, inherit currentColor.
const base = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
};

export const ListIcon = () => (
    <svg {...base}>
        <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
);

export const PlusIcon = () => (
    <svg {...base}>
        <path d="M12 5v14M5 12h14" />
    </svg>
);

export const MinusIcon = () => (
    <svg {...base}>
        <path d="M5 12h14" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
);

export const TreeIcon = () => (
    <svg {...base}>
        <path d="M4 4h6v5H4zM14 15h6v5h-6zM14 4h6v5h-6zM7 9v8.5h7M7 6.5h7" />
    </svg>
);

export const LogoutIcon = () => (
    <svg {...base}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
);
