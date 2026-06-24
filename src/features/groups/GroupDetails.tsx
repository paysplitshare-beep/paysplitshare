import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { useGroup, useGroupMembers, useExpenses } from '../../hooks/useGroups';
import { useStore } from '../../store/useStore';
import { computeGroupSummary } from '../../utils/balanceCalculator';
import FilterChips from '../../components/ui/FilterChips';
import { getCurrencySymbol } from '../../types';
import BillsTab from './tabs/BillsTab';
import BalancesTab from './tabs/BalancesTab';
import MembersTab from './tabs/MembersTab';
import LogsTab from './tabs/LogsTab';
import GroupSettings from './GroupSettings';

const TABS = [
  { id: 'bills',    label: 'Bills' },
  { id: 'balances', label: 'Balances' },
  { id: 'members',  label: 'Members' },
  { id: 'logs',     label: 'Logs' },
];

export default function GroupDetails() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user     = useStore((s) => s.user);

  const [activeTab,    setActiveTab]    = useState('bills');
  const [showSettings, setShowSettings] = useState(false);

  const { data: group,   isLoading: loadingGroup }   = useGroup(id!);
  const { data: members, isLoading: loadingMembers } = useGroupMembers(id!);
  const { data: expenses, isLoading: loadingExpenses } = useExpenses(id!);

  const currencySymbol = getCurrencySymbol(group?.default_currency ?? 'INR');

  const summary = computeGroupSummary(
    user?.id ?? '',
    expenses ?? [],
  );

  const isAdmin = members?.some(
    (m) => m.user_id === user?.id && m.role === 'admin'
  ) ?? false;

  if (!loadingGroup && !group) {
    return (
      <div className="page-content">
        <div className="page-header">
          <button className="icon-btn" onClick={() => navigate('/groups')}>
            <ArrowLeft size={20} />
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '80px' }}>
          Group not found.
        </p>
      </div>
    );
  }

  return (
    <div className="page-content page-content--no-pad-top">
      {/* Back + Title Header */}
      <div className="group-details-header">
        <button
          className="icon-btn"
          onClick={() => navigate('/groups')}
          aria-label="Back to groups"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="group-details-title-wrap">
          <h1 className="group-details-title">
            {loadingGroup ? '...' : group?.name}
          </h1>
          <span className="group-details-type">{group?.type}</span>
        </div>
        {isAdmin && (
          <button
            className="icon-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Group settings"
            id="group-settings-btn"
          >
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* Summary Card */}
      <div className="group-summary-card">
        <div className="group-summary-main">
          <p className="group-summary-label">Group Total</p>
          <p className="group-summary-amount">
            {currencySymbol}{summary.totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="group-summary-stats">
          <div className="group-stat">
            <p className="group-stat-label">You Spent</p>
            <p className="group-stat-value">
              {currencySymbol}{summary.youSpent.toFixed(2)}
            </p>
          </div>
          <div className="group-stat">
            <p className="group-stat-label">You're Owed</p>
            <p className="group-stat-value group-stat-value--green">
              {currencySymbol}{summary.youAreOwed.toFixed(2)}
            </p>
          </div>
          <div className="group-stat">
            <p className="group-stat-label">You Owe</p>
            <p className="group-stat-value group-stat-value--red">
              {currencySymbol}{summary.youOwe.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Chips */}
      <FilterChips chips={TABS} selected={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'bills' && (
          <BillsTab
            groupId={id!}
            group={group ?? null}
            members={members ?? []}
            expenses={expenses ?? []}
            isLoading={loadingExpenses}
            currencySymbol={currencySymbol}
          />
        )}
        {activeTab === 'balances' && (
          <BalancesTab
            groupId={id!}
            members={members ?? []}
            expenses={expenses ?? []}
            isLoading={loadingMembers || loadingExpenses}
            currencySymbol={currencySymbol}
          />
        )}
        {activeTab === 'members' && (
          <MembersTab
            groupId={id!}
            group={group ?? null}
            members={members ?? []}
            isLoading={loadingMembers}
            isAdmin={isAdmin}
          />
        )}
        {activeTab === 'logs' && (
          <LogsTab groupId={id!} />
        )}
      </div>

      {/* Group Settings Modal */}
      {group && (
        <GroupSettings
          open={showSettings}
          onClose={() => setShowSettings(false)}
          group={group}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
