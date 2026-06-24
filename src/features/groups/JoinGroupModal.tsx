import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import { useJoinGroup } from '../../hooks/useGroups';
import { useToast } from '../../hooks/useToast';

interface Props {
  open:    boolean;
  onClose: () => void;
}

export default function JoinGroupModal({ open, onClose }: Props) {
  const navigate    = useNavigate();
  const { toast }   = useToast();
  const joinGroup   = useJoinGroup();
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 9) return;

    try {
      const group = await joinGroup.mutateAsync(trimmed);
      toast.success(`Joined "${group.name}"!`);
      setCode('');
      onClose();
      navigate(`/groups/${group.id}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to join group');
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
    setCode(val);
  };

  return (
    <Modal open={open} onClose={onClose} title="Join Group" maxWidth="400px">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="join-code-illustration">
          <span className="join-code-icon">🔗</span>
          <p className="join-code-hint">Enter the 9-character invite code shared by your group admin.</p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="invite-code">Invite Code</label>
          <input
            id="invite-code"
            type="text"
            className="form-input form-input--code"
            placeholder="A7K9P2M4X"
            value={code}
            onChange={handleCodeChange}
            autoFocus
            spellCheck={false}
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={9}
            required
          />
          <p className="form-hint">{code.length}/9 characters</p>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={code.length !== 9 || joinGroup.isPending}
          id="join-group-submit"
        >
          {joinGroup.isPending ? 'Joining…' : 'Join Group'}
        </button>
      </form>
    </Modal>
  );
}
