import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Copy, UserMinus } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import { SkeletonList } from '../../../components/ui/Skeleton';
import { useRemoveMember } from '../../../hooks/useGroups';
import { useToast } from '../../../hooks/useToast';
import { useStore } from '../../../store/useStore';
import type { Group, GroupMember } from '../../../types';

interface Props {
  groupId:   string;
  group:     Group | null;
  members:   GroupMember[];
  isLoading: boolean;
  isAdmin:   boolean;
}

export default function MembersTab({ groupId, group, members, isLoading, isAdmin }: Props) {
  const user         = useStore((s) => s.user);
  const { toast }    = useToast();
  const removeMember = useRemoveMember();
  const [copied,     setCopied]     = useState(false);
  const [removing,   setRemoving]   = useState<string | null>(null);

  const handleCopyCode = async () => {
    if (!group?.invite_code) return;
    await navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Invite code copied!');
  };

  const handleRemove = async (member: GroupMember) => {
    if (!confirm(`Remove ${member.user?.name ?? member.user?.email ?? 'this member'}?`)) return;
    setRemoving(member.user_id);
    try {
      await removeMember.mutateAsync({ groupId, userId: member.user_id });
      toast.success('Member removed');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="tab-panel">
      {/* Invite Code Section */}
      {group?.invite_enabled && (
        <div className="invite-code-card">
          <div className="invite-code-info">
            <p className="invite-code-label">Invite Code</p>
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

      {/* Members list */}
      <div className="members-section-label">
        {members.length} Member{members.length !== 1 ? 's' : ''}
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : (
        <div className="member-list">
          {members.map((member) => {
            const name     = member.user?.name ?? member.user?.email ?? 'Unknown';
            const isMe     = member.user_id === user?.id;
            const joinDate = (() => {
              try { return format(parseISO(member.joined_at), 'MMM d, yyyy'); }
              catch { return ''; }
            })();

            return (
              <div key={member.id} className="member-row">
                <Avatar src={member.user?.avatar_url} name={name} size={44} />
                <div className="member-row-info">
                  <p className="member-row-name">
                    {name}
                    {isMe && <span className="member-you-badge">You</span>}
                    {member.role === 'admin' && <span className="member-admin-badge">Admin</span>}
                  </p>
                  <p className="member-row-joined">Joined {joinDate}</p>
                </div>
                {isAdmin && !isMe && (
                  <button
                    className="member-remove-btn"
                    onClick={() => handleRemove(member)}
                    disabled={removing === member.user_id}
                    aria-label="Remove member"
                  >
                    <UserMinus size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
