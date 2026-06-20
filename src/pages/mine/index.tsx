import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useNegotiationStore } from '@/store/useNegotiationStore';
import { ROLE_LABELS } from '@/types/negotiation';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { user } = useNegotiationStore();

  const handleMenuClick = (type: string) => {
    Taro.showToast({ title: '功能开发中', icon: 'none' });
    console.info('[Mine] menu click', type);
  };

  return (
    <View className={styles.container}>
      <View className={styles.profileHeader}>
        <View className={styles.avatar}>
          <Text className={styles.avatarText}>{user.name.charAt(0)}</Text>
        </View>
        <Text className={styles.userName}>{user.name}</Text>
        <Text className={styles.userRole}>{user.roleLabel}</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>个人信息</Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>姓名</Text>
            <Text className={styles.infoValue}>{user.name}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>角色</Text>
            <View className={styles.roleBadge}>
              <Text className={styles.roleBadgeText}>{ROLE_LABELS[user.role]}</Text>
            </View>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>单位</Text>
            <Text className={styles.infoValue}>{user.company}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>联系电话</Text>
            <Text className={styles.infoValue}>{user.phone}</Text>
          </View>
        </View>

        <View className={styles.menuCard}>
          <View className={styles.menuItem} onClick={() => handleMenuClick('notification')}>
            <Text className={styles.menuLabel}>消息通知设置</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuClick('switchRole')}>
            <Text className={styles.menuLabel}>切换角色</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuClick('about')}>
            <Text className={styles.menuLabel}>关于</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>

        <Text className={styles.versionText}>洽商会签 v1.0.0</Text>
      </View>
    </View>
  );
};

export default MinePage;
