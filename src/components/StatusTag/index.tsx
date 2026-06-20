import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { NodeStatus } from '@/types/negotiation';
import { NODE_STATUS_LABELS } from '@/types/negotiation';
import styles from './index.module.scss';

interface StatusTagProps {
  status: NodeStatus;
}

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const statusClassMap: Record<NodeStatus, string> = {
    waiting: styles.waiting,
    processing: styles.processing,
    completed: styles.completed,
    returned: styles.returned,
  };

  return (
    <View className={classnames(styles.tag, statusClassMap[status])}>
      <Text className={styles.tagText}>{NODE_STATUS_LABELS[status]}</Text>
    </View>
  );
};

export default StatusTag;
