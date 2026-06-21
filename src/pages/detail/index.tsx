import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useNegotiationStore } from '@/store/useNegotiationStore';
import { ROLE_LABELS, FLOW_ORDER, TIMELINE_ACTION_LABELS } from '@/types/negotiation';
import type { SignAction, AttachmentItem, TimelineNode, UserRole } from '@/types/negotiation';
import StatusTag from '@/components/StatusTag';
import TimelineItem from '@/components/TimelineItem';
import SignPanel from '@/components/SignPanel';
import { formatRemainingTime, getUrgencyLevel, formatFullTime } from '@/utils/timeUtils';
import styles from './index.module.scss';

const DetailPage: React.FC = () => {
  const [id, setId] = useState('');
  const user = useNegotiationStore((s) => s.user);
  const negotiations = useNegotiationStore((s) => s.negotiations);
  const timelines = useNegotiationStore((s) => s.timelines);
  const signNegotiation = useNegotiationStore((s) => s.signNegotiation);
  const resubmitNegotiation = useNegotiationStore((s) => s.resubmitNegotiation);
  const addViewRecord = useNegotiationStore((s) => s.addViewRecord);
  const addExportRecord = useNegotiationStore((s) => s.addExportRecord);

  React.useEffect(() => {
    const instance = Taro.getCurrentInstance();
    const params = instance?.router?.params;
    if (params?.id) {
      setId(params.id);
    }
  }, []);

  React.useEffect(() => {
    if (id) {
      addViewRecord(id);
    }
  }, [id, addViewRecord]);

  const item = useMemo(() => {
    if (!id) return null;
    return negotiations.find((n) => n.id === id) || null;
  }, [id, negotiations]);

  const timeline = useMemo(() => {
    if (!id) return [];
    return timelines[id] || [];
  }, [id, timelines]);

  const lastReturnNode = useMemo(() => {
    const returns = timeline.filter((t) => t.action === 'returned');
    if (returns.length === 0) return null;
    return returns[returns.length - 1];
  }, [timeline]);

  const lastSignNode = useMemo(() => {
    const signs = timeline.filter((t) => ['agreed', 'returned', 'resubmitted'].includes(t.action));
    if (signs.length === 0) return null;
    return signs[signs.length - 1];
  }, [timeline]);

  const nextStep = useMemo(() => {
    if (!item) return '';
    if (item.status === 'completed') return '流程已完成';
    if (item.status === 'returned') {
      return `请 ${ROLE_LABELS[item.currentNodeRole]} 补正后重新提交`;
    }
    const idx = FLOW_ORDER.indexOf(item.currentNodeRole);
    if (idx >= 0 && idx < FLOW_ORDER.length - 1) {
      const nextRole = FLOW_ORDER[idx + 1];
      return `${ROLE_LABELS[item.currentNodeRole]} 同意后，将流转至 ${ROLE_LABELS[nextRole]}`;
    }
    return `请 ${ROLE_LABELS[item.currentNodeRole]} 进行最终审核`;
  }, [item]);

  const urgeCountTotal = useMemo(() => {
    return timeline.filter((t) => t.action === 'urged').length;
  }, [timeline]);

  const canSign = useMemo(() => {
    if (!item) return false;
    return item.currentNodeRole === user.role && (item.status === 'waiting' || item.status === 'processing');
  }, [item, user.role]);

  const canResubmit = useMemo(() => {
    if (!item) return false;
    return item.currentNodeRole === user.role && item.status === 'returned';
  }, [item, user.role]);

  const handleSign = (
    action: SignAction | 'resubmit',
    opinion: string,
    costRequirement?: string,
    supplementAttachments?: AttachmentItem[]
  ) => {
    if (!id) return;
    if (action === 'resubmit') {
      resubmitNegotiation(id, opinion, supplementAttachments);
      Taro.showToast({ title: '已重新提交', icon: 'success', duration: 1500 });
      console.info('[Detail] resubmit negotiation', { id, opinion, supplementAttachments });
    } else {
      signNegotiation(id, action, opinion, costRequirement, supplementAttachments);
      Taro.showToast({ title: '签署成功', icon: 'success', duration: 1500 });
      console.info('[Detail] sign negotiation', { id, action, opinion, costRequirement, supplementAttachments });
    }
  };

  const handleExportSingle = () => {
    if (!id) return;
    addExportRecord([id], 'single');
    Taro.navigateTo({ url: `/pages/export/index?id=${id}` });
  };

  const handleExportFull = () => {
    if (!id) return;
    addExportRecord([id], 'single');
    Taro.navigateTo({ url: `/pages/export/index?id=${id}` });
  };

  if (!item) {
    return (
      <ScrollView className={styles.container} scrollY>
        <View className={styles.section}>
          <Text style={{ fontSize: '28rpx', color: '#a0aec0' }}>加载中...</Text>
        </View>
      </ScrollView>
    );
  }

  const urgency = getUrgencyLevel(item.remainingHours);

  return (
    <ScrollView className={styles.container} scrollY>
      {lastReturnNode && canResubmit && (
        <View className={styles.returnAlert}>
          <Text className={styles.returnAlertTitle}>⚠️ 该洽商已被退回，请补正后重新提交</Text>
          <View className={styles.returnAlertRow}>
            <Text className={styles.returnAlertLabel}>退回来源：</Text>
            <Text>{lastReturnNode.returnFromRole ? ROLE_LABELS[lastReturnNode.returnFromRole] : ROLE_LABELS[lastReturnNode.role]}</Text>
          </View>
          <View className={styles.returnAlertRow}>
            <Text className={styles.returnAlertLabel}>退回原因：</Text>
            <Text>{lastReturnNode.returnReason || lastReturnNode.opinion}</Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.titleRow}>
          <Text className={styles.detailTitle}>
            {item.title}
            <View className={styles.versionBadge}>
              <Text className={styles.versionText}>V{item.version}</Text>
            </View>
          </Text>
          <StatusTag status={item.status} />
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaText}>发起：{item.initiator}</Text>
          <Text className={styles.metaText}>|</Text>
          <Text className={styles.metaHighlight}>
            当前节点：{item.currentNode}（{ROLE_LABELS[item.currentNodeRole]}）
          </Text>
        </View>
        <View className={styles.metaRow}>
          {item.remainingHours > 0 && urgency !== 'normal' && (
            <View className={styles.urgencyTag}>
              <Text className={styles.urgencyText}>
                剩余 {formatRemainingTime(item.remainingHours)}
              </Text>
            </View>
          )}
          <Text className={styles.metaText}>更新于 {item.updatedAt}</Text>
        </View>
      </View>

      <View className={styles.processCard}>
        <Text className={styles.processCardTitle}>📊 过程管控摘要</Text>
        <View className={styles.processRow}>
          <Text className={styles.processLabel}>当前卡在</Text>
          <Text className={styles.processValue}>
            {item.currentNode} · {ROLE_LABELS[item.currentNodeRole]}
          </Text>
        </View>
        <View className={styles.processRow}>
          <Text className={styles.processLabel}>最近一次处理</Text>
          <Text className={styles.processValue}>
            {lastSignNode
              ? `${lastSignNode.actorName}（${ROLE_LABELS[lastSignNode.role]}）${TIMELINE_ACTION_LABELS[lastSignNode.action]}：${lastSignNode.opinion || '无意见'}（${formatFullTime(lastSignNode.timestamp)}）`
              : '暂无处理记录'}
          </Text>
        </View>
        {urgeCountTotal > 0 && (
          <View className={styles.processRow}>
            <Text className={styles.processLabel}>催办次数</Text>
            <Text className={styles.processValue} style={{ color: '#c53030' }}>
              累计 {urgeCountTotal} 次
            </Text>
          </View>
        )}
        <View className={styles.processSuggest}>
          <Text className={styles.processSuggestText}>💡 下一步建议：{nextStep}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.contentBlock}>
          <Text className={styles.contentLabel}>变更依据</Text>
          <Text className={styles.contentText}>{item.changeBasis}</Text>
        </View>
        <View className={styles.contentBlock}>
          <Text className={styles.contentLabel}>拟调整做法</Text>
          <Text className={styles.contentText}>{item.proposedMethod}</Text>
        </View>
      </View>

      {item.photos.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.contentLabel}>现场照片</Text>
          <View className={styles.photoGrid}>
            {item.photos.map((photo, index) => (
              <View key={index} className={styles.photoItem}>
                <Image className={styles.photoImg} src={photo} mode="aspectFill" />
              </View>
            ))}
          </View>
        </View>
      )}

      {item.attachments.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.contentLabel}>附件</Text>
          {item.attachments.map((att) => (
            <View key={att.id} className={styles.attachmentItem}>
              <View className={styles.attachInfo}>
                <Text className={styles.attachIcon}>📎</Text>
                <Text className={styles.attachName}>{att.name}</Text>
              </View>
              <Text className={styles.attachMeta}>{att.size}</Text>
            </View>
          ))}
        </View>
      )}

      {item.supplementAttachments && item.supplementAttachments.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.contentLabel}>补充附件说明</Text>
          {item.supplementAttachments.map((att) => (
            <View key={att.id} className={styles.attachmentItem}>
              <View className={styles.attachInfo}>
                <Text className={styles.attachIcon}>📎</Text>
                <Text className={styles.attachName}>{att.name}</Text>
              </View>
              <Text className={styles.attachMeta}>{att.size}</Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.timelineSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>节点轨迹</Text>
        </View>
        {timeline.length > 0 ? (
          timeline.map((node, index) => (
            <TimelineItem
              key={node.id}
              node={node}
              isLast={index === timeline.length - 1}
            />
          ))
        ) : (
          <Text style={{ fontSize: '24rpx', color: '#a0aec0' }}>暂无轨迹记录</Text>
        )}
      </View>

      {canSign && (
        <View className={styles.signSection}>
          <SignPanel role={user.role} mode="sign" onSubmit={handleSign} />
        </View>
      )}

      {canResubmit && (
        <View className={styles.signSection}>
          <SignPanel role={user.role} mode="resubmit" onSubmit={handleSign} />
        </View>
      )}

      <View className={styles.exportRow}>
        <View className={styles.exportBtn} onClick={handleExportSingle}>
          <Text className={styles.exportBtnText}>导出清单</Text>
        </View>
        <View className={styles.fullExportBtn} onClick={handleExportFull}>
          <Text className={styles.fullExportBtnText}>导出会签包</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default DetailPage;
