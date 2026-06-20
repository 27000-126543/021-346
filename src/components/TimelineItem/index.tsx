import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { TimelineNode } from '@/types/negotiation';
import { ROLE_LABELS, TIMELINE_ACTION_LABELS } from '@/types/negotiation';
import { formatFullTime } from '@/utils/timeUtils';
import styles from './index.module.scss';

interface TimelineItemProps {
  node: TimelineNode;
  isLast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ node, isLast }) => {
  const actionColorMap: Record<string, string> = {
    submitted: styles.actionSubmit,
    viewed: styles.actionView,
    agreed: styles.actionAgree,
    returned: styles.actionReturn,
    forwarded: styles.actionForward,
  };

  const dotColorMap: Record<string, string> = {
    submitted: styles.dotSubmit,
    viewed: styles.dotView,
    agreed: styles.dotAgree,
    returned: styles.dotReturn,
    forwarded: styles.dotForward,
  };

  return (
    <View className={styles.timelineItem}>
      <View className={styles.left}>
        <View className={classnames(styles.dot, dotColorMap[node.action] || styles.dotView)} />
        {!isLast && <View className={styles.line} />}
      </View>
      <View className={styles.right}>
        <View className={styles.header}>
          <Text className={styles.actor}>{node.actorName}</Text>
          <Text className={classnames(styles.action, actionColorMap[node.action])}>
            {TIMELINE_ACTION_LABELS[node.action] || node.action}
          </Text>
          <Text className={styles.role}>{ROLE_LABELS[node.role]}</Text>
        </View>
        <Text className={styles.time}>{formatFullTime(node.timestamp)}</Text>
        {node.opinion ? <Text className={styles.opinion}>{node.opinion}</Text> : null}
      </View>
    </View>
  );
};

export default TimelineItem;
