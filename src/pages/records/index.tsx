import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { useNegotiationStore } from '@/store/useNegotiationStore';
import NegotiationCard from '@/components/NegotiationCard';
import styles from './index.module.scss';

const TAB_OPTIONS = [
  { label: '已完成', value: 'completed' as const },
  { label: '已退回', value: 'returned' as const },
];

const RecordsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'completed' | 'returned'>('completed');
  const { getRecordList } = useNegotiationStore();

  const recordList = useMemo(() => getRecordList(), [getRecordList]);

  const filteredList = useMemo(() => {
    return recordList.filter((n) => n.status === activeTab);
  }, [recordList, activeTab]);

  const handleCardClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  };

  const handleExport = () => {
    if (filteredList.length === 0) return;
    const ids = encodeURIComponent(JSON.stringify(filteredList.map((n) => n.id)));
    Taro.navigateTo({ url: `/pages/export/index?ids=${ids}` });
    console.info('[Export] 开始生成会签包', { count: filteredList.length });
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>会签记录</Text>
        <Text className={styles.headerDesc}>
          共 {recordList.length} 条已处理记录
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
            <Text className={styles.emptyText}>暂无记录</Text>
          </View>
        )}
      </View>

      {filteredList.length > 0 && (
        <View className={styles.exportBtn} onClick={handleExport}>
          <Text className={styles.exportText}>导出会签包</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default RecordsPage;
