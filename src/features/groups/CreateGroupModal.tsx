import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import { useCreateGroup } from '../../hooks/useGroups';
import { useToast } from '../../hooks/useToast';
import type { GroupType } from '../../types';

const GROUP_TYPES: { value: GroupType; label: string; icon: string }[] = [
  { value: 'general', label: 'General',  icon: '🗂️' },
  { value: 'trip',    label: 'Trip',     icon: '✈️' },
  { value: 'home',    label: 'Home',     icon: '🏠' },
  { value: 'event',   label: 'Event',    icon: '🎉' },
];

interface Props {
  open:    boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ open, onClose }: Props) {
  const navigate       = useNavigate();
  const { toast }      = useToast();
  const createGroup    = useCreateGroup();

  const [name,     setName]     = useState('');
  const [type,     setType]     = useState<GroupType>('general');
  const [currency, setCurrency] = useState('INR');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const group = await createGroup.mutateAsync({
        name:             name.trim(),
        type,
        default_currency: currency,
      });
      toast.success(`"${group.name}" created!`);
      setName('');
      setType('general');
      onClose();
      navigate(`/groups/${group.id}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create group');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Group" maxWidth="440px">
      <form onSubmit={handleSubmit} className="modal-form">
        {/* Group Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="group-name">Group Name</label>
          <input
            id="group-name"
            type="text"
            className="form-input"
            placeholder="e.g. Goa Trip 2025"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Group Type */}
        <div className="form-group">
          <label className="form-label">Group Type</label>
          <div className="type-grid">
            {GROUP_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`type-option${type === t.value ? ' type-option--active' : ''}`}
                onClick={() => setType(t.value)}
              >
                <span className="type-option-icon">{t.icon}</span>
                <span className="type-option-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="form-group">
          <label className="form-label" htmlFor="group-currency">Default Currency</label>
          <select
            id="group-currency"
            className="form-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="INR">₹ INR – Indian Rupee</option>
            <option value="USD">$ USD – US Dollar</option>
            <option value="EUR">€ EUR – Euro</option>
            <option value="GBP">£ GBP – British Pound</option>
            <option value="AUD">A$ AUD – Australian Dollar</option>
            <option value="SGD">S$ SGD – Singapore Dollar</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={!name.trim() || createGroup.isPending}
          id="create-group-submit"
        >
          {createGroup.isPending ? 'Creating…' : 'Create Group'}
        </button>
      </form>
    </Modal>
  );
}
