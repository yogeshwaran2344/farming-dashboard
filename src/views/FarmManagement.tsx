import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Save,
  X,
  Info,
  CheckCircle,
  Sprout,
  ShieldCheck
} from 'lucide-react';
import { FieldZone } from '../types';

export const FarmManagement: React.FC = () => {
  const {
    t,
    fields,
    addField,
    updateField,
    deleteField,
    stations,
    selectedFieldId,
    setSelectedFieldId,
  } = useFarm();

  const [isEditing, setIsEditing] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<FieldZone, 'id'>>({
    name: '',
    area: 2.0,
    areaUnit: 'Acres',
    cropType: 'Tomato',
    cropStage: 'Vegetative',
    soilType: 'Red Loamy Soil',
    assignedStationId: stations[0]?.id || 'station-esp32-01',
    irrigationMethod: 'Drip Irrigation',
    targetMoistureMin: 40,
    targetMoistureMax: 70,
    notes: '',
  });

  const handleOpenAdd = () => {
    setFormData({
      name: `Field Zone ${fields.length + 1}`,
      area: 2.5,
      areaUnit: 'Acres',
      cropType: 'Bt Cotton',
      cropStage: 'Vegetative Canopy',
      soilType: 'Medium Black Soil',
      assignedStationId: stations[0]?.id || 'station-esp32-01',
      irrigationMethod: 'Drip Irrigation',
      targetMoistureMin: 40,
      targetMoistureMax: 70,
      notes: '',
    });
    setEditingFieldId(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (field: FieldZone) => {
    setFormData({
      name: field.name,
      area: field.area,
      areaUnit: field.areaUnit,
      cropType: field.cropType,
      cropStage: field.cropStage,
      soilType: field.soilType,
      assignedStationId: field.assignedStationId,
      irrigationMethod: field.irrigationMethod,
      targetMoistureMin: field.targetMoistureMin,
      targetMoistureMax: field.targetMoistureMax,
      notes: field.notes || '',
    });
    setEditingFieldId(field.id);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a field name.");
      return;
    }

    if (formData.targetMoistureMin >= formData.targetMoistureMax) {
      alert("Minimum threshold must be less than maximum threshold.");
      return;
    }

    if (editingFieldId) {
      updateField({
        ...formData,
        id: editingFieldId,
      });
    } else {
      addField(formData);
    }

    setIsEditing(false);
    setEditingFieldId(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.farm.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.farm.subtitle}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.farm.addField}</span>
        </button>
      </div>

      {/* Scope Disclaimer Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Clear Architectural Scope: </strong>
          Field profiles and crop stages establish the calibrated moisture bounds for rule-based irrigation guidance. FarmSense does not pretend to simulate crop pathology, yield predictions, or black-box ML without physical lab testing.
        </div>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {fields.map((f) => {
          const isSelected = selectedFieldId === f.id;
          const assignedStation = stations.find(s => s.id === f.assignedStationId);

          return (
            <div
              key={f.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{f.name}</h3>
                      <span className="text-[11px] font-semibold text-emerald-700">{f.cropType}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(f)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                      title="Edit Field"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {fields.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${f.name}?`)) {
                            deleteField(f.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Area:</span>
                    <span className="font-semibold text-slate-800">{f.area} {f.areaUnit}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Soil Type:</span>
                    <span className="font-semibold text-slate-800">{f.soilType}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Crop Stage:</span>
                    <span className="font-semibold text-slate-800">{f.cropStage}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Irrigation:</span>
                    <span className="font-semibold text-slate-800">{f.irrigationMethod}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">Threshold Band:</span>
                    <span className="font-bold text-emerald-700">{f.targetMoistureMin}% – {f.targetMoistureMax}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Station:</span>
                    <span className="font-mono text-[11px] text-slate-700">{assignedStation?.name || f.assignedStationId}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedFieldId(f.id)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? 'Active Monitored Field' : 'Select as Active'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Field Add / Edit Modal Drawer */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingFieldId ? t.farm.editField : t.farm.addField}
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.farm.fieldName} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. North Plot — Zone 1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.farm.area}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Area Unit
                  </label>
                  <select
                    value={formData.areaUnit}
                    onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium bg-white"
                  >
                    <option value="Acres">Acres</option>
                    <option value="Hectares">Hectares</option>
                    <option value="Guntas">Guntas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.farm.crop} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cropType}
                    onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                    placeholder="e.g. Tomato, Cotton, Rice"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.farm.stage}
                  </label>
                  <select
                    value={formData.cropStage}
                    onChange={(e) => setFormData({ ...formData, cropStage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium bg-white"
                  >
                    <option value="Germination">Germination</option>
                    <option value="Vegetative Canopy">Vegetative Canopy</option>
                    <option value="Flowering & Early Fruiting">Flowering & Early Fruiting</option>
                    <option value="Fruit Setting">Fruit Setting</option>
                    <option value="Maturation & Harvest">Maturation & Harvest</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.farm.soil}
                  </label>
                  <select
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium bg-white"
                  >
                    <option value="Red Loamy Soil">Red Loamy Soil</option>
                    <option value="Medium Black Soil">Medium Black Soil</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t.farm.method}
                  </label>
                  <select
                    value={formData.irrigationMethod}
                    onChange={(e) => setFormData({ ...formData, irrigationMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium bg-white"
                  >
                    <option value="Drip Irrigation">Drip Irrigation</option>
                    <option value="Micro Sprinklers">Micro Sprinklers</option>
                    <option value="Furrow / Bed">Furrow / Bed</option>
                    <option value="Surface Flood">Surface Flood</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.farm.assignedDevice}
                </label>
                <select
                  value={formData.assignedStationId}
                  onChange={(e) => setFormData({ ...formData, assignedStationId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium bg-white"
                >
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.hardwareModel.split('+')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Trigger Min Moisture (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    required
                    value={formData.targetMoistureMin}
                    onChange={(e) => setFormData({ ...formData, targetMoistureMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stop Max Moisture (%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="95"
                    required
                    value={formData.targetMoistureMax}
                    onChange={(e) => setFormData({ ...formData, targetMoistureMax: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t.farm.cancel}
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.farm.saveField}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
