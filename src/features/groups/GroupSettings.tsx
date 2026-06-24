import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import { useUpdateGroup, useArchiveGroup } from '../../hooks/useGroups';
import { useToast } from '../../hooks/useToast';
import { Copy, Archive } from 'lucide-react';
import type { Group, GroupType } from '../../types';

interface Props {
  open:    boolean;
  onClose: () => void;
  group:   Group;
  isAdmin: boolean;
}

const GROUP_TYPES: { value: GroupType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'trip',    label: 'Trip' },
  { value: 'home',    label: 'Home' },
  { value: 'event',   label: 'Event' },
];

export default function GroupSettings({ open, onClose, group, isAdmin }: Props) {
  const navigate      = useNavigate();
  const { toast }     = useToast();
  const updateGroup   = useUpdateGroup();
  const archiveGroup  = useArchiveGroup();

  const [name,          setName]          = useState(group.name);
  const [type,          setType]          = useState<GroupType>(group.type);
  const [inviteEnabled, setInviteEnabled] = useState(group.invite_enabled);
  const [copied,        setCopied]        = useState(false);
  const [archiving,     setArchiving]     = useState(false);

  const handleSave = async () => {
    try {
      await updateGroup.mutateAsync({
        id:             group.id,
        name:           name.trim(),
        type,
        invite_enabled: inviteEnabled,
      });
      toast.success('Group updated!');
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update group');
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Invite code copied!');
  };

  const handleArchive = async () => {
    if (!confirm('Archive this group? Members will no longer be able to add expenses.')) return;
    setArchiving(true);
    try {
      await archiveGroup.mutateAsync(group.id);
      toast.success('Group archived');
      onClose();
      navigate('/groups');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to archive group');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Group Settings" maxWidth="460px">
      <div className="modal-form">
        {/* Group Info */}
        {isAdmin && (
          <>
            <div className="form-section-label">Group Information</div>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-group-name">Group Name</label>
              <input
                id="settings-group-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-group-type">Group Type</label>
              <select
                id="settings-group-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as GroupType)}
              >
                {GROUP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={handleSave}
              disabled={!name.trim() || updateGroup.isPending}
            >
              {updateGroup.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        )}

        {/* Invite Code */}
        <div className="form-section-label" style={{ marginTop: '24px' }}>Invite Code</div>
        {isAdmin && (
          <div className="settings-toggle-row">
            <div>
              <p className="settings-toggle-label">Enable Invite Link</p>
              <p className="settings-toggle-sub">Allow others to join via invite code</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={inviteEnabled}
                onChange={(e) => setInviteEnabled(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        )}
        {group.invite_enabled && (
          <div className="invite-code-card">
            <div className="invite-code-info">
              <p className="invite-code-label">Share this code</p>
              <p className="invite-code-value">{group.invite_code}</p>
            </div>
            <button
              className={`btn btn-secondary btn-sm${copied ? ' btn--success' : ''}`}
              onClick={handleCopyCode}
            >
              <Copy size={14} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {/* Archive */}
        {isAdmin && !group.archived_at && (
          <>
            <div className="form-section-label danger-label" style={{ marginTop: '32px' }}>
              Danger Zone
            </div>
            <button
              className="btn btn-danger btn-full"
              onClick={handleArchive}
              disabled={archiving}
            >
              <Archive size={16} />
              {archiving ? 'Archiving…' : 'Archive Group'}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
