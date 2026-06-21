import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Textarea } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { useNegotiationStore } from '@/store/useNegotiationStore';
import { selectTodoList, selectRecordList } from '@/store/useNegotiationStore';
import NegotiationCard from '@/components/NegotiationCard';
import type { NodeStatus, UserRole, ControlDimension, NegotiationItem } from '@/types/negotiation';
import { ROLE_LABELS, CONTROL_DIMENSIONS, FLOW_ORDER } from '@/types/negotiation';
import styles from './index.module.scss';

const FILTER_OPTIONS: { label: string; value: NodeStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'waiting' },
  { label: '处理中', value: 'processing' },
  { label: '已退回', value: 'returned' },
];

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: '建设单位', value: 'owner' },
  { label: '监理工程师', value: 'supervisor' },
  { label: '总包', value: 'general_contractor' },
  { label: '分包', value: 'subcontractor' },
];

const TodoPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<NodeStatus | 'all'>('all');
  const [activeControl, setActiveControl] = useState<ControlDimension>('all');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [urgeModal, setUrgeModal] = useState<{ open: boolean; id: string; defaultTarget: UserRole; title: string }>({
    open: false,
    id: '',
    defaultTarget: 'supervisor',
    title: '',
  });
  const [urgeTarget, setUrgeTarget] = useState<UserRole | null>(null);
  const [urgeRemark, setUrgeRemark] = useState('');

  const user = useNegotiationStore((s) => s.user);
  const allNegotiations = useNegotiationStore((s) => s.negotiations);
  const timelines = useNegotiationStore((s) => s.timelines);
  const switchRole = useNegotiationStore((s) => s.switchRole);
  const urgeNegotiation = useNegotiationStore((s) => s.urgeNegotiation);
  const todoList = useNegotiationStore(selectTodoList);
  const recordList = useNegotiationStore(selectRecordList);

  const urgentCount = useMemo(
    () => todoList.filter((n) => n.remainingHours > 0 && n.remainingHours <= 24).length,
    [todoList]
  );

  const hasUrged = (id: string) => (timelines[id] || []).some((t) => t.action === 'urged');

  const isResubmitting = (n: NegotiationItem) =>
    n.status === 'returned' && (timelines[n.id] || []).some((t) => t.action === 'resubmitted');

  const baseFiltered = useMemo(() => {
    if (activeFilter === 'all') return todoList;
    return todoList.filter((n) => n.status === activeFilter);
  }, [todoList, activeFilter]);

  const controlFiltered = useMemo(() => {
    switch (activeControl) {
      case 'pending_timeout':
        return allNegotiations.filter((n) => n.remainingHours > 0 && n.remainingHours <= 48);
      case 'urged':
        return allNegotiations.filter((n) => hasUrged(n.id));
      case 'returned':
        return allNegotiations.filter((n) => n.status === 'returned');
      case 'resubmitting':
        return allNegotiations.filter((n) => isResubmitting(n));
      case 'all':
      default:
        return baseFiltered;
    }
  }, [activeControl, allNegotiations, baseFiltered, timelines]);

  const filteredList = controlFiltered;

  const handleCardClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  };

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    setShowRolePicker(false);
    Taro.showToast({
      title: `已切换为${ROLE_LABELS[role]}`,
      icon: 'none',
    });
  };

  const openUrgeModal = (id: string) => {
    const target = allNegotiations.find((n) => n.id === id);
    if (!target) return;
    setUrgeModal({
      open: true,
      id,
      defaultTarget: target.currentNodeRole,
      title: target.title,
    });
    setUrgeTarget(target.currentNodeRole);
    setUrgeRemark('');
  };

  const closeUrgeModal = () => {
    setUrgeModal({ open: false, id: '', defaultTarget: 'supervisor', title: '' });
    setUrgeTarget(null);
    setUrgeRemark('');
  };

  const handleConfirmUrge = () => {
    if (!urgeTarget || !urgeModal.id) return;
    urgeNegotiation(urgeModal.id, urgeTarget, urgeRemark.trim() || undefined);
    Taro.showToast({ title: '已发送催办', icon: 'success' });
    closeUrgeModal();
  };

  const handleUrge = (id: string) => {
    openUrgeModal(id);
  };

  const isControlMode = activeControl !== 'all';

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.topBar}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text className={styles.avatarText}>{user.name.charAt(0)}</Text>
          </View>
          <View className={styles.userText}>
            <Text className={styles.greeting}>{user.roleLabel}，你好</Text>
            <Text className={styles.subtitle}>{user.company}</Text>
          </View>
        </View>
        <View className={styles.roleSwitchBtn} onClick={() => setShowRolePicker(!showRolePicker)}>
          <Text className={styles.roleSwitchText}>切换角色</Text>
        </View>
      </View>

      {showRolePicker && (
        <View className={styles.rolePicker}>
          {ROLE_OPTIONS.map((opt) => (
            <View
              key={opt.value}
              className={classnames(
                styles.roleOption,
                user.role === opt.value && styles.roleOptionActive
              )}
              onClick={() => handleRoleSwitch(opt.value)}
            >
              <Text
                className={classnames(
                  styles.roleOptionText,
                  user.role === opt.value && styles.roleOptionTextActive
                )}
              >
                {opt.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.statsBar}>
        <View className={styles.statCard}>
          <Text className={styles.statNumber}>{todoList.length}</Text>
          <Text className={styles.statLabel}>待处理</Text>
        </View>
        <View className={classnames(styles.statCard, urgentCount > 0 && styles.statUrgent)}>
          <Text className={styles.statNumber}>{urgentCount}</Text>
          <Text className={styles.statLabel}>紧急件</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statNumber}>{recordList.length}</Text>
          <Text className={styles.statLabel}>已处理</Text>
        </View>
      </View>

      {!isControlMode && (
        <View className={styles.filterBar}>
          {FILTER_OPTIONS.map((opt) => (
            <View
              key={opt.value}
              className={classnames(
                styles.filterBtn,
                activeFilter === opt.value && styles.filterBtnActive
              )}
              onClick={() => setActiveFilter(opt.value)}
            >
              <Text
                className={classnames(
                  styles.filterText,
                  activeFilter === opt.value && styles.filterTextActive
                )}
              >
                {opt.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text className={styles.sectionTitle}>过程管控</Text>
      <View className={styles.controlFilterBar}>
        {CONTROL_DIMENSIONS.map((opt) => (
          <View
            key={opt.value}
            className={classnames(
              styles.controlFilterBtn,
              activeControl === opt.value && styles.controlFilterBtnActive
            )}
            onClick={() => setActiveControl(opt.value)}
          >
            <Text
              className={classnames(
                styles.controlFilterText,
                activeControl === opt.value && styles.controlFilterTextActive
              )}
            >
              {opt.label}
            </Text>
          </View>
        ))}
      </View>

      <View className={styles.list}>
        {filteredList.length > 0 ? (
          filteredList.map((item) => (
            <NegotiationCard
              key={item.id}
              item={item}
              onClick={handleCardClick}
              showUrge
              onUrge={handleUrge}
            />
          ))
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>
              {isControlMode ? '当前管控维度下暂无洽商' : '暂无待处理洽商'}
            </Text>
          </View>
        )}
      </View>

      {urgeModal.open && (
        <View className={styles.modalMask} onClick={closeUrgeModal}>
          <View className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>发起催办</Text>

            <Text className={styles.modalLabel}>催办对象</Text>
            <View className={styles.modalRoleList}>
              {FLOW_ORDER.map((role) => (
                <View
                  key={role}
                  className={classnames(
                    styles.modalRoleItem,
                    urgeTarget === role && styles.modalRoleItemActive
                  )}
                  onClick={() => setUrgeTarget(role)}
                >
                  {ROLE_LABELS[role]}
                </View>
              ))}
            </View>

            <Text className={styles.modalLabel}>催办说明（可选）</Text>
            <Textarea
              className={styles.modalTextarea}
              placeholder="可填写催办说明，例如：请务必今天内处理"
              value={urgeRemark}
              onInput={(e) => setUrgeRemark(e.detail.value)}
              maxlength={200}
            />

            <View className={styles.modalActions}>
              <View className={styles.modalCancel} onClick={closeUrgeModal}>
                取消
              </View>
              <View className={styles.modalConfirm} onClick={handleConfirmUrge}>
                发送催办
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default TodoPage;
