import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { NegotiationItem } from '@/types/negotiation';
import { ROLE_LABELS } from '@/types/negotiation';
import StatusTag from '@/components/StatusTag';
import { formatRemainingTime, getUrgencyLevel } from '@/utils/timeUtils';
import styles from './index.module.scss';

interface NegotiationCardProps {
  item: NegotiationItem;
  onClick?: (id: string) => void;
  onUrge?: (id: string) => void;
  showUrge?: boolean;
}

const NegotiationCard: React.FC<NegotiationCardProps> = ({ item, onClick, onUrge, showUrge = false }) => {
  const urgency = getUrgencyLevel(item.remainingHours);
  const urgencyClassMap = {
    urgent: styles.urgent,
    warning: styles.warning,
    normal: styles.normal,
  };
  const isUrgent = urgency === 'urgent' || item.remainingHours <= 0;

  const handleUrgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUrge?.(item.id);
  };

  return (
    <View className={styles.card} onClick={() => onClick?.(item.id)}>
      <View className={styles.cardHeader}>
        <Text className={styles.title}>{item.title}</Text>
        <StatusTag status={item.status} />
      </View>
      <View className={styles.cardBody}>
        <View className={styles.infoRow}>
          <Text className={styles.label}>发起单位</Text>
          <Text className={styles.value}>{item.initiator}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.label}>当前节点</Text>
          <Text className={styles.value}>{item.currentNode}</Text>
        </View>
      </View>
      <View className={styles.cardFooter}>
        <View className={styles.roleTag}>
          <Text className={styles.roleText}>{ROLE_LABELS[item.currentNodeRole]}</Text>
        </View>
        <View className={classnames(styles.timeInfo, urgencyClassMap[urgency])}>
          <Text className={styles.timeText}>
            {item.remainingHours > 0 ? `剩余 ${formatRemainingTime(item.remainingHours)}` : '已超时'}
          </Text>
        </View>
      </View>
      {showUrge && isUrgent && (
        <View className={styles.actionRow}>
          <Text className={styles.urgeHint}>⏰ 已超时/即将超时</Text>
          <View className={styles.urgeBtn} onClick={handleUrgeClick}>
            <Text>⚡</Text>
            <Text>催办</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default NegotiationCard;
