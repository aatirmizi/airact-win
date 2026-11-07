import React, { useState, useRef, useEffect } from 'react';
import { usePresenter } from '../../../context/PresenterContext.js';
import { RosterEntry } from '../../../types/activity.js';
import { generate8CharPin, isValid8CharPin } from '../../../utils/pin.js';
import {
  Users,
  Upload,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Copy,
  Search,
  Check,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const RosterView: React.FC = () => {
  const { roster, saveRoster, exportRosterCSV, importRosterCSV, setActiveView } = usePresenter();
  const [entries, setEntries] = useState<RosterEntry[]>(roster || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [importError, setImportError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEntries(roster || []);
  }, [roster]);

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) return;

    let pin = newPin.trim().toUpperCase();
    if (!/^[A-Z]{4}[0-9]{4}$/.test(pin)) {
      pin = generate8CharPin();
    }

    const updated = [
      ...entries,
      {
        id: newId.trim().toUpperCase(),
        name: newName.trim(),
        pin,
      },
    ];

    setEntries(updated);
    saveRoster(updated);
    setNewId('');
    setNewName('');
    setNewPin('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDelete = (index: number) => {
    const updated = entries.filter((_, idx) => idx !== index);
    setEntries(updated);
    saveRoster(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all entries from the roster? This cannot be undone.')) {
      setEntries([]);
      saveRoster([]);
    }
  };

  const handleRegenerateMissingPins = () => {
    const updated = entries.map((entry) => {
      if (!entry.pin || !isValid8CharPin(entry.pin)) {
        return { ...entry, pin: generate8CharPin() };
      }
      return entry;
    });
    setEntries(updated);
    saveRoster(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const success = await importRosterCSV(text);
        if (!success) {
          setImportError('Failed to parse CSV. Expected columns: id, name, pin');
        } else {
          setImportError('');
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyToClipboard = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 1500);
  };

  const filteredEntries = entries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || (e.pin && e.pin.toLowerCase().includes(q));
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Attendees Roster Management</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 font-mono">
                  {entries.length} {entries.length === 1 ? 'Attendee' : 'Attendees'}
                </span>
                {isSaved && (
                  <span className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure participant IDs and secure 8-character PINs for verified roster authentication
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveView('slides')}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Slides</span>
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, name or PIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Import roster from CSV file"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>Import CSV</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={exportRosterCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Download roster as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleRegenerateMissingPins}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Auto-generate 8-character PINs for any attendee without one"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Generate Missing PINs</span>
            </button>

            {entries.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                title="Clear all attendees from roster"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {importError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{importError}</span>
          </div>
        )}

        {/* Add Attendee Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center space-x-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            <span>Add Single Attendee</span>
          </h3>
          <form onSubmit={handleAddParticipant} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Participant ID *
              </label>
              <input
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value.toUpperCase())}
                placeholder="e.g. S101 or EMP-042"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                8-Char PIN <span className="text-slate-400 font-normal">(Leave blank to auto-gen)</span>
              </label>
              <input
                type="text"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.toUpperCase())}
                placeholder="Auto-generated if empty"
                maxLength={8}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Attendee</span>
              </button>
            </div>
          </form>
        </div>

        {/* Attendee Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {entries.length === 0 ? 'No Attendees in Roster' : 'No matching attendees found'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {entries.length === 0
                    ? 'Add participants above or click "Import CSV" to populate the session roster.'
                    : 'Try adjusting your search query above.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Participant ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Secure PIN (8-Char)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredEntries.map((entry, idx) => (
                    <tr
                      key={entry.id + idx}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {entry.id}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{entry.name}</td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                          <span>{entry.pin || 'NO-PIN'}</span>
                          {entry.pin && (
                            <button
                              onClick={() => copyToClipboard(entry.pin!)}
                              className="p-1 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-400 cursor-pointer"
                              title="Copy PIN"
                            >
                              {copiedPin === entry.pin ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Remove from roster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
