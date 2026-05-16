import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import APIConfigCard from './APIConfigCard';
import APIConfigForm from './APIConfigForm';
import Button from '../common/Button';

export default function APIConfigList({ configs, onAdd, onEdit, onDelete, onToggle }) {
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  const handleAdd = () => {
    setEditingConfig(null);
    setShowForm(true);
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleFormSubmit = (data) => {
    if (editingConfig) {
      onEdit(editingConfig.id, data);
    } else {
      onAdd(data);
    }
    setShowForm(false);
    setEditingConfig(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingConfig(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">
            API配置管理
          </h2>
          <p className="text-gray-400 mt-2">
            管理和配置您所有的AI API
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd}>
          <Plus className="w-5 h-5" />
          <span>添加新配置</span>
        </Button>
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <Plus className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            暂无API配置
          </h3>
          <p className="text-gray-400 mb-6">
            点击上方按钮添加您的第一个API配置
          </p>
          <Button variant="primary" onClick={handleAdd}>
            <Plus className="w-5 h-5" />
            <span>添加API配置</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs.map((config) => (
            <APIConfigCard
              key={config.id}
              config={config}
              onEdit={handleEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}

      {showForm && (
        <APIConfigForm
          config={editingConfig}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
