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

const EXPORT_TYPE_LABEL: Record<string, string> = {
  single: '单条导出',
  batch: '批量导出',
  share: '分享',
  print: '发送打印',
};

const TimelineItem: React.FC<TimelineItemProps> = ({ node, isLast }) => {
  const actionColorMap: Record<string, string> = {
    submitted: styles.actionSubmit,
    viewed: styles.actionView,
    agreed: styles.actionAgree,
    returned: styles.actionReturn,
    forwarded: styles.actionForward,
    exported: styles.actionExport,
    urged: styles.actionUrge,
    resubmitted: styles.actionResubmit,
  };

  const dotColorMap: Record<string, string> = {
    submitted: styles.dotSubmit,
    viewed: styles.dotView,
    agreed: styles.dotAgree,
    returned: styles.dotReturn,
    forwarded: styles.dotForward,
    exported: styles.dotExport,
    urged: styles.dotUrge,
    resubmitted: styles.dotResubmit,
  };

  const actionLabel = TIMELINE_ACTION_LABELS[node.action] || node.action;
  const exportExtra = node.action === 'exported' && node.exportType ? `(${EXPORT_TYPE_LABEL[node.exportType] || node.exportType})` : '';

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
            {actionLabel}{exportExtra}
          </Text>
          <Text className={styles.role}>{ROLE_LABELS[node.role]}</Text>
        </View>
        <Text className={styles.time}>{formatFullTime(node.timestamp)}</Text>
        {node.opinion ? <Text className={styles.opinion}>{node.opinion}</Text> : null}
        {node.returnFromRole && node.returnReason && (
          <View className={styles.returnInfo}>
            <Text className={styles.returnLabel}>
              退回来源：{ROLE_LABELS[node.returnFromRole]}
            </Text>
            <Text className={styles.returnContent}>退回原因：{node.returnReason}</Text>
          </View>
        )}
        {node.urgeTargetRole && (
          <View className={styles.urgeInfo}>
            <Text className={styles.urgeLabel}>
              催办对象：{ROLE_LABELS[node.urgeTargetRole]}
            </Text>
            {node.urgeRemark && (
              <Text className={styles.urgeRemarkRow}>催办说明：{node.urgeRemark}</Text>
            )}
            {node.urgeCount && node.urgeCount > 0 && (
              <Text className={styles.urgeCountRow}>
                累计催办第 {node.urgeCount} 次
              </Text>
            )}
          </View>
        )}
        {node.costRequirement ? (
          <View className={styles.costBlock}>
            <Text className={styles.costLabel}>费用控制要求</Text>
            <Text className={styles.costText}>{node.costRequirement}</Text>
          </View>
        ) : null}
        {node.supplementAttachments && node.supplementAttachments.length > 0 && (
          <View className={styles.supplementBlock}>
            <Text className={styles.supplementLabel}>补充附件</Text>
            {node.supplementAttachments.map((att) => (
              <Text key={att.id} className={styles.supplementItem}>
                📎 {att.name}
              </Text>
            ))}
          </View>
        )}
        {node.version && node.versionDiff && node.versionDiff.length > 0 && (
          <View className={styles.versionBlock}>
            <Text className={styles.versionLabel}>
              第 {node.version} 版 · 本次变更
            </Text>
            <View className={styles.versionDiffList}>
              {node.versionDiff.map((d) => (
                <Text key={d} className={styles.versionDiffTag}>{d}</Text>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default TimelineItem;
