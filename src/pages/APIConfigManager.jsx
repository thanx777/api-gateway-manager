import React from 'react';
import { useAPIConfig } from '../context/APIConfigContext';
import APIConfigList from '../components/api-config/APIConfigList';

export default function APIConfigManager() {
  const { configs, addConfig, updateConfig, deleteConfig, toggleStatus } = useAPIConfig();

  return (
    <div className="animate-fade-in">
      <APIConfigList
        configs={configs}
        onAdd={addConfig}
        onEdit={updateConfig}
        onDelete={deleteConfig}
        onToggle={toggleStatus}
      />
    </div>
  );
}
