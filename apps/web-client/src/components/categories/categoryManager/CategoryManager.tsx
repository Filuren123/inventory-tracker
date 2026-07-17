import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { GripVertical, ChevronRight, ChevronDown, Plus, X, Pencil, Check, FolderTree } from "lucide-react";


import { getAllCategories, addCategory, updateCategory, removeCategory } from "../../../api/categories";
import type { Category } from "../../../model/category.interface";
const api = {
  list: getAllCategories,
  create: addCategory,
  update: updateCategory,
  remove: removeCategory,
};


function buildTree(flat) {
  const byId: Map<string, Category> = new Map(flat.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    if (node.parent_id != null && byId.has(node.parent_id.toString())) {
      byId.get(node.parent_id.toString()).children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRec = (nodes) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

function isDescendant(flat, ancestorId, candidateId) {
  // is candidateId a descendant of (or equal to) ancestorId?
  if (ancestorId === candidateId) return true;
  const children = flat.filter((c) => c.parent_id === ancestorId);
  return children.some((c) => isDescendant(flat, c.id, candidateId));
}

// ── main component ──────────────────────────────────────────────────────

export default function CategoryManager() {
  const [flat, setFlat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null); // node currently hovered as drop target
  const [overRoot, setOverRoot] = useState(false);
  const [newName, setNewName] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // {id, name, childCount}

  const toastTimer = useRef(null);
  const showToast = useCallback((msg, tone = "ok") => {
    setToast({ msg, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.list();
      setFlat(rows);
      setExpanded(new Set(rows.filter((r) => r.parent_id == null).map((r) => r.id)));
    } catch (e) {
      setError(e.message || "Couldn't load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tree = useMemo(() => buildTree(flat), [flat]);

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const reparent = useCallback(
    async (childId, newParentId) => {
      const child = flat.find((c) => c.id === childId);
      if (!child) return;
      if (child.parent_id === newParentId) return;
      if (newParentId != null && isDescendant(flat, childId, newParentId)) {
        showToast("Can't move a category into its own branch", "error");
        return;
      }
      const prevFlat = flat;
      setFlat((prev) =>
        prev.map((c) => (c.id === childId ? { ...c, parent_id: newParentId } : c)),
      );
      if (newParentId != null) setExpanded((prev) => new Set(prev).add(newParentId));
      try {
        await api.update(childId, { parent_id: newParentId });
        showToast(`Moved "${child.name}"`);
      } catch (e) {
        setFlat(prevFlat);
        showToast(e.message || "Move failed", "error");
      }
    },
    [flat, showToast],
  );

  const rename = useCallback(
    async (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) {
        setEditingId(null);
        return;
      }
      const prevFlat = flat;
      setFlat((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
      setEditingId(null);
      try {
        await api.update(id, { name: trimmed });
        showToast("Renamed");
      } catch (e) {
        setFlat(prevFlat);
        showToast(e.message || "Rename failed", "error");
      }
    },
    [flat, showToast],
  );

  const addCategory = useCallback(
    async (parentId) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      try {
        const created = await api.create(trimmed, parentId ?? null);
        setFlat((prev) => [...prev, created]);
        if (parentId != null) setExpanded((prev) => new Set(prev).add(parentId));
        setNewName("");
        showToast(`Added "${created.name}"`);
      } catch (e) {
        showToast(e.message || "Couldn't add category", "error");
      }
    },
    [newName, showToast],
  );

  const requestDelete = (node) => {
    setConfirmDelete({ id: node.id, name: node.name, childCount: node.children.length });
  };

  const doDelete = useCallback(
    async (id, reassignChildrenToParent) => {
      const target = flat.find((c) => c.id === id);
      if (!target) return;
      const prevFlat = flat;
      setFlat((prev) => {
        const withReassign = reassignChildrenToParent
          ? prev.map((c) =>
              c.parent_id === id ? { ...c, parent_id: target.parent_id } : c,
            )
          : prev;
        return withReassign.filter((c) => c.id !== id);
      });
      setConfirmDelete(null);
      try {
        if (reassignChildrenToParent) {
          const kids = flat.filter((c) => c.parent_id === id);
          for (const kid of kids) {
            await api.update(kid.id, { parent_id: target.parent_id });
          }
        }
        await api.remove(id);
        showToast(`Deleted "${target.name}"`);
      } catch (e) {
        setFlat(prevFlat);
        showToast(e.message || "Delete failed", "error");
      }
    },
    [flat, showToast],
  );

  // ── drag handlers ──────────────────────────────────────────────────────

  const onDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(id));
  };
  const onDragEnd = () => {
    setDragId(null);
    setOverId(null);
    setOverRoot(false);
  };
  const onDragOverNode = (e, id) => {
    e.preventDefault();
    if (dragId == null || dragId === id) return;
    if (isDescendant(flat, dragId, id)) return; // can't drop onto own descendant
    e.dataTransfer.dropEffect = "move";
    setOverId(id);
    setOverRoot(false);
  };
  const onDropNode = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragId != null && dragId !== id) reparent(dragId, id);
    setDragId(null);
    setOverId(null);
  };
  const onDragOverRoot = (e) => {
    e.preventDefault();
    if (dragId == null) return;
    e.dataTransfer.dropEffect = "move";
    setOverRoot(true);
    setOverId(null);
  };
  const onDropRoot = (e) => {
    e.preventDefault();
    if (dragId != null) reparent(dragId, null);
    setDragId(null);
    setOverRoot(false);
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "#F5F3EE",
        fontFamily:
          "'Iowan Old Style', 'Palatino Linotype', Georgia, ui-serif, serif",
      }}
    >
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div
              className="text-xs tracking-[0.18em] uppercase mb-1"
              style={{ color: "#7A7568", fontFamily: "ui-sans-serif, system-ui" }}
            >
              Catalog structure
            </div>
            <h1 className="text-3xl" style={{ color: "#26251F", fontWeight: 600 }}>
              Categories
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "#57534A", fontFamily: "ui-sans-serif, system-ui" }}
            >
              Drag a category onto another to nest it. Drag to the shelf below to lift it back to the top.
            </p>
          </div>
          <FolderTree size={28} strokeWidth={1.5} style={{ color: "#3F6C51" }} />
        </div>

        {/* toast */}
        {toast && (
          <div
            className="mb-4 px-4 py-2 rounded-md text-sm"
            style={{
              fontFamily: "ui-sans-serif, system-ui",
              background: toast.tone === "error" ? "#F5E4DE" : "#E7EEE6",
              color: toast.tone === "error" ? "#8A3A20" : "#2E4E36",
              border: `1px solid ${toast.tone === "error" ? "#DCB3A0" : "#BBD0BB"}`,
            }}
          >
            {toast.msg}
          </div>
        )}

        {/* add new (root-level) */}
        <div
          className="flex items-center gap-2 mb-6 rounded-lg p-2"
          style={{ background: "#FFFFFF", border: "1px solid #E4E0D6" }}
        >
          <Plus size={16} style={{ color: "#7A7568" }} />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory(null)}
            placeholder="New top-level category…"
            className="flex-1 bg-transparent outline-none text-sm py-1.5"
            style={{ fontFamily: "ui-sans-serif, system-ui", color: "#26251F" }}
          />
          <button
            onClick={() => addCategory(null)}
            disabled={!newName.trim()}
            className="text-sm px-3 py-1.5 rounded-md transition-colors disabled:opacity-40"
            style={{
              fontFamily: "ui-sans-serif, system-ui",
              background: "#3F6C51",
              color: "#F5F3EE",
            }}
          >
            Add
          </button>
        </div>

        {/* body */}
        {loading ? (
          <div
            className="text-sm py-10 text-center"
            style={{ color: "#7A7568", fontFamily: "ui-sans-serif, system-ui" }}
          >
            Loading categories…
          </div>
        ) : error ? (
          <div
            className="text-sm py-10 text-center rounded-lg"
            style={{
              color: "#8A3A20",
              background: "#F5E4DE",
              fontFamily: "ui-sans-serif, system-ui",
            }}
          >
            {error}
          </div>
        ) : tree.length === 0 ? (
          <div
            className="text-sm py-10 text-center"
            style={{ color: "#7A7568", fontFamily: "ui-sans-serif, system-ui" }}
          >
            No categories yet — add your first one above.
          </div>
        ) : (
          <div
            className="rounded-lg p-2"
            style={{ background: "#FFFFFF", border: "1px solid #E4E0D6" }}
          >
            {tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                flat={flat}
                expanded={expanded}
                toggle={toggle}
                editingId={editingId}
                setEditingId={setEditingId}
                editValue={editValue}
                setEditValue={setEditValue}
                rename={rename}
                dragId={dragId}
                overId={overId}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOverNode={onDragOverNode}
                onDropNode={onDropNode}
                requestDelete={requestDelete}
                addCategory={addCategory}
                newName={newName}
                setNewName={setNewName}
              />
            ))}
          </div>
        )}

        {/* root drop shelf */}
        <div
          onDragOver={onDragOverRoot}
          onDragLeave={() => setOverRoot(false)}
          onDrop={onDropRoot}
          className="mt-4 rounded-lg border-2 border-dashed flex items-center justify-center text-xs py-4 transition-colors"
          style={{
            fontFamily: "ui-sans-serif, system-ui",
            borderColor: overRoot ? "#3F6C51" : "#D8D3C6",
            color: overRoot ? "#3F6C51" : "#9A9484",
            background: overRoot ? "#EEF3EC" : "transparent",
          }}
        >
          {dragId != null ? "Release here to remove parent" : "Top level"}
        </div>
      </div>

      {/* delete confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: "rgba(38,37,31,0.35)" }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg p-5"
            style={{ background: "#FFFFFF", fontFamily: "ui-sans-serif, system-ui" }}
          >
            <h2 className="text-base mb-2" style={{ color: "#26251F", fontWeight: 600 }}>
              Delete "{confirmDelete.name}"?
            </h2>
            {confirmDelete.childCount > 0 ? (
              <p className="text-sm mb-4" style={{ color: "#57534A" }}>
                This category has {confirmDelete.childCount} subcategor
                {confirmDelete.childCount === 1 ? "y" : "ies"}. They'll move up to take
                its place, keeping their own children intact.
              </p>
            ) : (
              <p className="text-sm mb-4" style={{ color: "#57534A" }}>
                This can't be undone.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-sm px-3 py-1.5 rounded-md"
                style={{ color: "#57534A", background: "#F0EDE5" }}
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete(confirmDelete.id, confirmDelete.childCount > 0)}
                className="text-sm px-3 py-1.5 rounded-md"
                style={{ color: "#F5F3EE", background: "#B3492B" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── recursive node ───────────────────────────────────────────────────────

function TreeNode({
  node,
  depth,
  flat,
  expanded,
  toggle,
  editingId,
  setEditingId,
  editValue,
  setEditValue,
  rename,
  dragId,
  overId,
  onDragStart,
  onDragEnd,
  onDragOverNode,
  onDropNode,
  requestDelete,
  addCategory,
  newName,
  setNewName,
}) {
  const [addingChild, setAddingChild] = useState(false);
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isDragging = dragId === node.id;
  const isOver = overId === node.id;
  const isEditing = editingId === node.id;

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, node.id)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOverNode(e, node.id)}
        onDrop={(e) => onDropNode(e, node.id)}
        className="group flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors"
        style={{
          marginLeft: depth * 20,
          opacity: isDragging ? 0.4 : 1,
          background: isOver ? "#EEF3EC" : "transparent",
          outline: isOver ? "2px solid #3F6C51" : "none",
          outlineOffset: -2,
        }}
      >
        <GripVertical
          size={14}
          className="cursor-grab opacity-30 group-hover:opacity-70 shrink-0"
          style={{ color: "#57534A" }}
        />

        <button
          onClick={() => hasChildren && toggle(node.id)}
          className="shrink-0 w-4 h-4 flex items-center justify-center"
          style={{ color: hasChildren ? "#57534A" : "transparent" }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            "·"
          )}
        </button>

        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") rename(node.id, editValue);
              if (e.key === "Escape") setEditingId(null);
            }}
            onBlur={() => rename(node.id, editValue)}
            className="flex-1 text-sm px-1.5 py-0.5 rounded outline-none"
            style={{
              fontFamily: "ui-sans-serif, system-ui",
              border: "1px solid #3F6C51",
              color: "#26251F",
            }}
          />
        ) : (
          <span
            className="flex-1 text-sm truncate"
            style={{ fontFamily: "ui-sans-serif, system-ui", color: "#26251F" }}
          >
            {node.name}
          </span>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <>
              <IconBtn
                title="Add subcategory"
                onClick={() => setAddingChild((v) => !v)}
              >
                <Plus size={13} />
              </IconBtn>
              <IconBtn
                title="Rename"
                onClick={() => {
                  setEditingId(node.id);
                  setEditValue(node.name);
                }}
              >
                <Pencil size={13} />
              </IconBtn>
              <IconBtn title="Delete" tone="danger" onClick={() => requestDelete(node)}>
                <X size={13} />
              </IconBtn>
            </>
          )}
        </div>
      </div>

      {addingChild && (
        <div
          className="flex items-center gap-1.5 py-1"
          style={{ marginLeft: depth * 20 + 30 }}
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addCategory(node.id);
                setAddingChild(false);
              }
              if (e.key === "Escape") setAddingChild(false);
            }}
            placeholder={`New subcategory of "${node.name}"…`}
            className="flex-1 text-sm px-2 py-1 rounded outline-none"
            style={{
              fontFamily: "ui-sans-serif, system-ui",
              border: "1px solid #D8D3C6",
              color: "#26251F",
            }}
          />
          <IconBtn
            title="Confirm"
            tone="ok"
            onClick={() => {
              addCategory(node.id);
              setAddingChild(false);
            }}
          >
            <Check size={13} />
          </IconBtn>
        </div>
      )}

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              flat={flat}
              expanded={expanded}
              toggle={toggle}
              editingId={editingId}
              setEditingId={setEditingId}
              editValue={editValue}
              setEditValue={setEditValue}
              rename={rename}
              dragId={dragId}
              overId={overId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOverNode={onDragOverNode}
              onDropNode={onDropNode}
              requestDelete={requestDelete}
              addCategory={addCategory}
              newName={newName}
              setNewName={setNewName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title, tone }) {
  const colors = {
    default: "#57534A",
    danger: "#B3492B",
    ok: "#3F6C51",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 transition-colors"
      style={{ color: colors[tone] || colors.default }}
    >
      {children}
    </button>
  );
}