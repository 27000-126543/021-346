import React, { useState } from 'react';
import { View, Text, Textarea, Button } from '@tarojs/components';
import classnames from 'classnames';
import type { UserRole, SignAction } from '@/types/negotiation';
import { SIGN_ACTION_LABELS } from '@/types/negotiation';
import styles from './index.module.scss';

interface SignPanelProps {
  role: UserRole;
  onSubmit: (action: SignAction, opinion: string, costRequirement?: string) => void;
}

const SUPERVISOR_ACTIONS: SignAction[] = ['agree', 'return_supplement', 'need_design_confirm'];

const OTHER_ACTIONS: SignAction[] = ['agree', 'return_supplement'];

const SignPanel: React.FC<SignPanelProps> = ({ role, onSubmit }) => {
  const [selectedAction, setSelectedAction] = useState<SignAction | null>(null);
  const [opinion, setOpinion] = useState('');
  const [costRequirement, setCostRequirement] = useState('');

  const actions = role === 'supervisor' ? SUPERVISOR_ACTIONS : OTHER_ACTIONS;
  const isOwner = role === 'owner';

  const handleSubmit = () => {
    if (!selectedAction) return;
    if (!opinion.trim()) return;
    onSubmit(selectedAction, opinion.trim(), isOwner ? costRequirement.trim() : undefined);
  };

  return (
    <View className={styles.panel}>
      <Text className={styles.sectionTitle}>签署意见</Text>

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

      <View className={styles.inputGroup}>
        <Text className={styles.inputLabel}>具体意见</Text>
        <Textarea
          className={styles.textarea}
          placeholder="请填写具体意见..."
          value={opinion}
          onInput={(e) => setOpinion(e.detail.value)}
          maxlength={500}
        />
      </View>

      {isOwner && (
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

      <Button
        className={classnames(styles.submitBtn, (!selectedAction || !opinion.trim()) && styles.submitBtnDisabled)}
        onClick={handleSubmit}
        disabled={!selectedAction || !opinion.trim()}
      >
        提交签署
      </Button>
    </View>
  );
};

export default SignPanel;
