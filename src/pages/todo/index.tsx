import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { useNegotiationStore } from '@/store/useNegotiationStore';
import NegotiationCard from '@/components/NegotiationCard';
import type { NodeStatus } from '@/types/negotiation';
import styles from './index.module.scss';

const FILTER_OPTIONS: { label: string; value: NodeStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'waiting' },
  { label: '处理中', value: 'processing' },
  { label: '已退回', value: 'returned' },
];

const TodoPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<NodeStatus | 'all'>('all');
  const { user, getTodoList, getRecordList } = useNegotiationStore();

  const todoList = useMemo(() => getTodoList(), [getTodoList]);
  const recordList = useMemo(() => getRecordList(), [getRecordList]);

  const urgentCount = useMemo(
    () => todoList.filter((n) => n.remainingHours > 0 && n.remainingHours <= 24).length,
    [todoList]
  );

  const filteredList = useMemo(() => {
    if (activeFilter === 'all') return todoList;
    return todoList.filter((n) => n.status === activeFilter);
  }, [todoList, activeFilter]);

  const handleCardClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.greeting}>{user.roleLabel}，你好</Text>
        <Text className={styles.subtitle}>
          当前有 {todoList.length} 条待处理，{recordList.length} 条已处理
        </Text>
      </View>

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

      <View className={styles.list}>
        {filteredList.length > 0 ? (
          filteredList.map((item) => (
            <NegotiationCard key={item.id} item={item} onClick={handleCardClick} />
          ))
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无待处理洽商</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default TodoPage;
