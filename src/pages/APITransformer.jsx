import React from 'react';
import { useTransform } from '../context/TransformContext';
import TransformPanel from '../components/transformer/TransformPanel';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ArrowRight, Trash2, Edit2 } from 'lucide-react';

export default function APITransformer() {
  const { rules, addRule, updateRule, deleteRule, toggleRule } = useTransform();

  const handleAddRule = (data) => {
    addRule(data);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <TransformPanel onTransform={handleAddRule} />

      {rules.length > 0 && (
        <Card className="p-6">
          <h3 className="text-2xl font-display font-bold text-white mb-6">
            已有的转换规则
          </h3>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {rule.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rule.sourceProvider === 'openai' ? 'bg-green-500/20 text-green-400' :
                        rule.sourceProvider === 'claude' ? 'bg-orange-500/20 text-orange-400' :
                        rule.sourceProvider === 'deepseek' ? 'bg-blue-500/20 text-blue-400' :
                        rule.sourceProvider === 'glm' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {rule.sourceProvider.toUpperCase()}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rule.targetProvider === 'openai' ? 'bg-green-500/20 text-green-400' :
                        rule.targetProvider === 'claude' ? 'bg-orange-500/20 text-orange-400' :
                        rule.targetProvider === 'deepseek' ? 'bg-blue-500/20 text-blue-400' :
                        rule.targetProvider === 'glm' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {rule.targetProvider.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        rule.enabled 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                    >
                      {rule.enabled ? '已启用' : '已禁用'}
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
