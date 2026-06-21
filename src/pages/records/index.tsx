import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { useNegotiationStore } from '@/store/useNegotiationStore';
import { selectRecordList } from '@/store/useNegotiationStore';
import NegotiationCard from '@/components/NegotiationCard';
import styles from './index.module.scss';

const TAB_OPTIONS = [
  { label: '已完成', value: 'completed' as const },
  { label: '已退回', value: 'returned' as const },
];

const RecordsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'completed' | 'returned'>('completed');
  const recordList = useNegotiationStore(selectRecordList);
  const addExportRecord = useNegotiationStore((s) => s.addExportRecord);

  const completedCount = useMemo(
    () => recordList.filter((n) => n.status === 'completed').length,
    [recordList]
  );
  const returnedCount = useMemo(
    () => recordList.filter((n) => n.status === 'returned').length,
    [recordList]
  );

  const filteredList = useMemo(() => {
    return recordList.filter((n) => n.status === activeTab);
  }, [recordList, activeTab]);

  const handleCardClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  };

  const handleExport = () => {
    if (filteredList.length === 0) return;
    const ids = filteredList.map((n) => n.id);
    addExportRecord(ids, 'batch');
    const idsParam = encodeURIComponent(JSON.stringify(ids));
    Taro.navigateTo({ url: `/pages/export/index?ids=${idsParam}` });
    console.info('[Export] 开始生成会签包', { count: filteredList.length });
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>会签记录</Text>
        <Text className={styles.headerDesc}>
          共 {recordList.length} 条（已完成 {completedCount} · 已退回 {returnedCount}）
        </Text>
      </View>

      <View className={styles.tabs}>
        {TAB_OPTIONS.map((tab) => (
          <View
            key={tab.value}
            className={classnames(styles.tab, activeTab === tab.value && styles.tabActive)}
            onClick={() => setActiveTab(tab.value)}
          >
            <Text
              className={classnames(styles.tabText, activeTab === tab.value && styles.tabTextActive)}
            >
              {tab.label}
              {tab.value === 'completed' ? ` (${completedCount})` : ''}
              {tab.value === 'returned' ? ` (${returnedCount})` : ''}
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
            <Text className={styles.emptyIcon}>📂</Text>
            <Text className={styles.emptyText}>
              {activeTab === 'returned' ? '暂无已退回洽商' : '暂无已完成洽商'}
            </Text>
          </View>
        )}
      </View>

      {filteredList.length > 0 && (
        <View className={styles.exportBtn} onClick={handleExport}>
          <Text className={styles.exportText}>
            {activeTab === 'returned' ? '批量导出已退回（' : '批量导出已完成（'}
            {filteredList.length}）
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default RecordsPage;
