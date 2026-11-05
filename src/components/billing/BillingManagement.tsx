import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  DollarSign,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  Receipt,
  User,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';
import { Invoice, Payment, InsuranceClaim, Patient, InvoiceItem } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const BillingManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'insurance'>('invoices');

  const [invoices, setInvoices] = useState<Invoice[]>(db.getInvoices());
  const [payments, setPayments] = useState<Payment[]>(db.getPayments());
  const [claims, setClaims] = useState<InsuranceClaim[]>(db.getInsuranceClaims());
  const [patients, setPatients] = useState<Patient[]>(db.getPatients());

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Record Payment Modal
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('Card');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Print Invoice Modal
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  // Create Invoice Modal
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [newInvoicePatientId, setNewInvoicePatientId] = useState(patients[0]?.id || '');
  const [lineItems, setLineItems] = useState<Omit<InvoiceItem, 'id'>[]>([
    {
      description: 'Physician General Consultation Fee',
      category: 'Consultation',
      quantity: 1,
      unitPrice: 120.0,
      amount: 120.0,
    },
  ]);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0.05); // 5%

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setInvoices(db.getInvoices());
      setPayments(db.getPayments());
      setClaims(db.getInsuranceClaims());
      setPatients(db.getPatients());
    });
    return unsub;
  }, []);

  const handleOpenPayment = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setPaymentAmount(inv.balanceDue);
    setPaymentMethod('Card');
    setPaymentNotes('Settlement at hospital cash billing counter.');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    const res = db.recordPayment(
      paymentInvoice.id,
      paymentAmount,
      paymentMethod,
      paymentNotes,
      currentUser
    );

    if (!res.success) {
      alert(res.error || 'Failed to record payment.');
    } else {
      setPaymentInvoice(null);
      alert('Payment successfully received and credited to patient invoice.');
    }
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: 'Laboratory Diagnostic Screening',
        category: 'Laboratory',
        quantity: 1,
        unitPrice: 45.0,
        amount: 45.0,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    const target = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      target.amount = Number((target.quantity * target.unitPrice).toFixed(2));
    }
    updated[index] = target;
    setLineItems(updated);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      alert('Please include at least one billing line item.');
      return;
    }

    const created = db.createInvoice(
      newInvoicePatientId,
      lineItems,
      invoiceDiscount,
      taxRate,
      currentUser
    );

    setIsCreateInvoiceOpen(false);
    setPrintInvoice(created);
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch =
      i.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalGross = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const totalDue = invoices.reduce((sum, i) => sum + i.balanceDue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-600" /> Patient Billing, Invoicing & Payments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate itemized hospital bills, record partial payments, and manage insurance claims
          </p>
        </div>

        <button
          onClick={() => {
            setNewInvoicePatientId(patients[0]?.id || '');
            setLineItems([
              {
                description: 'Specialist Clinical Consultation',
                category: 'Consultation',
                quantity: 1,
                unitPrice: 150.0,
                amount: 150.0,
              },
            ]);
            setIsCreateInvoiceOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create New Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Invoiced Amount</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400">{invoices.length} Invoices Issued</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Payments Collected</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400">Settled via Cash, Card, UPI & Insurance</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Outstanding Balance Due</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            ${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400">Pending collections & copay balances</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'invoices'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Invoices Directory
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Payment Transactions
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('insurance')}
          className={`pb-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'insurance'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Insurance Claims Tracker
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {claims.length}
          </span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoices by ID, Patient Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-700 dark:text-slate-300 focus:border-sky-500 focus:outline-hidden"
        >
          <option value="ALL">All Statuses</option>
          <option value="Paid">Fully Paid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Unpaid">Unpaid</option>
        </select>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Issue & Due Date</th>
                  <th className="py-3 px-4">Line Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {inv.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{inv.patientName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{inv.patientId}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <p className="text-slate-900 dark:text-slate-200">Issued: {inv.issueDate}</p>
                      <p className="text-slate-400">Due: {inv.dueDate}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {inv.items.length} item(s) •{' '}
                      {inv.items.map((i) => i.category).slice(0, 2).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      ${inv.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      ${inv.amountPaid.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-rose-600 dark:text-rose-400 font-bold">
                      ${inv.balanceDue.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          inv.status === 'Paid'
                            ? 'success'
                            : inv.status === 'Partially Paid'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                        dot
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPrintInvoice(inv)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Print Official Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] shadow-xs"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Received By</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{p.id}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.paidAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {p.invoiceId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {p.patientName}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="primary" size="sm">
                        {p.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {p.transactionRef}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {p.receivedBy}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ${p.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INSURANCE CLAIMS */}
      {activeTab === 'insurance' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Insurance Provider</th>
                  <th className="py-3 px-4">Policy #</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Claimed Amount</th>
                  <th className="py-3 px-4">Filed Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {claims.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{c.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {c.patientName}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {c.providerName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {c.policyNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono">{c.invoiceId}</td>
                    <td className="py-3.5 px-4 font-bold font-mono">${c.claimAmount.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(c.filedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          c.status === 'Approved'
                            ? 'success'
                            : c.status === 'Under Review'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                        dot
                      >
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {paymentInvoice && (
        <Modal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          title={`Process Payment for Invoice ${paymentInvoice.id}`}
          description={`Patient: ${paymentInvoice.patientName} | Balance Due: $${paymentInvoice.balanceDue.toFixed(2)}`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Amount ($ USD) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min={0.01}
                max={paymentInvoice.balanceDue}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white font-mono font-bold text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Allows full or partial settlement. Maximum payable: ${paymentInvoice.balanceDue.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              >
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">Cash at Counter</option>
                <option value="UPI">UPI / Digital Instant</option>
                <option value="Bank Transfer">Bank Wire Transfer</option>
                <option value="Insurance">Insurance Co-Pay Settlement</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Transaction Notes & Remarks
              </label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
              >
                Confirm & Record ${paymentAmount.toFixed(2)}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PRINT OFFICIAL INVOICE MODAL */}
      {printInvoice && (
        <Modal
          isOpen={!!printInvoice}
          onClose={() => setPrintInvoice(null)}
          title="Official Hospital Billing Invoice"
          description="Detailed itemized patient fee statement."
          maxWidth="2xl"
        >
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6 text-xs text-slate-900 dark:text-white">
            <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black tracking-tight text-sky-700 dark:text-sky-400">
                  MEDISYNC HEALTHCARE SYSTEM
                </h2>
                <p className="text-[11px] text-slate-500">Hospital Billing & Financial Services Department</p>
                <p className="text-[10px] text-slate-400">Tax ID: 94-8819201 • Hospital Drive, Medical Center</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-bold">{printInvoice.id}</span>
                <p className="text-[11px] text-slate-500">Issued: {printInvoice.issueDate}</p>
                <p className="text-[11px] text-slate-500">Due: {printInvoice.dueDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Bill To</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{printInvoice.patientName}</p>
                <p className="text-[11px] text-slate-500">Patient ID: {printInvoice.patientId}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Payment Status</span>
                <div className="mt-1">
                  <Badge
                    variant={
                      printInvoice.status === 'Paid'
                        ? 'success'
                        : printInvoice.status === 'Partially Paid'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {printInvoice.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Service / Item Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {printInvoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold">{item.description}</td>
                      <td className="p-3 text-slate-500">{item.category}</td>
                      <td className="p-3 text-right font-mono">{item.quantity}</td>
                      <td className="p-3 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">${printInvoice.subtotal.toFixed(2)}</span>
                </div>
                {printInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">-${printInvoice.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Taxes:</span>
                  <span className="font-mono">${printInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Amount:</span>
                  <span className="font-mono">${printInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Amount Paid:</span>
                  <span className="font-mono">${printInvoice.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Balance Due:</span>
                  <span className="font-mono">${printInvoice.balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">
                Hospital billing inquiry line: 1-800-MEDISYNC-FIN
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium inline-flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Official Invoice
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE INVOICE MODAL */}
      <Modal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        title="Generate Itemized Patient Invoice"
        description="Add medical consultations, laboratory charges, medications, and room accommodations."
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              value={newInvoicePatientId}
              onChange={(e) => setNewInvoicePatientId(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.id}) • Insurer: {p.insuranceProvider || 'Self-pay'}
                </option>
              ))}
            </select>
          </div>

          {/* Line items list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white">Itemized Bill Charges</h4>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs font-semibold text-sky-600 hover:underline inline-flex items-center gap-1"
              >
                + Add Line Item
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Service / Item Description"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      value={item.category}
                      onChange={(e) => handleLineItemChange(idx, 'category', e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-900 dark:text-white"
                    >
                      <option value="Consultation">Consultation</option>
                      <option value="Laboratory">Laboratory</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Room & Bed">Room & Bed</option>
                      <option value="Procedure">Procedure</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        handleLineItemChange(idx, 'quantity', Number(e.target.value))
                      }
                      className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleLineItemChange(idx, 'unitPrice', Number(e.target.value))
                      }
                      className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Discount Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={invoiceDiscount}
                onChange={(e) => setInvoiceDiscount(Number(e.target.value))}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hospital Healthcare Tax (Rate 0.05 = 5%)
              </label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateInvoiceOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs"
            >
              Generate Invoice & Preview
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
