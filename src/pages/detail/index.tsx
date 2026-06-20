import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useNegotiationStore } from '@/store/useNegotiationStore';
import { ROLE_LABELS } from '@/types/negotiation';
import type { SignAction } from '@/types/negotiation';
import StatusTag from '@/components/StatusTag';
import TimelineItem from '@/components/TimelineItem';
import SignPanel from '@/components/SignPanel';
import { formatRemainingTime, getUrgencyLevel } from '@/utils/timeUtils';
import styles from './index.module.scss';

const DetailPage: React.FC = () => {
  const [id, setId] = useState('');
  const { user, getNegotiationById, getTimelineById, signNegotiation, addViewRecord } = useNegotiationStore();

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
    return getNegotiationById(id) || null;
  }, [id, getNegotiationById]);

  const timeline = useMemo(() => {
    if (!id) return [];
    return getTimelineById(id);
  }, [id, getTimelineById]);

  const canSign = useMemo(() => {
    if (!item) return false;
    return item.currentNodeRole === user.role && (item.status === 'waiting' || item.status === 'processing');
  }, [item, user.role]);

  const handleSign = (action: SignAction, opinion: string, costRequirement?: string) => {
    if (!id) return;
    signNegotiation(id, action, opinion, costRequirement);
    Taro.showToast({
      title: '签署成功',
      icon: 'success',
      duration: 1500,
    });
    console.info('[Detail] sign negotiation', { id, action, opinion, costRequirement });
  };

  const handleExportSingle = () => {
    if (!id) return;
    Taro.navigateTo({ url: `/pages/export/index?id=${id}` });
  };

  const handleExportFull = () => {
    if (!id) return;
    Taro.navigateTo({ url: `/pages/export/index?id=${id}` });
  };

  if (!item) {
    return (
      <View className={styles.container}>
        <View className={styles.section}>
          <Text style={{ fontSize: '28rpx', color: '#a0aec0' }}>加载中...</Text>
        </View>
      </View>
    );
  }

  const urgency = getUrgencyLevel(item.remainingHours);

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.section}>
        <View className={styles.titleRow}>
          <Text className={styles.detailTitle}>{item.title}</Text>
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
          <SignPanel role={user.role} onSubmit={handleSign} />
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
