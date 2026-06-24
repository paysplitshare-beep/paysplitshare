import { useState } from 'react';
import { ChevronLeft, X, Check } from 'lucide-react';
import BottomSheet from '../../components/ui/BottomSheet';
import Avatar from '../../components/ui/Avatar';
import { useAddExpense, useCategories } from '../../hooks/useGroups';
import { useToast } from '../../hooks/useToast';
import { useStore } from '../../store/useStore';
import { CURRENCIES, SYSTEM_CATEGORIES } from '../../types';
import type { GroupMember, CreateExpenseInput } from '../../types';

interface Props {
  open:           boolean;
  onClose:        () => void;
  groupId:        string;
  groupCurrency:  string;
  members:        GroupMember[];
}

type SheetPhase = 'form' | 'payer';

export default function NewBillSheet({
  open, onClose, groupId, groupCurrency, members,
}: Props) {
  const user       = useStore((s) => s.user);
  const { toast }  = useToast();
  const addExpense = useAddExpense();
  const { data: dbCategories } = useCategories();

  // Use DB categories if available, otherwise fall back to static list
  const categories = dbCategories && dbCategories.length > 0
    ? dbCategories
    : SYSTEM_CATEGORIES.map((c, i) => ({ ...c, id: String(i), is_system: true, created_by: null, created_at: '' }));

  // ── Form State ────────────────────────────────────────────
  const [phase,        setPhase]        = useState<SheetPhase>('form');
  const [title,        setTitle]        = useState('');
  const [amount,       setAmount]       = useState('');
  const [categoryId,   setCategoryId]   = useState<string | null>(null);
  const [currency,     setCurrency]     = useState(groupCurrency || 'INR');
  const [date,         setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [payerId,      setPayerId]      = useState(user?.id ?? '');
  const [payerSearch,  setPayerSearch]  = useState('');

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol ?? currency;

  const filteredMembers = members.filter((m) => {
    const name  = m.user?.name ?? m.user?.email ?? '';
    const email = m.user?.email ?? '';
    return name.toLowerCase().includes(payerSearch.toLowerCase()) ||
           email.toLowerCase().includes(payerSearch.toLowerCase());
  });

  const selectedPayer = members.find(m => m.user_id === payerId);
  const payerDisplay  = selectedPayer?.user?.name ??
                        selectedPayer?.user?.email ??
                        'Unknown';

  const resetForm = () => {
    setPhase('form');
    setTitle('');
    setAmount('');
    setCategoryId(null);
    setCurrency(groupCurrency || 'INR');
    setDate(new Date().toISOString().split('T')[0]);
    setPayerId(user?.id ?? '');
    setPayerSearch('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const memberIds = members.map(m => m.user_id);

    const input: CreateExpenseInput = {
      group_id:     groupId,
      title:        title.trim(),
      amount:       parsedAmount,
      currency,
      category_id:  categoryId,
      paid_by:      payerId,
      split_method: 'equal',
      date,
      member_ids:   memberIds,
    };

    try {
      await addExpense.mutateAsync(input);
      toast.success('Bill added!');
      handleClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to add bill');
    }
  };

  return (
    <BottomSheet open={open} onClose={handleClose} height="92vh">
      {/* ── PAYER PICKER PHASE ────────────────────────────── */}
      {phase === 'payer' ? (
        <div className="bs-content">
          <div className="bs-payer-header">
            <button
              className="bs-back-btn"
              onClick={() => setPhase('form')}
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <h2 className="bs-title">Who Paid?</h2>
          </div>

          {/* Search */}
          <div className="bs-payer-search">
            <input
              type="text"
              className="form-input"
              placeholder="Search members…"
              value={payerSearch}
              onChange={(e) => setPayerSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Member list */}
          <div className="bs-member-list">
            {filteredMembers.map((member) => {
              const name    = member.user?.name ?? member.user?.email ?? 'Unknown';
              const isMe    = member.user_id === user?.id;
              const checked = member.user_id === payerId;
              return (
                <button
                  key={member.user_id}
                  className={`bs-member-row${checked ? ' bs-member-row--selected' : ''}`}
                  onClick={() => { setPayerId(member.user_id); setPhase('form'); }}
                >
                  <Avatar
                    src={member.user?.avatar_url}
                    name={name}
                    size={42}
                  />
                  <div className="bs-member-info">
                    <span className="bs-member-name">
                      {name}{isMe ? ' (You)' : ''}
                    </span>
                    {member.user?.email && (
                      <span className="bs-member-email">{member.user.email}</span>
                    )}
                  </div>
                  {checked && (
                    <div className="bs-member-check">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (

      /* ── BILL FORM PHASE ──────────────────────────────── */
        <div className="bs-content">
          {/* Header */}
          <div className="bs-header">
            <h2 className="bs-title">New Bill</h2>
            <button className="bs-close-btn" onClick={handleClose} aria-label="Close">
              <X size={22} />
            </button>
          </div>

          <div className="bs-scroll">
            {/* Bill Name */}
            <div className="bs-field">
              <label className="bs-label">Bill Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dinner at restaurant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                id="bill-name-input"
              />
            </div>

            {/* Amount */}
            <div className="bs-field">
              <label className="bs-label">Amount</label>
              <div className="bs-amount-wrap">
                <span className="bs-currency-symbol">{currencySymbol}</span>
                <input
                  type="number"
                  className="bs-amount-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  id="bill-amount-input"
                />
              </div>
            </div>

            {/* Category Grid */}
            <div className="bs-field">
              <label className="bs-label">Category</label>
              <div className="bs-category-grid">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`bs-cat-btn${categoryId === cat.id ? ' bs-cat-btn--active' : ''}`}
                    onClick={() => setCategoryId(cat.id === categoryId ? null : cat.id)}
                    style={categoryId === cat.id ? { background: `${cat.color}33`, borderColor: cat.color } : {}}
                    title={cat.name}
                  >
                    <span className="bs-cat-icon">{cat.icon}</span>
                    <span className="bs-cat-name">{cat.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Currency + Date row */}
            <div className="bs-row">
              <div className="bs-field bs-field--half">
                <label className="bs-label">Currency</label>
                <select
                  className="form-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bs-field bs-field--half">
                <label className="bs-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Paid By */}
            <div className="bs-field">
              <label className="bs-label">Paid By</label>
              <button
                type="button"
                className="bs-payer-btn"
                onClick={() => setPhase('payer')}
                id="paid-by-btn"
              >
                <Avatar
                  src={selectedPayer?.user?.avatar_url}
                  name={payerDisplay}
                  size={34}
                />
                <span className="bs-payer-name">
                  {payerDisplay}
                  {selectedPayer?.user_id === user?.id ? ' (You)' : ''}
                </span>
                <ChevronLeft size={16} style={{ transform: 'rotate(180deg)', marginLeft: 'auto' }} />
              </button>
            </div>

            {/* Split info */}
            <div className="bs-split-info">
              <span>Split equally among</span>
              <strong>{members.length} member{members.length !== 1 ? 's' : ''}</strong>
              {amount && !isNaN(parseFloat(amount)) && (
                <span style={{ color: 'var(--text-muted)' }}>
                  ·&nbsp;{currencySymbol}{(parseFloat(amount) / members.length).toFixed(2)} each
                </span>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="bs-footer">
            <button
              className="btn btn-primary btn-full"
              onClick={handleSubmit}
              disabled={!title.trim() || !amount || parseFloat(amount) <= 0 || addExpense.isPending}
              id="add-bill-submit"
            >
              {addExpense.isPending ? 'Adding…' : 'Add Bill'}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
