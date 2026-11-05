import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  History,
  Printer,
  Package,
  DollarSign,
  ArrowDownRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { Prescription, Medicine, InventoryTransaction, Patient } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const PharmacyInventory: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'inventory' | 'transactions'>('prescriptions');

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(db.getPrescriptions());
  const [medicines, setMedicines] = useState<Medicine[]>(db.getMedicines());
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(db.getInventoryTransactions());
  const [patients, setPatients] = useState<Patient[]>(db.getPatients());

  const [searchQuery, setSearchQuery] = useState('');

  // Dispense modal
  const [dispenseRx, setDispenseRx] = useState<Prescription | null>(null);
  const [dispenseBatchMap, setDispenseBatchMap] = useState<Record<string, { batchId: string; quantity: number }>>({});
  const [dispenseError, setDispenseError] = useState<string | null>(null);

  // Print modal
  const [printRx, setPrintRx] = useState<Prescription | null>(null);

  // Add Medicine Modal
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    genericName: '',
    brandName: '',
    category: 'Cardiovascular',
    dosageForm: 'Tablet' as Medicine['dosageForm'],
    strength: '10 mg',
    manufacturer: '',
    unitPrice: 15.0,
    reorderLevel: 50,
    locationRack: 'Shelf B-01',
    initialBatchNumber: 'BN-2025-01',
    initialQuantity: 100,
    expiryDate: '2028-01-01',
  });

  // Receive Batch Modal
  const [isReceiveBatchOpen, setIsReceiveBatchOpen] = useState(false);
  const [batchTargetMedId, setBatchTargetMedId] = useState(medicines[0]?.id || '');
  const [batchForm, setBatchForm] = useState({
    batchNumber: `BN-${Date.now().toString().slice(-6)}`,
    manufacturingDate: '2025-01-01',
    expiryDate: '2028-06-30',
    quantityAvailable: 100,
    unitCost: 8.0,
    sellingPrice: 16.0,
  });

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setPrescriptions(db.getPrescriptions());
      setMedicines(db.getMedicines());
      setTransactions(db.getInventoryTransactions());
      setPatients(db.getPatients());
    });
    return unsub;
  }, []);

  const handleOpenDispense = (rx: Prescription) => {
    setDispenseRx(rx);
    setDispenseError(null);

    // Initialize dispense mapping with available batches
    const map: Record<string, { batchId: string; quantity: number }> = {};
    rx.items.forEach((item) => {
      const med = medicines.find((m) => m.id === item.medicineId);
      const remainingNeeded = Math.max(0, item.quantityPrescribed - (item.quantityDispensed || 0));
      const firstValidBatch = med?.batches.find(
        (b) => new Date(b.expiryDate) > new Date() && b.quantityAvailable > 0
      );
      map[item.id] = {
        batchId: firstValidBatch?.id || med?.batches[0]?.id || '',
        quantity: remainingNeeded,
      };
    });
    setDispenseBatchMap(map);
  };

  const handleConfirmDispense = () => {
    if (!dispenseRx) return;
    const res = db.dispensePrescription(dispenseRx.id, dispenseBatchMap, currentUser);
    if (!res.success) {
      setDispenseError(res.error || 'Failed to dispense medications.');
    } else {
      setDispenseRx(null);
      alert('Medications successfully dispensed. Stock inventory decremented.');
    }
  };

  const handleAddMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const batchId = `BAT-${Date.now().toString().slice(-5)}`;
    db.addMedicine(
      {
        genericName: newMedForm.genericName,
        brandName: newMedForm.brandName,
        category: newMedForm.category,
        dosageForm: newMedForm.dosageForm,
        strength: newMedForm.strength,
        manufacturer: newMedForm.manufacturer,
        unitPrice: newMedForm.unitPrice,
        reorderLevel: newMedForm.reorderLevel,
        totalStock: newMedForm.initialQuantity,
        locationRack: newMedForm.locationRack,
        status: newMedForm.initialQuantity > newMedForm.reorderLevel ? 'In Stock' : 'Low Stock',
        batches: [
          {
            id: batchId,
            batchNumber: newMedForm.initialBatchNumber,
            manufacturingDate: '2025-01-01',
            expiryDate: newMedForm.expiryDate,
            quantityAvailable: newMedForm.initialQuantity,
            unitCost: newMedForm.unitPrice * 0.5,
            sellingPrice: newMedForm.unitPrice,
          },
        ],
      },
      currentUser
    );
    setIsAddMedModalOpen(false);
  };

  const handleReceiveBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.addMedicineBatch(batchTargetMedId, batchForm, currentUser);
    setIsReceiveBatchOpen(false);
    alert('Stock batch received and recorded into inventory.');
  };

  // Filtered lists
  const filteredPrescriptions = prescriptions.filter((p) => {
    return (
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredMedicines = medicines.filter((m) => {
    return (
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" /> Pharmacy Dispensing & Stock Inventory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fulfill doctor prescriptions, track batch expirations, and maintain negative-stock protection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReceiveBatchOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 font-medium text-xs border border-teal-200 dark:border-teal-800 transition-all active:scale-95"
          >
            <Package className="w-4 h-4" /> + Receive Batch
          </button>
          <button
            onClick={() => setIsAddMedModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add New Medicine
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'prescriptions'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Prescription Orders
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {prescriptions.filter((p) => p.status === 'Pending').length} Pending
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Medicine Formulary
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {medicines.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'transactions'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Stock Transactions
        </button>
      </div>

      {/* Search Input */}
      <div className="relative bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <Search className="absolute left-7 top-6.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Rx ID, Patient Name, Brand or Generic Medicine Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
        />
      </div>

      {/* TAB 1: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrescriptions.map((rx) => {
              const allDispensed = rx.status === 'Dispensed';
              return (
                <div
                  key={rx.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                          {rx.id}
                        </span>
                        <Badge
                          variant={
                            rx.status === 'Dispensed'
                              ? 'success'
                              : rx.status === 'Partially Dispensed'
                              ? 'warning'
                              : 'primary'
                          }
                          size="sm"
                          dot
                        >
                          {rx.status}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {rx.patientName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Prescribed by {rx.doctorName} • Date: {rx.date}
                      </p>
                    </div>

                    <button
                      onClick={() => setPrintRx(rx)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      title="View & Print Official Rx"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
                    {rx.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between text-[11px] border-b last:border-0 border-slate-200/40 dark:border-slate-700/40 pb-1.5 last:pb-0"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {it.medicineName} ({it.dosage})
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {it.frequency} • {it.duration} • {it.instructions}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {it.quantityDispensed || 0} / {it.quantityPrescribed} units
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500 italic">
                      Dx: {rx.diagnosis}
                    </span>
                    {!allDispensed && (
                      <button
                        onClick={() => handleOpenDispense(rx)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs"
                      >
                        Dispense Medicine
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Brand & Generic Name</th>
                  <th className="py-3 px-4">Form & Strength</th>
                  <th className="py-3 px-4">Rack Location</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Batches & Expiry</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {filteredMedicines.map((m) => {
                  const isLow = m.totalStock <= m.reorderLevel;
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {m.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{m.brandName}</p>
                        <p className="text-[11px] text-slate-400 italic">{m.genericName}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span>
                          {m.dosageForm} • {m.strength}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {m.locationRack}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        ${m.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        {m.batches.map((b) => {
                          const isExpiring = new Date(b.expiryDate) < new Date(Date.now() + 30 * 86400000);
                          return (
                            <div key={b.id} className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-500">{b.batchNumber}:</span>
                              <span
                                className={
                                  isExpiring ? 'text-rose-600 dark:text-rose-400 font-bold' : ''
                                }
                              >
                                Exp {b.expiryDate} ({b.quantityAvailable} left)
                              </span>
                            </div>
                          );
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-sm">{m.totalStock}</span>
                        <span className="text-[10px] text-slate-400 block">
                          Reorder at {m.reorderLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            m.status === 'In Stock'
                              ? 'success'
                              : m.status === 'Low Stock'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                          dot
                        >
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Txn ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Medicine Item</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Handled By</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No inventory movements logged yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {t.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(t.date).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {t.medicineName}
                      </td>
                      <td className="py-3 px-4 font-mono">{t.batchNumber}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={t.type === 'Purchase' ? 'success' : 'primary'}
                          size="sm"
                        >
                          {t.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold font-mono">
                        {t.type === 'Dispense' ? `-${t.quantity}` : `+${t.quantity}`}
                      </td>
                      <td className="py-3 px-4">{t.staffName}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{t.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISPENSE MODAL */}
      {dispenseRx && (
        <Modal
          isOpen={!!dispenseRx}
          onClose={() => setDispenseRx(null)}
          title={`Dispense Prescription: ${dispenseRx.id}`}
          description={`Patient: ${dispenseRx.patientName} | Prescriber: ${dispenseRx.doctorName}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {dispenseError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{dispenseError}</span>
              </div>
            )}

            <div className="space-y-3">
              {dispenseRx.items.map((item) => {
                const med = medicines.find((m) => m.id === item.medicineId);
                const currentInfo = dispenseBatchMap[item.id] || { batchId: '', quantity: 0 };
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">
                          {item.medicineName} ({item.dosage})
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Prescribed: {item.quantityPrescribed} units • Already Dispensed:{' '}
                          {item.quantityDispensed || 0}
                        </p>
                      </div>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {item.frequency}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          Select Available Batch
                        </label>
                        <select
                          value={currentInfo.batchId}
                          onChange={(e) =>
                            setDispenseBatchMap({
                              ...dispenseBatchMap,
                              [item.id]: { ...currentInfo, batchId: e.target.value },
                            })
                          }
                          className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-900 dark:text-white"
                        >
                          {med?.batches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.batchNumber} (Avail: {b.quantityAvailable} | Exp: {b.expiryDate})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          Quantity to Dispense (Units)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={item.quantityPrescribed - (item.quantityDispensed || 0)}
                          value={currentInfo.quantity}
                          onChange={(e) =>
                            setDispenseBatchMap({
                              ...dispenseBatchMap,
                              [item.id]: { ...currentInfo, quantity: Number(e.target.value) },
                            })
                          }
                          className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDispenseRx(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispense}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-xs"
              >
                Confirm & Fulfill Dispense
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT OFFICIAL PRESCRIPTION MODAL */}
      {printRx && (
        <Modal
          isOpen={!!printRx}
          onClose={() => setPrintRx(null)}
          title="Official Medical Prescription Document"
          description="Printable physician order sheet for pharmacy verification."
          maxWidth="2xl"
        >
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6 text-xs text-slate-900 dark:text-white">
            {/* Hospital Branding Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black tracking-tight text-sky-700 dark:text-sky-400">
                  MEDISYNC GENERAL HOSPITAL
                </h2>
                <p className="text-[11px] text-slate-500">
                  Level 1 Trauma & Academic Medical Center • 100 Hospital Drive, Healthcare City
                </p>
                <p className="text-[10px] text-slate-400">Phone: +1 (555) 010-0000 • Fax: +1 (555) 010-0001</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold">{printRx.id}</span>
                <p className="text-[11px] text-slate-500">Date: {printRx.date}</p>
              </div>
            </div>

            {/* Patient & Doctor Meta */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Patient Details</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{printRx.patientName}</p>
                <p className="text-[11px] text-slate-500">Patient ID: {printRx.patientId}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Prescribing Physician</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{printRx.doctorName}</p>
                <p className="text-[11px] text-slate-500">Diagnosis: {printRx.diagnosis}</p>
              </div>
            </div>

            {/* Prescribed Items Symbol Rx */}
            <div className="space-y-3">
              <span className="text-2xl font-serif font-black text-sky-600 block">℞</span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {printRx.items.map((item, idx) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">
                        {idx + 1}. {item.medicineName} ({item.dosage})
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        Sig: {item.frequency} for {item.duration} • Route: {item.route}
                      </p>
                      <p className="text-[10px] text-slate-400 italic">"{item.instructions}"</p>
                    </div>
                    <div className="text-right font-mono font-bold">
                      Disp: #{item.quantityPrescribed}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Signature line */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
              <div className="text-[10px] text-slate-400">
                Valid for dispensing within 30 days of issue.
              </div>
              <div className="text-center w-48">
                <div className="border-b border-slate-400 h-8 mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {printRx.doctorName}
                </span>
                <p className="text-[10px] text-slate-400">Attending Physician Signature</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium inline-flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD MEDICINE MODAL */}
      <Modal
        isOpen={isAddMedModalOpen}
        onClose={() => setIsAddMedModalOpen(false)}
        title="Add Medicine to Formulary"
        description="Add a new pharmaceutical product, manufacturer details, and initial stock batch."
        maxWidth="xl"
      >
        <form onSubmit={handleAddMedSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lipitor"
                value={newMedForm.brandName}
                onChange={(e) => setNewMedForm({ ...newMedForm, brandName: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Generic Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Atorvastatin Calcium"
                value={newMedForm.genericName}
                onChange={(e) => setNewMedForm({ ...newMedForm, genericName: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dosage Form
              </label>
              <select
                value={newMedForm.dosageForm}
                onChange={(e) =>
                  setNewMedForm({ ...newMedForm, dosageForm: e.target.value as any })
                }
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Ointment">Ointment</option>
                <option value="IV Fluid">IV Fluid</option>
                <option value="Inhaler">Inhaler</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Strength
              </label>
              <input
                type="text"
                placeholder="e.g. 500 mg"
                value={newMedForm.strength}
                onChange={(e) => setNewMedForm({ ...newMedForm, strength: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Antibiotic"
                value={newMedForm.category}
                onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unit Selling Price ($)
              </label>
              <input
                type="number"
                step="0.1"
                value={newMedForm.unitPrice}
                onChange={(e) =>
                  setNewMedForm({ ...newMedForm, unitPrice: Number(e.target.value) })
                }
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Initial Stock Units
              </label>
              <input
                type="number"
                value={newMedForm.initialQuantity}
                onChange={(e) =>
                  setNewMedForm({ ...newMedForm, initialQuantity: Number(e.target.value) })
                }
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reorder Threshold
              </label>
              <input
                type="number"
                value={newMedForm.reorderLevel}
                onChange={(e) =>
                  setNewMedForm({ ...newMedForm, reorderLevel: Number(e.target.value) })
                }
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddMedModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs"
            >
              Save Medicine
            </button>
          </div>
        </form>
      </Modal>

      {/* RECEIVE BATCH MODAL */}
      <Modal
        isOpen={isReceiveBatchOpen}
        onClose={() => setIsReceiveBatchOpen(false)}
        title="Receive Pharmaceutical Stock Batch"
        description="Record incoming supply shipments with batch numbers and expiration dates."
        maxWidth="lg"
      >
        <form onSubmit={handleReceiveBatchSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Medicine *
            </label>
            <select
              value={batchTargetMedId}
              onChange={(e) => setBatchTargetMedId(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brandName} ({m.genericName}) • Stock: {m.totalStock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Batch Number *
              </label>
              <input
                type="text"
                required
                value={batchForm.batchNumber}
                onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={batchForm.expiryDate}
                onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quantity Units *
              </label>
              <input
                type="number"
                required
                min={1}
                value={batchForm.quantityAvailable}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, quantityAvailable: Number(e.target.value) })
                }
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.1"
                value={batchForm.unitCost}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, unitCost: Number(e.target.value) })
                }
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Selling Price ($)
              </label>
              <input
                type="number"
                step="0.1"
                value={batchForm.sellingPrice}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, sellingPrice: Number(e.target.value) })
                }
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsReceiveBatchOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-xs"
            >
              Confirm Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
