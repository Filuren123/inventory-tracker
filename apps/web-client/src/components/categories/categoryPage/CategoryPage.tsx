import { useState, useMemo } from 'react';
import type { Category } from '../../../model/category.interface';
import './CategoryPage.css';
import { addCategory, removeCategory } from '../../../api/categories';

interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildTree(categories: Category[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  categories.forEach(cat => map.set(cat.id, { ...cat, children: [] }));
  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parent_id === null) {
      roots.push(node);
    } else {
      map.get(cat.parent_id)?.children.push(node);
    }
  });

  return roots;
}

interface NodeProps {
  node: CategoryNode;
  selectedId: number | null;
  expandedIds: Set<number>;
  isEditing: boolean;
  addingToId: number | null;
  removingId: number | null;
  newCategoryName: string;
  onSelect: (id: number) => void;
  onToggleExpand: (id: number) => void;
  onAddClick: (id: number) => void;
  onRemoveClick: (id: number) => void;
  onConfirmAdd: (parentId: number) => void;
  onConfirmRemove: (id: number) => void;
  onCancelAction: () => void;
  onNameChange: (value: string) => void;
  depth: number;
}

const Node = ({
  node, selectedId, expandedIds, isEditing,
  addingToId, removingId, newCategoryName,
  onSelect, onToggleExpand, onAddClick, onRemoveClick,
  onConfirmAdd, onConfirmRemove, onCancelAction, onNameChange,
  depth
}: NodeProps) => {
  const isSelected = selectedId === node.id;
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isAddingHere = addingToId === node.id;
  const isRemovingHere = removingId === node.id;

  return (
    <li className="cat-item">
      <div
        className={`cat-row ${isSelected ? 'cat-row--selected' : ''}`}
        style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
      >
        <button
          className="cat-arrow"
          onClick={() => hasChildren && onToggleExpand(node.id)}
          tabIndex={hasChildren ? 0 : -1}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren && (
            <span className={`cat-arrow-icon ${isExpanded ? 'cat-arrow-icon--open' : ''}`}>
              ›
            </span>
          )}
        </button>

        <button className="cat-label" onClick={() => onSelect(node.id)}>
          {node.name}
        </button>

        {isSelected && !isEditing && <span className="cat-indicator" />}

        {isEditing && (
          <div className="cat-edit-actions">
            <button
              className={`cat-edit-btn cat-edit-btn--add ${isAddingHere ? 'cat-edit-btn--active' : ''}`}
              onClick={() => isAddingHere ? onCancelAction() : onAddClick(node.id)}
              title="Add subcategory"
            >
              +
            </button>
            <button
              className={`cat-edit-btn cat-edit-btn--remove ${isRemovingHere ? 'cat-edit-btn--active' : ''}`}
              onClick={() => isRemovingHere ? onCancelAction() : onRemoveClick(node.id)}
              title="Remove category"
            >
              −
            </button>
          </div>
        )}
      </div>

      {isAddingHere && (
        <div className="cat-add-form" style={{ paddingLeft: `${1.25 + depth * 1.25}rem` }}>
          <input
            className="cat-add-input"
            type="text"
            placeholder="Subcategory name..."
            value={newCategoryName}
            onChange={e => onNameChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onConfirmAdd(node.id);
              if (e.key === 'Escape') onCancelAction();
            }}
            autoFocus
          />
          <button
            className="cat-confirm-btn cat-confirm-btn--add"
            onClick={() => onConfirmAdd(node.id)}
            disabled={!newCategoryName.trim()}
          >
            Add
          </button>
          <button className="cat-confirm-btn cat-confirm-btn--cancel" onClick={onCancelAction}>
            Cancel
          </button>
        </div>
      )}

      {isRemovingHere && (
        <div className="cat-remove-confirm" style={{ paddingLeft: `${1.25 + depth * 1.25}rem` }}>
          <span className="cat-remove-warning">Remove "{node.name}"?</span>
          <button
            className="cat-confirm-btn cat-confirm-btn--remove"
            onClick={() => onConfirmRemove(node.id)}
          >
            Remove
          </button>
          <button className="cat-confirm-btn cat-confirm-btn--cancel" onClick={onCancelAction}>
            Cancel
          </button>
        </div>
      )}

      {hasChildren && isExpanded && (
        <ul className="cat-children">
          {node.children.map(child => (
            <Node
              key={child.id}
              node={child}
              selectedId={selectedId}
              expandedIds={expandedIds}
              isEditing={isEditing}
              addingToId={addingToId}
              removingId={removingId}
              newCategoryName={newCategoryName}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onAddClick={onAddClick}
              onRemoveClick={onRemoveClick}
              onConfirmAdd={onConfirmAdd}
              onConfirmRemove={onConfirmRemove}
              onCancelAction={onCancelAction}
              onNameChange={onNameChange}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

interface Props {
  categories: Category[];
  selectedCategoryId: number | null;
  onCategorySelect: (id: number | null) => void;
  onRefresh: () => void;
}

const CategoryPage = ({ categories, selectedCategoryId, onCategorySelect, onRefresh }: Props) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [addingToId, setAddingToId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const tree = useMemo(() => buildTree(categories), [categories]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelect = (id: number) => {
    if (!isEditing) onCategorySelect(selectedCategoryId === id ? null : id);
  };

  const cancelAction = () => {
    setAddingToId(null);
    setRemovingId(null);
    setNewCategoryName('');
  };

  const handleConfirmAdd = async (parentId: number) => {
    if (!newCategoryName.trim()) return;
    await addCategory(newCategoryName.trim(), parentId === -1 ? undefined : parentId);
    cancelAction();
    onRefresh();
  };

  const handleConfirmRemove = async (id: number) => {
    await removeCategory(id);
    cancelAction();
    onRefresh();
  };

  const toggleEditMode = () => {
    setIsEditing(prev => !prev);
    cancelAction();
  };

  const sharedNodeProps = {
    selectedId: selectedCategoryId,
    expandedIds,
    isEditing,
    addingToId,
    removingId,
    newCategoryName,
    onSelect: handleSelect,
    onToggleExpand: toggleExpand,
    onAddClick: (id: number) => { cancelAction(); setAddingToId(id); },
    onRemoveClick: (id: number) => { cancelAction(); setRemovingId(id); },
    onConfirmAdd: handleConfirmAdd,
    onConfirmRemove: handleConfirmRemove,
    onCancelAction: cancelAction,
    onNameChange: setNewCategoryName,
  };

  return (
    <nav className="cat-sidebar">
      <div className="cat-header">
        <p className="cat-title">Categories</p>
        <button
          className={`cat-edit-toggle ${isEditing ? 'cat-edit-toggle--active' : ''}`}
          onClick={toggleEditMode}
          title={isEditing ? 'Done editing' : 'Edit categories'}
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>

      {isEditing && (
        <div className="cat-add-root">
          {addingToId === -1 ? (
            <div className="cat-add-form cat-add-form--root">
              <input
                className="cat-add-input"
                type="text"
                placeholder="Category name..."
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleConfirmAdd(-1);
                  if (e.key === 'Escape') cancelAction();
                }}
                autoFocus
              />
              <button
                className="cat-confirm-btn cat-confirm-btn--add"
                onClick={() => handleConfirmAdd(-1)}
                disabled={!newCategoryName.trim()}
              >
                Add
              </button>
              <button className="cat-confirm-btn cat-confirm-btn--cancel" onClick={cancelAction}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="cat-add-root-btn"
              onClick={() => { cancelAction(); setAddingToId(-1); }}
            >
              + Add root category
            </button>
          )}
        </div>
      )}

      <ul className="cat-list">
        {tree.map(node => (
          <Node
            key={node.id}
            node={node}
            depth={0}
            {...sharedNodeProps}
          />
        ))}
      </ul>
    </nav>
  );
};

export default CategoryPage;