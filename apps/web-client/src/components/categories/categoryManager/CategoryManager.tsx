import React, { useState, useEffect } from 'react';
import { Tree, type NodeModel } from '@minoru/react-dnd-treeview';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { getAllCategories, addCategory, updateCategory, removeCategory } from "../../../api/categories";
import type { Category } from "../../../model/category.interface";
import './CategoryManager.css';

export default function CategoryManager() {
    const [treeData, setTreeData] = useState<NodeModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState("");

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getAllCategories();
            const formattedData = data.map((cat: Category) => ({
                id: cat.id,
                parent: cat.parent_id || 0,
                text: cat.name,
                droppable: true,
                data: cat
            }));
            setTreeData(formattedData);
        } catch (error) {
            console.error("Failed to load categories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async (newTree: NodeModel[], options: any) => {
        const { dragSource, dropTargetId } = options;
        setTreeData(newTree);

        try {
            const newParentId = dropTargetId === 0 ? null : dropTargetId;
            await updateCategory(
                dragSource.id as number,
                dragSource.text,
                newParentId
            );
        } catch (error) {
            console.error("Failed to save new hierarchy", error);
            loadCategories();
        }
    };

    const handleAddRoot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            await addCategory(newCategoryName);
            setNewCategoryName("");
            loadCategories();
        } catch (error) {
            console.error("Failed to add category", error);
        }
    };

    const handleAddChild = async (parentId: number) => {
        const name = window.prompt("Enter new subcategory name:");
        if (!name || !name.trim()) return;

        try {
            await addCategory(name.trim(), parentId);
            loadCategories();
        } catch (error) {
            console.error("Failed to add subcategory", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this category? All its children will be affected.')) return;

        try {
            await removeCategory(id);
            setTreeData(treeData.filter(node => node.id !== id));
            loadCategories();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    if (loading) {
        return (
            <div className="cm-loading">
                <span>Loading your categories...</span>
            </div>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="category-manager">
                <div className="cm-header">
                    <h1 className="cm-title">Category Manager</h1>
                    <p className="cm-subtitle">Drag and drop to reorganize your category hierarchy.</p>
                </div>

                <form onSubmit={handleAddRoot} className="cm-add-form">
                    <input
                        type="text"
                        placeholder="New root category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="cm-input"
                    />
                    <button
                        type="submit"
                        disabled={!newCategoryName.trim()}
                        className="cm-btn-primary"
                    >
                        Add Category
                    </button>
                </form>

                <div className="cm-tree-container">
                    {treeData.length === 0 ? (
                        <div className="cm-empty-state">
                            No categories yet. Add one above!
                        </div>
                    ) : (
                        <Tree
                            tree={treeData}
                            rootId={0}
                            onDrop={handleDrop}
                            initialOpen={true}
                            classes={{
                                root: 'cm-tree-root',
                                draggingSource: 'cm-drag-source',
                                dropTarget: 'cm-drop-target',
                            }}
                            render={(node, { depth, isOpen, onToggle }) => (
                                <div
                                    className="cm-node"
                                    // Depth indentation needs to remain inline because it relies on dynamic JS math
                                    style={{ marginLeft: depth * 32 }}
                                >
                                    <div className="cm-node-content">
                                        <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                                            {node.droppable && (
                                                <button onClick={onToggle} className="cm-toggle-btn">
                                                    <svg 
                                                        className={`cm-chevron ${isOpen ? 'open' : ''}`} 
                                                        fill="none" 
                                                        viewBox="0 0 24 24" 
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        
                                        <span className="cm-node-text">{node.text}</span>
                                    </div>

                                    <div className="cm-node-actions">
                                        <button
                                            onClick={() => handleAddChild(node.id as number)}
                                            title="Add subcategory"
                                            className="cm-action-btn cm-btn-add"
                                        >
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                        
                                        <button
                                            onClick={() => handleDelete(node.id as number)}
                                            title="Delete category"
                                            className="cm-action-btn cm-btn-delete"
                                        >
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        />
                    )}
                </div>
            </div>
        </DndProvider>
    );
}