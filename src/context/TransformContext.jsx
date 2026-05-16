import React, { createContext, useContext, useReducer, useEffect } from 'react';

const TransformContext = createContext();

const STORAGE_KEY = 'api_gateway_transform_rules';

const initialState = {
  rules: [],
  activeRule: null,
  loading: true,
};

function transformReducer(state, action) {
  switch (action.type) {
    case 'LOAD_RULES':
      return { ...state, rules: action.payload, loading: false };
    case 'ADD_RULE':
      const newRules = [...state.rules, action.payload];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules));
      return { ...state, rules: newRules };
    case 'UPDATE_RULE':
      const updatedRules = state.rules.map(rule =>
        rule.id === action.payload.id ? { ...rule, ...action.payload, updatedAt: Date.now() } : rule
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRules));
      return { ...state, rules: updatedRules };
    case 'DELETE_RULE':
      const filteredRules = state.rules.filter(rule => rule.id !== action.payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRules));
      return { ...state, rules: filteredRules };
    case 'SET_ACTIVE_RULE':
      return { ...state, activeRule: action.payload };
    case 'TOGGLE_RULE':
      const toggledRules = state.rules.map(rule =>
        rule.id === action.payload ? { ...rule, enabled: !rule.enabled } : rule
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toggledRules));
      return { ...state, rules: toggledRules };
    default:
      return state;
  }
}

export function TransformProvider({ children }) {
  const [state, dispatch] = useReducer(transformReducer, initialState);

  useEffect(() => {
    const storedRules = localStorage.getItem(STORAGE_KEY);
    if (storedRules) {
      dispatch({ type: 'LOAD_RULES', payload: JSON.parse(storedRules) });
    } else {
      const defaultRules = [
        {
          id: crypto.randomUUID(),
          name: 'OpenAI → Claude 转换',
          sourceProvider: 'openai',
          targetProvider: 'claude',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          name: 'Claude → OpenAI 转换',
          sourceProvider: 'claude',
          targetProvider: 'openai',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRules));
      dispatch({ type: 'LOAD_RULES', payload: defaultRules });
    }
  }, []);

  const addRule = (rule) => {
    const newRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
    };
    dispatch({ type: 'ADD_RULE', payload: newRule });
  };

  const updateRule = (id, rule) => {
    dispatch({ type: 'UPDATE_RULE', payload: { id, ...rule } });
  };

  const deleteRule = (id) => {
    dispatch({ type: 'DELETE_RULE', payload: id });
  };

  const setActiveRule = (id) => {
    dispatch({ type: 'SET_ACTIVE_RULE', payload: id });
  };

  const toggleRule = (id) => {
    dispatch({ type: 'TOGGLE_RULE', payload: id });
  };

  const getRuleById = (id) => {
    return state.rules.find(rule => rule.id === id);
  };

  return (
    <TransformContext.Provider value={{
      rules: state.rules,
      activeRule: state.activeRule,
      loading: state.loading,
      addRule,
      updateRule,
      deleteRule,
      setActiveRule,
      toggleRule,
      getRuleById,
    }}>
      {children}
    </TransformContext.Provider>
  );
}

export function useTransform() {
  const context = useContext(TransformContext);
  if (!context) {
    throw new Error('useTransform must be used within TransformProvider');
  }
  return context;
}
