import React, { createContext, useContext, useReducer, useEffect } from 'react';

const APIConfigContext = createContext();

const STORAGE_KEY = 'api_gateway_configs';

const initialState = {
  configs: [],
  loading: true,
};

function apiConfigReducer(state, action) {
  switch (action.type) {
    case 'LOAD_CONFIGS':
      return { ...state, configs: action.payload, loading: false };
    case 'ADD_CONFIG':
      const newConfigs = [...state.configs, action.payload];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigs));
      return { ...state, configs: newConfigs };
    case 'UPDATE_CONFIG':
      const updatedConfigs = state.configs.map(config =>
        config.id === action.payload.id ? { ...config, ...action.payload, updatedAt: Date.now() } : config
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs));
      return { ...state, configs: updatedConfigs };
    case 'DELETE_CONFIG':
      const filteredConfigs = state.configs.filter(config => config.id !== action.payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredConfigs));
      return { ...state, configs: filteredConfigs };
    case 'TOGGLE_STATUS':
      const toggledConfigs = state.configs.map(config =>
        config.id === action.payload ? { ...config, status: config.status === 'active' ? 'inactive' : 'active' } : config
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toggledConfigs));
      return { ...state, configs: toggledConfigs };
    default:
      return state;
  }
}

export function APIConfigProvider({ children }) {
  const [state, dispatch] = useReducer(apiConfigReducer, initialState);

  useEffect(() => {
    const storedConfigs = localStorage.getItem(STORAGE_KEY);
    if (storedConfigs) {
      dispatch({ type: 'LOAD_CONFIGS', payload: JSON.parse(storedConfigs) });
    } else {
      dispatch({ type: 'LOAD_CONFIGS', payload: [] });
    }
  }, []);

  const addConfig = (config) => {
    const newConfig = {
      ...config,
      toolsEnabled: config.toolsEnabled !== undefined ? config.toolsEnabled : true,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
    };
    dispatch({ type: 'ADD_CONFIG', payload: newConfig });
  };

  const updateConfig = (id, config) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: { id, ...config } });
  };

  const deleteConfig = (id) => {
    dispatch({ type: 'DELETE_CONFIG', payload: id });
  };

  const toggleStatus = (id) => {
    dispatch({ type: 'TOGGLE_STATUS', payload: id });
  };

  const getConfigById = (id) => {
    return state.configs.find(config => config.id === id);
  };

  const getConfigsByProvider = (provider) => {
    return state.configs.filter(config => config.provider === provider && config.status === 'active');
  };

  return (
    <APIConfigContext.Provider value={{
      configs: state.configs,
      loading: state.loading,
      addConfig,
      updateConfig,
      deleteConfig,
      toggleStatus,
      getConfigById,
      getConfigsByProvider,
    }}>
      {children}
    </APIConfigContext.Provider>
  );
}

export function useAPIConfig() {
  const context = useContext(APIConfigContext);
  if (!context) {
    throw new Error('useAPIConfig must be used within APIConfigProvider');
  }
  return context;
}
