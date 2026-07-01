// CategorySidebar.tsx
import { useState, useMemo } from 'react';
import type { Category } from '../../../model/category.interface';
import styles from './CategoryPage.module.css';

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
  onSelect: (id: number) => void;
  onToggleExpand: (id: number) => void;
  depth: number;
}

const Node = ({ node, selectedId, expandedIds, onSelect, onToggleExpand, depth }: NodeProps) => {
  const isSelected = selectedId === node.id;
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className={`${styles.row} ${isSelected ? styles.selected : ''}`}
        style={{ paddingLeft: `${0.5 + depth * 1}rem` }}
      >
        <button
          className={styles.arrow}
          onClick={() => hasChildren && onToggleExpand(node.id)}
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren ? (isExpanded ? '▾' : '▸') : ''}
        </button>
        <button className={styles.label} onClick={() => onSelect(node.id)}>
          {node.name}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul className={styles.children}>
          {node.children.map(child => (
            <Node
              key={child.id}
              node={child}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
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
}

const CategorySidebar = ({ categories, selectedCategoryId, onCategorySelect }: Props) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const tree = useMemo(() => buildTree(categories), [categories]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelect = (id: number) => {
    onCategorySelect(selectedCategoryId === id ? null : id);
  };

  return (
    <nav className={styles.sidebar}>
      <h3 className={styles.title}>Categories</h3>
      <ul className={styles.list}>
        {tree.map(node => (
          <Node
            key={node.id}
            node={node}
            selectedId={selectedCategoryId}
            expandedIds={expandedIds}
            onSelect={handleSelect}
            onToggleExpand={toggleExpand}
            depth={0}
          />
        ))}
      </ul>
    </nav>
  );
};

export default CategorySidebar;