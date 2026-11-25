import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { addCategory, removeCategory, updateCategory } from '../../api/categories';
import { errorMessage } from '../../api/axios';
import { useCategories } from '../../hooks/useCategories';
import { categoryPath, subtreeIds, type CategoryNode } from '../../utils/categoryTree';
import CategorySelect from '../common/CategorySelect';
import './CategoryManager.css';

type Mode = 'add' | 'rename' | 'move' | 'delete';
type Editing = { id: number; mode: Mode } | null;

const CategoryManager = () => {
    const { categories, tree, flat, loading, error, reload } = useCategories();
    const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
    const [editing, setEditing] = useState<Editing>(null);
    const [rootName, setRootName] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const run = async (action: () => Promise<unknown>) => {
        setBusy(true);
        setActionError(null);
        try {
            await action();
            setEditing(null);
            await reload();
            return true;
        } catch (err) {
            setActionError(errorMessage(err, 'Could not save the change'));
            return false;
        } finally {
            setBusy(false);
        }
    };

    const addRoot = async (e: FormEvent) => {
        e.preventDefault();
        if (!rootName.trim()) return;
        if (await run(() => addCategory(rootName.trim(), null))) setRootName('');
    };

    const toggle = (id: number) =>
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    // Only render nodes whose ancestors are all expanded.
    const visible = useMemo(() => {
        const out: CategoryNode[] = [];
        const walk = (nodes: CategoryNode[]) =>
            nodes.forEach((n) => {
                out.push(n);
                if (!collapsed.has(n.id)) walk(n.children);
            });
        walk(tree);
        return out;
    }, [tree, collapsed]);

    return (
        <section className="manage-section" aria-labelledby="categories-title">
            <div className="manage-section-header">
                <div>
                    <h2 id="categories-title">Categories</h2>
                    <p>Organise products in a tree. Filtering by a category includes its subcategories.</p>
                </div>
                {tree.length > 0 && (
                    <div className="cat-expand">
                        <button type="button" className="btn btn-sm" onClick={() => setCollapsed(new Set())}>
                            Expand all
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => setCollapsed(new Set(flat.filter((c) => c.children.length).map((c) => c.id)))}
                        >
                            Collapse all
                        </button>
                    </div>
                )}
            </div>

            <form className="cat-add-root" onSubmit={addRoot}>
                <div className="field">
                    <label htmlFor="root-name">New top-level category</label>
                    <input
                        id="root-name"
                        className="input"
                        placeholder="e.g. Skafferi"
                        value={rootName}
                        onChange={(e) => setRootName(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={!rootName.trim() || busy}>
                    Add
                </button>
            </form>

            {actionError && <div className="alert alert-error cat-error">{actionError}</div>}
            {error && <div className="alert alert-error cat-error">{error}</div>}

            <section className="panel" aria-label="Category tree">
                {loading && tree.length === 0 && (
                    <div className="empty-state">
                        <span className="spinner" aria-label="Loading" />
                    </div>
                )}
                {!loading && tree.length === 0 && !error && (
                    <div className="empty-state">No categories yet. Add a top-level category above.</div>
                )}
                <ul className="cat-tree" role="tree">
                    {visible.map((node) => (
                        <CategoryRow
                            key={node.id}
                            node={node}
                            isCollapsed={collapsed.has(node.id)}
                            onToggle={() => toggle(node.id)}
                            editing={editing?.id === node.id ? editing.mode : null}
                            setMode={(mode) => {
                                setActionError(null);
                                setEditing(mode ? { id: node.id, mode } : null);
                            }}
                            busy={busy}
                            moveOptions={flat}
                            blockedForMove={editing?.id === node.id && editing.mode === 'move' ? subtreeIds(categories, node.id) : undefined}
                            parentLabel={node.parent_id != null ? categoryPath(categories, node.parent_id) : null}
                            onAddChild={(name) => run(() => addCategory(name, node.id)).then((ok) => {
                                if (ok) setCollapsed((prev) => { const n = new Set(prev); n.delete(node.id); return n; });
                            })}
                            onRename={(name) => run(() => updateCategory(node.id, { name }))}
                            onMove={(parentId) => run(() => updateCategory(node.id, { parent_id: parentId }))}
                            onDelete={() => run(() => removeCategory(node.id))}
                        />
                    ))}
                </ul>
            </section>
        </section>
    );
};

interface RowProps {
    node: CategoryNode;
    isCollapsed: boolean;
    onToggle: () => void;
    editing: Mode | null;
    setMode: (mode: Mode | null) => void;
    busy: boolean;
    moveOptions: CategoryNode[];
    blockedForMove?: Set<number>;
    parentLabel: string | null;
    onAddChild: (name: string) => void;
    onRename: (name: string) => void;
    onMove: (parentId: number | null) => void;
    onDelete: () => void;
}

const CategoryRow = ({
    node,
    isCollapsed,
    onToggle,
    editing,
    setMode,
    busy,
    moveOptions,
    blockedForMove,
    parentLabel,
    onAddChild,
    onRename,
    onMove,
    onDelete,
}: RowProps) => {
    const [text, setText] = useState('');
    const [target, setTarget] = useState<number | null>(node.parent_id);
    const [menuOpen, setMenuOpen] = useState(false); // phones only: actions behind "⋯"
    const hasChildren = node.children.length > 0;

    const open = (mode: Mode) => {
        setText(mode === 'rename' ? node.name : '');
        setTarget(node.parent_id);
        setMode(editing === mode ? null : mode);
    };

    const submitText = (e: FormEvent) => {
        e.preventDefault();
        const value = text.trim();
        if (!value) return;
        if (editing === 'add') onAddChild(value);
        if (editing === 'rename') onRename(value);
    };

    const indent = { '--depth': node.depth } as CSSProperties;

    return (
        <li
            className={`cat-row ${editing ? 'cat-row--editing' : ''} ${menuOpen || editing ? 'cat-row--menu' : ''}`}
            role="treeitem"
            aria-expanded={hasChildren ? !isCollapsed : undefined}
            style={indent}
        >
            <div className="cat-line">
                <button
                    type="button"
                    className="cat-toggle"
                    onClick={onToggle}
                    disabled={!hasChildren}
                    aria-label={isCollapsed ? `Expand ${node.name}` : `Collapse ${node.name}`}
                >
                    {hasChildren && <span className={`cat-chevron ${isCollapsed ? '' : 'cat-chevron--open'}`}>›</span>}
                </button>
                <span className="cat-name">{node.name}</span>
                {hasChildren && <span className="cat-count">{node.children.length}</span>}
                <button
                    type="button"
                    className="btn btn-ghost btn-sm cat-more"
                    aria-expanded={menuOpen || Boolean(editing)}
                    aria-label={`Actions for ${node.name}`}
                    onClick={() => {
                        if (editing) setMode(null);
                        setMenuOpen((o) => !(o || editing));
                    }}
                >
                    ⋯
                </button>
                <div className="cat-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => open('add')} aria-pressed={editing === 'add'}>
                        Add sub
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => open('rename')} aria-pressed={editing === 'rename'}>
                        Rename
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => open('move')} aria-pressed={editing === 'move'}>
                        Move
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm cat-delete" onClick={() => open('delete')} aria-pressed={editing === 'delete'}>
                        Delete
                    </button>
                </div>
            </div>

            {(editing === 'add' || editing === 'rename') && (
                <form className="cat-edit" onSubmit={submitText}>
                    <input
                        className="input"
                        autoFocus
                        aria-label={editing === 'add' ? `New subcategory of ${node.name}` : `New name for ${node.name}`}
                        placeholder={editing === 'add' ? `Subcategory of ${node.name}` : 'Category name'}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Escape' && setMode(null)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>
                        {editing === 'add' ? 'Add' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-sm" onClick={() => setMode(null)}>
                        Cancel
                    </button>
                </form>
            )}

            {editing === 'move' && (
                <form
                    className="cat-edit"
                    onSubmit={(e) => {
                        e.preventDefault();
                        onMove(target);
                    }}
                >
                    <CategorySelect
                        id={`move-${node.id}`}
                        aria-label={`New parent for ${node.name}`}
                        options={moveOptions}
                        value={target}
                        onChange={setTarget}
                        emptyLabel="Top level"
                        disabledIds={blockedForMove}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={busy || target === node.parent_id}>
                        Move
                    </button>
                    <button type="button" className="btn btn-sm" onClick={() => setMode(null)}>
                        Cancel
                    </button>
                </form>
            )}

            {editing === 'delete' && (
                <div className="cat-edit cat-edit--delete">
                    <span>
                        Delete <strong>{node.name}</strong>?{' '}
                        {hasChildren ? 'Its subcategories and products' : 'Its products'} move to{' '}
                        <strong>{parentLabel ?? 'the top level / uncategorised'}</strong>.
                    </span>
                    <div className="cat-edit-buttons">
                        <button type="button" className="btn btn-danger btn-sm" onClick={onDelete} disabled={busy}>
                            Delete
                        </button>
                        <button type="button" className="btn btn-sm" onClick={() => setMode(null)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </li>
    );
};

export default CategoryManager;
