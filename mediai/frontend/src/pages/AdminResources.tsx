import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Resource } from '../types';
import { ResourceGauge } from '../components/ResourceGauge';
import { Card, CardHeader, CardTitle, CardContent, Input, Select, Button, Badge } from '../components/ui/CustomComponents';
import { HardDrive, CheckCircle2, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';

export const AdminResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit stock state
  const [selectedResId, setSelectedResId] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [availableUnits, setAvailableUnits] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchResourcesData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/resources');
      if (res.data.success) {
        setResources(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedResId(res.data.data[0].id);
          setTotalUnits(String(res.data.data[0].totalUnits));
          setAvailableUnits(String(res.data.data[0].availableUnits));
        }
      }

      const foreRes = await api.get('/resources/forecast');
      if (foreRes.data.success) {
        setForecasts(foreRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResourcesData();
  }, []);

  const handleResourceChange = (id: string) => {
    setSelectedResId(id);
    const item = resources.find((r) => r.id === id);
    if (item) {
      setTotalUnits(String(item.totalUnits));
      setAvailableUnits(String(item.availableUnits));
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId) return;

    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      const res = await api.put(`/resources/${selectedResId}`, {
        totalUnits: parseInt(totalUnits),
        availableUnits: parseInt(availableUnits),
      });

      if (res.data.success) {
        setSuccessMsg('Resource inventory levels updated successfully.');
        fetchResourcesData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Medical Hardware Inventory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage critical care hardware assets and verify occupancy forecasting trends</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading resources telemetry...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory visual progress row */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map((res) => (
                <ResourceGauge
                  key={res.id}
                  id={res.id}
                  resourceType={res.resourceType}
                  totalUnits={res.totalUnits}
                  availableUnits={res.availableUnits}
                />
              ))}
            </div>

            {/* Demand forecast chart table */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-brand-600" />
                  <span>Prognostic Capacity Forecasts</span>
                </CardTitle>
                <Badge variant="info" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-pulse-subtle" />
                  AI Forecast
                </Badge>
              </CardHeader>
              <CardContent className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/35 uppercase text-[9px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Resource Type</th>
                        <th className="px-4 py-3">Estimated Requirement</th>
                        <th className="px-4 py-3">Projected Growth Demand</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {forecasts.map((fore) => (
                        <tr key={fore.resourceType}>
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                            {fore.resourceType}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {fore.currentRequired} Units
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-clinical-rose font-bold">
                              +{fore.forecastedIncreasePercentage}% Surge
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Inventory Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <HardDrive className="h-4.5 w-4.5 text-brand-600" />
                  <span>Update Asset Stock</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <Select
                    label="Choose Resource type"
                    value={selectedResId}
                    onChange={(e) => handleResourceChange(e.target.value)}
                    options={resources.map((r) => ({
                      value: r.id,
                      label: r.resourceType,
                    }))}
                  />

                  <Input
                    label="Total Inventory Units"
                    placeholder="20"
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(e.target.value)}
                    required
                  />

                  <Input
                    label="Currently Available Units"
                    placeholder="15"
                    value={availableUnits}
                    onChange={(e) => setAvailableUnits(e.target.value)}
                    required
                  />

                  <Button type="submit" isLoading={isUpdating} className="w-full font-bold">
                    <RefreshCw className="h-4 w-4" />
                    Save Asset Capacity
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
