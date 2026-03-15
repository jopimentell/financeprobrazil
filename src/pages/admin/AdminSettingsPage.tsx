import { useState, useEffect } from 'react';
import { SystemSettings } from '@/types/finance';
import { toast } from 'sonner';
import { Save, Settings, RefreshCw } from 'lucide-react';

const SETTINGS_KEY = 'system_settings';

const defaultSettings: SystemSettings = {
  defaultCurrency: 'BRL',
  defaultCategories: true,
  maxTransactionsPerUser: 1000,
  maxAccountsPerUser: 10,
  googleSheetsEnabled: false,
  googleSheetsUrl: 'https://docs.google.com/spreadsheets/d/1TJrSnbgF3VHNNILKPvpHSZYuXoTFjpH8rkC0LxIjxxA/edit',
  maintenanceMode: false,
};

function loadSettings(): SystemSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch { return defaultSettings; }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(loadSettings);
  const [saved, setSaved] = useState(true);

  const handleChange = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    toast.success('Configurações salvas');
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    setSaved(true);
    toast.success('Configurações restauradas para padrão');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-border hover:bg-accent transition-colors">
            <RefreshCw className="h-4 w-4" /> Restaurar
          </button>
          <button onClick={handleSave} disabled={saved}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save className="h-4 w-4" /> Salvar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <div className="finance-card space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Settings className="h-4 w-4" /> Geral</h3>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Moeda padrão</label>
            <select value={settings.defaultCurrency} onChange={e => handleChange('defaultCurrency', e.target.value)}
              className="input-field">
              <option value="BRL">BRL - Real Brasileiro</option>
              <option value="USD">USD - Dólar Americano</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Categorias padrão</p>
              <p className="text-xs text-muted-foreground">Criar categorias padrão para novos usuários</p>
            </div>
            <button onClick={() => handleChange('defaultCategories', !settings.defaultCategories)}
              className={`w-11 h-6 rounded-full transition-colors relative ${settings.defaultCategories ? 'bg-primary' : 'bg-border'}`}>
              <div className={`w-5 h-5 rounded-full bg-card shadow absolute top-0.5 transition-transform ${settings.defaultCategories ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Modo manutenção</p>
              <p className="text-xs text-muted-foreground">Bloqueia acesso de usuários ao sistema</p>
            </div>
            <button onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
              className={`w-11 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-destructive' : 'bg-border'}`}>
              <div className={`w-5 h-5 rounded-full bg-card shadow absolute top-0.5 transition-transform ${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Limits */}
        <div className="finance-card space-y-4">
          <h3 className="font-semibold">Limites de Uso</h3>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Máx. transações por usuário</label>
            <input type="number" value={settings.maxTransactionsPerUser} onChange={e => handleChange('maxTransactionsPerUser', parseInt(e.target.value) || 0)}
              className="input-field" />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Máx. contas por usuário</label>
            <input type="number" value={settings.maxAccountsPerUser} onChange={e => handleChange('maxAccountsPerUser', parseInt(e.target.value) || 0)}
              className="input-field" />
          </div>
        </div>

        {/* Google Sheets */}
        <div className="finance-card space-y-4 lg:col-span-2">
          <h3 className="font-semibold">Integração Google Sheets</h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Ativar integração</p>
              <p className="text-xs text-muted-foreground">Sincronizar dados com planilha Google</p>
            </div>
            <button onClick={() => handleChange('googleSheetsEnabled', !settings.googleSheetsEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${settings.googleSheetsEnabled ? 'bg-primary' : 'bg-border'}`}>
              <div className={`w-5 h-5 rounded-full bg-card shadow absolute top-0.5 transition-transform ${settings.googleSheetsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {settings.googleSheetsEnabled && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">URL da planilha</label>
              <input type="url" value={settings.googleSheetsUrl} onChange={e => handleChange('googleSheetsUrl', e.target.value)}
                className="input-field" placeholder="https://docs.google.com/spreadsheets/..." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
