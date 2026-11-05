import React, { useState, useEffect } from 'react';
import {
  TestTube2,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  DollarSign,
  AlertCircle,
  FlaskConical,
  Microscope,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { LabOrder, LabTest, Patient } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const LaboratoryManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog'>('orders');

  const [labOrders, setLabOrders] = useState<LabOrder[]>(db.getLabOrders());
  const [labTests, setLabTests] = useState<LabTest[]>(db.getLabTests());
  const [patients, setPatients] = useState<Patient[]>(db.getPatients());

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Results Entry Modal
  const [resultsOrder, setResultsOrder] = useState<LabOrder | null>(null);
  const [resultsMap, setResultsMap] = useState<
    Record<
      string,
      {
        resultValue: string;
        flag: 'Normal' | 'High' | 'Low' | 'Critical';
        interpretation: string;
      }
    >
  >({});

  // Printable Report Modal
  const [printOrder, setPrintOrder] = useState<LabOrder | null>(null);

  // New Order Modal
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    patientId: patients[0]?.id || '',
    priority: 'Routine' as LabOrder['priority'],
    selectedTestIds: [labTests[0]?.id || ''],
    clinicalNotes: '',
  });

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setLabOrders(db.getLabOrders());
      setLabTests(db.getLabTests());
      setPatients(db.getPatients());
    });
    return unsub;
  }, []);

  const handleOpenEnterResults = (order: LabOrder) => {
    setResultsOrder(order);
    const initialMap: Record<
      string,
      { resultValue: string; flag: 'Normal' | 'High' | 'Low' | 'Critical'; interpretation: string }
    > = {};

    order.items.forEach((item) => {
      initialMap[item.id] = {
        resultValue: item.resultValue || '',
        flag: item.flag || 'Normal',
        interpretation: item.interpretation || 'Test result evaluated within physiological thresholds.',
      };
    });
    setResultsMap(initialMap);
  };

  const handleConfirmResults = () => {
    if (!resultsOrder) return;
    db.recordLabResults(resultsOrder.id, resultsMap, currentUser.name, currentUser);
    setResultsOrder(null);
    alert('Laboratory test results logged, verified, and sent to attending physician.');
  };

  const handleStatusUpdate = (orderId: string, status: LabOrder['status']) => {
    db.updateLabOrderStatus(orderId, status, currentUser);
  };

  const handleNewOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === orderForm.patientId);
    if (!patient) return;

    const items = orderForm.selectedTestIds.map((testId) => {
      const test = labTests.find((t) => t.id === testId);
      return {
        id: `LBO-${Date.now().toString().slice(-4)}-${testId}`,
        testId: test?.id || testId,
        testName: test?.testName || 'Laboratory Test',
        category: test?.category || 'Biochemistry',
        status: 'Ordered' as const,
        normalRange: test?.normalRange || '',
        unit: test?.unit || '',
      };
    });

    db.createLabOrder(
      {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorId: currentUser.staffId || 'STF-101',
        doctorName: currentUser.name,
        priority: orderForm.priority,
        status: 'Ordered',
        clinicalNotes: orderForm.clinicalNotes,
        items,
      },
      currentUser
    );

    setIsNewOrderModalOpen(false);
  };

  const filteredOrders = labOrders.filter((o) => {
    const matchesSearch =
      o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || o.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-purple-600" /> Laboratory Information System (LIS)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track diagnostic specimen collections, verify biochemical ranges, and flag critical test results
          </p>
        </div>

        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Order Laboratory Test
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Specimens & Orders Queue
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {labOrders.filter((o) => o.status !== 'Completed').length} Pending
          </span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Diagnostic Test Catalog
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {labTests.length}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Patient Name, or Doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:border-purple-500 focus:outline-hidden"
        >
          <option value="ALL">All Priorities</option>
          <option value="STAT">STAT (Immediate Emergency)</option>
          <option value="Urgent">Urgent</option>
          <option value="Routine">Routine</option>
        </select>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const isCompleted = order.status === 'Completed';
            const isSTAT = order.priority === 'STAT';
            return (
              <div
                key={order.id}
                className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-4 text-xs ${
                  isSTAT
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-400/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {order.id}
                      </span>
                      <Badge
                        variant={isSTAT ? 'danger' : order.priority === 'Urgent' ? 'warning' : 'primary'}
                        size="sm"
                        dot
                      >
                        {order.priority}
                      </Badge>
                      <Badge
                        variant={isCompleted ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {order.patientName}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Ordered by {order.doctorName} • {new Date(order.orderDate).toLocaleString()}
                    </p>
                  </div>

                  {isCompleted && (
                    <button
                      onClick={() => setPrintOrder(order)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600"
                      title="Print Laboratory Report"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Items List */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between text-[11px] border-b last:border-0 border-slate-200/40 dark:border-slate-700/40 pb-1.5 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {it.testName}
                        </p>
                        <p className="text-[10px] text-slate-400">Normal: {it.normalRange}</p>
                      </div>

                      <div className="text-right">
                        {it.resultValue ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-bold font-mono text-slate-900 dark:text-white">
                              {it.resultValue} {it.unit}
                            </span>
                            <Badge
                              variant={
                                it.flag === 'Normal'
                                  ? 'success'
                                  : it.flag === 'Critical'
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                            >
                              {it.flag}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">{it.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Workflow Transitions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {order.clinicalNotes || 'Standard analysis'}
                  </span>

                  <div className="flex items-center gap-2">
                    {order.status === 'Ordered' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'Sample Collected')}
                        className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium text-[11px] shadow-xs"
                      >
                        Collect Sample
                      </button>
                    )}

                    {order.status === 'Sample Collected' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'Processing')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-[11px] shadow-xs"
                      >
                        Start Processing
                      </button>
                    )}

                    {order.status === 'Processing' && (
                      <button
                        onClick={() => handleOpenEnterResults(order)}
                        className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-[11px] shadow-xs"
                      >
                        Enter Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TEST CATALOG */}
      {activeTab === 'catalog' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Test Code</th>
                  <th className="py-3 px-4">Test Name & Specimen</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Turnaround Time</th>
                  <th className="py-3 px-4">Standard Biological Reference Range</th>
                  <th className="py-3 px-4 text-right">Fee ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {labTests.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-purple-600">{t.testCode}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{t.testName}</p>
                      <p className="text-[11px] text-slate-400">Specimen: {t.specimenType}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="primary" size="sm">
                        {t.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {t.turnaroundTime}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                      {t.normalRange}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      ${t.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ENTER RESULTS MODAL */}
      {resultsOrder && (
        <Modal
          isOpen={!!resultsOrder}
          onClose={() => setResultsOrder(null)}
          title={`Enter Laboratory Diagnostic Results: ${resultsOrder.id}`}
          description={`Patient: ${resultsOrder.patientName} | Ordered by: ${resultsOrder.doctorName}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-3">
              {resultsOrder.items.map((item) => {
                const currentData = resultsMap[item.id] || {
                  resultValue: '',
                  flag: 'Normal',
                  interpretation: '',
                };
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white">{item.testName}</h4>
                      <span className="font-mono text-[11px] text-slate-500">
                        Ref: {item.normalRange}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          Measured Value *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={`Value in ${item.unit || 'units'}`}
                          value={currentData.resultValue}
                          onChange={(e) =>
                            setResultsMap({
                              ...resultsMap,
                              [item.id]: { ...currentData, resultValue: e.target.value },
                            })
                          }
                          className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          Diagnostic Flag
                        </label>
                        <select
                          value={currentData.flag}
                          onChange={(e) =>
                            setResultsMap({
                              ...resultsMap,
                              [item.id]: { ...currentData, flag: e.target.value as any },
                            })
                          }
                          className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-900 dark:text-white"
                        >
                          <option value="Normal">Normal (Within Reference Limits)</option>
                          <option value="High">High (Elevated)</option>
                          <option value="Low">Low (Depressed)</option>
                          <option value="Critical">Critical (STAT Physician Alert)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Technician Clinical Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="Pathologist/Technician notes on specimen or interpretation..."
                        value={currentData.interpretation}
                        onChange={(e) =>
                          setResultsMap({
                            ...resultsMap,
                            [item.id]: { ...currentData, interpretation: e.target.value },
                          })
                        }
                        className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setResultsOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResults}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs"
              >
                Verify & Release Results
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT OFFICIAL LAB REPORT MODAL */}
      {printOrder && (
        <Modal
          isOpen={!!printOrder}
          onClose={() => setPrintOrder(null)}
          title="Official Diagnostic Laboratory Report"
          description="Certified laboratory examination results sheet."
          maxWidth="2xl"
        >
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6 text-xs text-slate-900 dark:text-white">
            <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black tracking-tight text-purple-700 dark:text-purple-400">
                  MEDISYNC CENTRAL PATHOLOGY & DIAGNOSTICS
                </h2>
                <p className="text-[11px] text-slate-500">
                  Accredited Clinical Reference Laboratory • CAP & CLIA Certified
                </p>
                <p className="text-[10px] text-slate-400">Report Authorized by Kevin Miller, MLS (ASCP)</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold">{printOrder.id}</span>
                <p className="text-[11px] text-slate-500">Priority: {printOrder.priority}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Patient Details</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{printOrder.patientName}</p>
                <p className="text-[11px] text-slate-500">Patient ID: {printOrder.patientId}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Ordering Physician</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{printOrder.doctorName}</p>
                <p className="text-[11px] text-slate-500">Reported: {printOrder.reportedAt || printOrder.orderDate}</p>
              </div>
            </div>

            {/* Test Results Table */}
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500">
                Examination Results & Biomarkers
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Test Investigation</th>
                      <th className="p-3">Measured Result</th>
                      <th className="p-3">Reference Interval</th>
                      <th className="p-3">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {printOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-semibold">{item.testName}</td>
                        <td className="p-3 font-mono font-bold">
                          {item.resultValue || 'N/A'} {item.unit}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{item.normalRange}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              item.flag === 'Normal'
                                ? 'success'
                                : item.flag === 'Critical'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {item.flag || 'Normal'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
              <p className="text-[10px] text-slate-400 max-w-sm">
                These results pertain exclusively to the specimen submitted. Critical values are phoned immediately to the attending physician.
              </p>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium inline-flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Certified Lab Report
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* NEW LAB ORDER MODAL */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Order New Diagnostic Laboratory Tests"
        description="Select patient, priority, and diagnostic test profiles."
        maxWidth="xl"
      >
        <form onSubmit={handleNewOrderSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              value={orderForm.patientId}
              onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Test Priority Level
            </label>
            <select
              value={orderForm.priority}
              onChange={(e) =>
                setOrderForm({ ...orderForm, priority: e.target.value as LabOrder['priority'] })
              }
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
            >
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="STAT">STAT (Immediate Emergency Analysis)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Diagnostic Tests
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl">
              {labTests.map((test) => {
                const isChecked = orderForm.selectedTestIds.includes(test.id);
                return (
                  <label
                    key={test.id}
                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                      isChecked
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOrderForm({
                            ...orderForm,
                            selectedTestIds: [...orderForm.selectedTestIds, test.id],
                          });
                        } else {
                          setOrderForm({
                            ...orderForm,
                            selectedTestIds: orderForm.selectedTestIds.filter((id) => id !== test.id),
                          });
                        }
                      }}
                      className="rounded text-purple-600 mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {test.testName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {test.category} • ${test.price.toFixed(2)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Clinical Indications / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Pre-operative assessment, monitoring electrolyte levels..."
              value={orderForm.clinicalNotes}
              onChange={(e) => setOrderForm({ ...orderForm, clinicalNotes: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewOrderModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs"
            >
              Dispatch Lab Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
