import { formatDistanceToNow, parseISO } from 'date-fns';
import { Activity } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';
import { SkeletonList } from '../../../components/ui/Skeleton';
import { useActivityLogs } from '../../../hooks/useGroups';
import type { ActivityLog } from '../../../types';

const ACTION_LABELS: Record<string, string> = {
  group_created:      'created the group',
  group_updated:      'updated group details',
  group_archived:     'archived the group',
  member_joined:      'joined the group',
  member_removed:     'was removed from the group',
  member_role_changed:'role was changed',
  expense_added:      'added a bill',
  expense_updated:    'updated a bill',
  expense_deleted:    'deleted a bill',
  settlement_recorded:'recorded a settlement',
};

const ACTION_ICONS: Record<string, string> = {
  group_created:      '🎉',
  group_updated:      '✏️',
  group_archived:     '📦',
  member_joined:      '👋',
  member_removed:     '👤',
  expense_added:      '💰',
  expense_updated:    '📝',
  expense_deleted:    '🗑️',
  settlement_recorded:'✅',
};

interface Props { groupId: string }

export default function LogsTab({ groupId }: Props) {
  const { data: logs = [], isLoading } = useActivityLogs(groupId);

  return (
    <div className="tab-panel">
      {isLoading ? (
        <SkeletonList count={5} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Activity size={40} />}
          title="No activity yet"
          subtitle="Group actions will appear here"
        />
      ) : (
        <div className="log-list">
          {logs.map((log) => (
            <LogItem key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

function LogItem({ log }: { log: ActivityLog }) {
  const actorName = log.actor?.name ?? log.actor?.email ?? 'Someone';
  const action    = ACTION_LABELS[log.action] ?? log.action;
  const icon      = ACTION_ICONS[log.action] ?? '📋';
  const meta      = log.metadata as Record<string, string>;

  let timeAgo = '';
  try { timeAgo = formatDistanceToNow(parseISO(log.created_at), { addSuffix: true }); }
  catch { timeAgo = ''; }

  return (
    <div className="log-item">
      <div className="log-icon">{icon}</div>
      <div className="log-info">
        <p className="log-text">
          <strong>{actorName}</strong> {action}
          {meta.title ? ` "${meta.title}"` : ''}
          {meta.amount ? ` (₹${meta.amount})` : ''}
        </p>
        <p className="log-time">{timeAgo}</p>
      </div>
      {log.actor && (
        <Avatar
          src={log.actor.avatar_url}
          name={actorName}
          size={30}
        />
      )}
    </div>
  );
}
