import React, { useState, useRef } from 'react';
import { usePresenter } from '../../../context/PresenterContext.js';
import { RosterEntry } from '../../../types/activity.js';
import { generate8CharPin, isValid8CharPin } from '../../../utils/pin.js';
import { Users, Upload, Download, Plus, Trash2, X, RefreshCw, CheckCircle2, KeyRound } from 'lucide-react';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({ isOpen, onClose }) => {
  const { roster, saveRoster, exportRosterCSV, importRosterCSV } = usePresenter();
  const [entries, setEntries] = useState<RosterEntry[]>(roster || []);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [importError, setImportError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setEntries(roster || []);
  }, [roster]);

  if (!isOpen) return null;

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

  const handleGenerateAllPins = () => {
    const updated = entries.map((e) => ({
      ...e,
      pin: generate8CharPin(),
    }));
    setEntries(updated);
    saveRoster(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportError('');
      const file = e.target.files[0];
      const text = await file.text();
      const success = await importRosterCSV(text);
      if (!success) {
        setImportError('Failed to parse CSV. Please ensure columns: ID, Name, PIN');
      } else {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Roster Management ({entries.length} participants)
              </h3>
              <p className="text-xs text-slate-500">
                Manage participant IDs and secure 8-character PINs (4 letters + 4 digits)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isSaved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: CSV Actions & Regenerate PINs */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>Import CSV</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt"
              className="hidden"
            />

            <button
              onClick={exportRosterCSV}
              disabled={entries.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export CSV</span>
            </button>
          </div>

          {entries.length > 0 && (
            <button
              onClick={handleGenerateAllPins}
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-indigo-600 font-medium"
              title="Regenerate random 8-character PINs for all participants"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate All PINs</span>
            </button>
          )}
        </div>

        {importError && (
          <div className="mx-5 my-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium">
            {importError}
          </div>
        )}

        {/* Add Entry Form */}
        <form onSubmit={handleAddParticipant} className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <input
              type="text"
              placeholder="Participant ID (e.g. STU101)"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Full Name (e.g. Alex Morgan)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex space-x-1.5">
            <input
              type="text"
              maxLength={8}
              placeholder="PIN (auto)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.toUpperCase())}
              className="w-full font-mono uppercase px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              title="Leave empty to auto-generate 8-character PIN"
            />
            <button
              type="submit"
              disabled={!newId.trim() || !newName.trim()}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Table of Roster Participants */}
        <div className="flex-1 overflow-y-auto p-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p>No participants in roster yet.</p>
              <p className="text-[11px] text-slate-500">
                Import a CSV or add participants above. Each participant receives an 8-character PIN (4 letters + 4 digits) to log in.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">ID</th>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">8-Digit PIN</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {entries.map((entry, idx) => (
                    <tr key={entry.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {entry.id}
                      </td>
                      <td className="py-2.5 px-4 text-slate-900 dark:text-white">
                        {entry.name}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                          {entry.pin}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                          title="Remove participant"
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 text-xs">
          <div className="text-[11px] text-slate-500">
            PINs follow format: 4 letters + 4 digits (e.g. ALEX4821)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
