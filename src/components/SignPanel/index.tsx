import React, { useState } from 'react';
import { View, Text, Textarea, Button } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import type { UserRole, SignAction, AttachmentItem } from '@/types/negotiation';
import { SIGN_ACTION_LABELS, COMMON_OPINIONS } from '@/types/negotiation';
import styles from './index.module.scss';

interface SignPanelProps {
  role: UserRole;
  mode?: 'sign' | 'resubmit';
  onSubmit: (
    action: SignAction | 'resubmit',
    opinion: string,
    costRequirement?: string,
    supplementAttachments?: AttachmentItem[]
  ) => void;
}

const SUPERVISOR_ACTIONS: SignAction[] = ['agree', 'return_supplement', 'need_design_confirm'];
const OTHER_ACTIONS: SignAction[] = ['agree', 'return_supplement'];

const MOCK_ATTACHMENTS: AttachmentItem[] = [
  { id: 'supp_1', name: '补充测量数据.xlsx', size: '128KB', type: 'xlsx' },
  { id: 'supp_2', name: '现场补充照片.jpg', size: '2.1MB', type: 'jpg' },
  { id: 'supp_3', name: '技术说明文档.pdf', size: '856KB', type: 'pdf' },
];

const SignPanel: React.FC<SignPanelProps> = ({ role, mode = 'sign', onSubmit }) => {
  const [selectedAction, setSelectedAction] = useState<SignAction | null>(null);
  const [opinion, setOpinion] = useState('');
  const [costRequirement, setCostRequirement] = useState('');
  const [supplementAttachments, setSupplementAttachments] = useState<AttachmentItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const actions = role === 'supervisor' ? SUPERVISOR_ACTIONS : OTHER_ACTIONS;
  const isOwner = role === 'owner';
  const isResubmit = mode === 'resubmit';
  const templates = COMMON_OPINIONS[role] || [];

  const handleTemplateClick = (idx: number) => {
    const template = templates[idx];
    if (selectedTemplate === idx) {
      setSelectedTemplate(null);
      setOpinion('');
    } else {
      setSelectedTemplate(idx);
      setOpinion(template);
    }
  };

  const handleAddSupplement = () => {
    const available = MOCK_ATTACHMENTS.filter(
      (a) => !supplementAttachments.some((s) => s.id === a.id)
    );
    if (available.length === 0) {
      Taro.showToast({ title: '暂无更多附件可添加', icon: 'none' });
      return;
    }
    const random = available[Math.floor(Math.random() * available.length)];
    setSupplementAttachments([...supplementAttachments, random]);
  };

  const handleRemoveSupplement = (id: string) => {
    setSupplementAttachments(supplementAttachments.filter((a) => a.id !== id));
  };

  const handleSubmit = () => {
    if (isResubmit) {
      if (!opinion.trim()) return;
      onSubmit('resubmit', opinion.trim(), undefined, supplementAttachments);
      return;
    }
    if (!selectedAction) return;
    if (!opinion.trim()) return;
    onSubmit(
      selectedAction,
      opinion.trim(),
      isOwner ? costRequirement.trim() : undefined,
      supplementAttachments
    );
  };

  const canSubmit = isResubmit
    ? opinion.trim().length > 0
    : selectedAction !== null && opinion.trim().length > 0;

  return (
    <View className={styles.panel}>
      <Text className={styles.sectionTitle}>
        {isResubmit ? '重新提交' : '签署意见'}
      </Text>

      {!isResubmit && (
        <View className={styles.actionGroup}>
          {actions.map((action) => (
            <View
              key={action}
              className={classnames(
                styles.actionBtn,
                selectedAction === action && styles.actionBtnActive
              )}
              onClick={() => setSelectedAction(action)}
            >
              <Text
                className={classnames(
                  styles.actionText,
                  selectedAction === action && styles.actionTextActive
                )}
              >
                {SIGN_ACTION_LABELS[action]}
              </Text>
            </View>
          ))}
        </View>
      )}

      {templates.length > 0 && (
        <View className={styles.templateGroup}>
          <Text className={styles.templateLabel}>常用意见（点击快速填充）</Text>
          <View className={styles.templateList}>
            {templates.map((tpl, idx) => (
              <Text
                key={idx}
                className={classnames(
                  styles.templateItem,
                  selectedTemplate === idx && styles.templateItemActive
                )}
                onClick={() => handleTemplateClick(idx)}
              >
                {tpl}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View className={styles.inputGroup}>
        <Text className={styles.inputLabel}>
          {isResubmit ? '补充说明' : '具体意见'}
        </Text>
        <Textarea
          className={styles.textarea}
          placeholder={isResubmit ? '请填写补充说明内容...' : '请填写具体意见...'}
          value={opinion}
          onInput={(e) => {
            setOpinion(e.detail.value);
            setSelectedTemplate(null);
          }}
          maxlength={500}
        />
      </View>

      {isOwner && !isResubmit && (
        <View className={styles.inputGroup}>
          <Text className={styles.inputLabel}>费用控制要求</Text>
          <Textarea
            className={styles.textarea}
            placeholder="请填写费用控制要求（选填）..."
            value={costRequirement}
            onInput={(e) => setCostRequirement(e.detail.value)}
            maxlength={300}
          />
        </View>
      )}

      <View className={styles.supplementGroup}>
        <Text className={styles.supplementLabel}>补充附件说明</Text>
        <View className={styles.supplementBtn} onClick={handleAddSupplement}>
          <Text>📎</Text>
          <Text>添加补充附件</Text>
        </View>
        {supplementAttachments.length > 0 && (
          <View className={styles.supplementList}>
            {supplementAttachments.map((att) => (
              <View key={att.id} className={styles.supplementItem}>
                <Text className={styles.supplementItemIcon}>📎</Text>
                <Text className={styles.supplementItemName}>{att.name}</Text>
                <Text
                  className={styles.supplementItemRemove}
                  onClick={() => handleRemoveSupplement(att.id)}
                >
                  移除
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Button
        className={classnames(styles.submitBtn, !canSubmit && styles.submitBtnDisabled)}
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {isResubmit ? '重新提交' : '提交签署'}
      </Button>
    </View>
  );
};

export default SignPanel;
