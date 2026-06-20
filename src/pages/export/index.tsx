import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useNegotiationStore } from '@/store/useNegotiationStore';
import { ROLE_LABELS, SIGN_ACTION_LABELS } from '@/types/negotiation';
import type { UserRole, TimelineNode, SignAction } from '@/types/negotiation';
import { formatFullTime } from '@/utils/timeUtils';
import styles from './index.module.scss';

const SIGN_ORDER: UserRole[] = ['subcontractor', 'general_contractor', 'supervisor', 'owner'];

const ExportPage: React.FC = () => {
  const [id, setId] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const { getNegotiationById, getTimelineById } = useNegotiationStore();

  React.useEffect(() => {
    const instance = Taro.getCurrentInstance();
    const params = instance?.router?.params;
    if (params?.id) {
      setId(params.id);
    }
    if (params?.ids) {
      try {
        const parsed = JSON.parse(decodeURIComponent(params.ids));
        setIds(parsed);
      } catch {
        setIds([]);
      }
    }
  }, []);

  const exportItems = useMemo(() => {
    const list: string[] = [];
    if (ids.length > 0) {
      list.push(...ids);
    } else if (id) {
      list.push(id);
    }
    return list.filter((v, i, arr) => arr.indexOf(v) === i);
  }, [id, ids]);

  const signRecordsByRole = (timeline: TimelineNode[]) => {
    const result: Record<UserRole, TimelineNode | null> = {
      subcontractor: null,
      general_contractor: null,
      supervisor: null,
      owner: null,
    };
    const signActions = ['agreed', 'returned'];
    for (const node of timeline) {
      if (signActions.includes(node.action)) {
        result[node.role] = node;
      }
    }
    return result;
  };

  const handleShare = () => {
    Taro.showToast({ title: '分享会签包', icon: 'none' });
    console.info('[Export] share', { count: exportItems.length });
  };

  const handlePrint = () => {
    Taro.showToast({ title: '发送至打印', icon: 'loading', duration: 1500 });
    console.info('[Export] print', { count: exportItems.length });
  };

  if (exportItems.length === 0) {
    return (
      <View className={styles.container}>
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>📄</Text>
          <Text className={styles.emptyText}>没有可导出的洽商</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      {exportItems.map((nid, idx) => {
        const item = getNegotiationById(nid);
        const timeline = getTimelineById(nid);
        if (!item) return null;
        const signs = signRecordsByRole(timeline);
        return (
          <View key={nid} className={styles.paper}>
            <View className={styles.docHeader}>
              <Text className={styles.docTitle}>变更洽商会签单</Text>
              <Text className={styles.docNo}>
                编号：{item.id.toUpperCase()} · {item.createdAt.slice(0, 10)}
              </Text>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>洽商基本信息</Text>
              <View className={styles.infoGrid}>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>洽商主题</Text>
                  <Text className={styles.infoValue}>{item.title}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>发起单位</Text>
                  <Text className={styles.infoValue}>{item.initiator}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>发起角色</Text>
                  <Text className={styles.infoValue}>{ROLE_LABELS[item.initiatorRole]}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>当前节点</Text>
                  <Text className={styles.infoValue}>
                    {item.currentNode}（{ROLE_LABELS[item.currentNodeRole]}）
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>变更依据</Text>
                  <Text className={styles.infoValue}>{item.changeBasis}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>拟调整做法</Text>
                  <Text className={styles.infoValue}>{item.proposedMethod}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>现场照片</Text>
                  <Text className={styles.infoValue}>
                    {item.photos.length > 0 ? `${item.photos.length} 张` : '无'}
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>提交时间</Text>
                  <Text className={styles.infoValue}>{item.createdAt}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>更新时间</Text>
                  <Text className={styles.infoValue}>{item.updatedAt}</Text>
                </View>
              </View>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>各节点签署意见</Text>
              <View className={styles.signTable}>
                <View className={styles.signHeader}>
                  <View className={`${styles.signHeaderCell} ${styles.colRole}`}>角色</View>
                  <View className={`${styles.signHeaderCell} ${styles.colPerson}`}>签署人</View>
                  <View className={`${styles.signHeaderCell} ${styles.colTime}`}>时间</View>
                  <View className={`${styles.signHeaderCell} ${styles.colOpinion}`}>意见</View>
                </View>
                {SIGN_ORDER.map((role) => {
                  const sign = signs[role];
                  return (
                    <View key={role} className={styles.signRow}>
                      <View className={`${styles.signCell} ${styles.colRole}`}>
                        <Text className={styles.cellValue}>{ROLE_LABELS[role]}</Text>
                      </View>
                      <View className={`${styles.signCell} ${styles.colPerson}`}>
                        <Text className={sign ? styles.cellValue : styles.cellEmpty}>
                          {sign ? sign.actorName : '—'}
                        </Text>
                      </View>
                      <View className={`${styles.signCell} ${styles.colTime}`}>
                        <Text className={sign ? styles.cellTime : styles.cellEmpty}>
                          {sign ? formatFullTime(sign.timestamp) : '—'}
                        </Text>
                      </View>
                      <View className={`${styles.signCell} ${styles.colOpinion}`}>
                        {sign ? (
                          <View>
                            <Text className={styles.cellValue}>
                              [{sign.signAction ? SIGN_ACTION_LABELS[sign.signAction as SignAction] : ''}] {sign.opinion}
                            </Text>
                            {sign.costRequirement && (
                              <View className={styles.costNote}>
                                <Text className={styles.costLabel}>费用控制要求</Text>
                                <Text className={styles.costContent}>{sign.costRequirement}</Text>
                              </View>
                            )}
                          </View>
                        ) : (
                          <Text className={styles.cellEmpty}>待处理</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>附件目录</Text>
              {item.attachments.length > 0 ? (
                <View className={styles.attachList}>
                  {item.attachments.map((att, aIdx) => (
                    <View key={att.id} className={styles.attachRow}>
                      <Text className={styles.attachIcon}>📎</Text>
                      <Text className={styles.attachName}>
                        {aIdx + 1}. {att.name}
                      </Text>
                      <Text className={styles.attachSize}>{att.size}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className={styles.cellEmpty}>无附件</Text>
              )}
            </View>
          </View>
        );
      })}

      <View className={styles.footerBar}>
        <View className={styles.btnSecondary} onClick={handleShare}>
          <Text className={styles.btnSecondaryText}>分享</Text>
        </View>
        <View className={styles.btnPrimary} onClick={handlePrint}>
          <Text className={styles.btnPrimaryText}>发送打印</Text>
        </View>
      </View>
    </View>
  );
};

export default ExportPage;
