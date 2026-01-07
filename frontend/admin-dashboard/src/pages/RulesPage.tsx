import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getRules, updateRule } from '@/services/api';
import type { Rule } from '@/types';

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await getRules();
      setRules(data);
    } catch (error) {
      toast.error('Error al cargar reglas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    
    try {
      await updateRule(editingRule.id, editingRule.parameters);
      toast.success('Regla actualizada exitosamente');
      setEditingRule(null);
      loadRules();
    } catch (error) {
      toast.error('Error al actualizar regla');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reglas de Fraude</h1>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-admin-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{rule.name}</h3>
              <button
                onClick={() => handleEditRule(rule)}
                className="px-4 py-2 bg-admin-primary rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Editar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Tipo:</span>
                <span className="ml-2 text-white">{rule.type}</span>
              </div>
              <div>
                <span className="text-gray-400">Prioridad:</span>
                <span className="ml-2 text-white">{rule.order}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Parámetros:</span>
                <pre className="mt-2 p-3 bg-admin-bg rounded-lg text-xs">
                  {JSON.stringify(rule.parameters, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edición */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-admin-surface rounded-xl p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-6">Editar Regla: {editingRule.name}</h2>
            <div className="space-y-4">
              {editingRule.type === 'amount_threshold' && (
                <div>
                  <label className="block text-sm mb-2">Threshold ($)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-gray-600 focus:border-admin-primary focus:outline-none"
                    value={editingRule.parameters.threshold}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        parameters: { ...editingRule.parameters, threshold: parseFloat(e.target.value) },
                      })
                    }
                  />
                </div>
              )}
              {editingRule.type === 'location_check' && (
                <div>
                  <label className="block text-sm mb-2">Radio (km)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-admin-bg rounded-lg border border-gray-600 focus:border-admin-primary focus:outline-none"
                    value={editingRule.parameters.radius_km}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        parameters: { ...editingRule.parameters, radius_km: parseFloat(e.target.value) },
                      })
                    }
                  />
                </div>
              )}
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setEditingRule(null)}
                className="flex-1 px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRule}
                className="flex-1 px-4 py-2 bg-admin-primary rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
