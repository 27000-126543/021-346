import dayjs from 'dayjs';

export function formatRemainingTime(hours: number): string {
  if (hours <= 0) return '已超时';
  if (hours < 24) return `${hours}小时`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `${days}天`;
  return `${days}天${remainingHours}小时`;
}

export function formatTime(timestamp: string): string {
  return dayjs(timestamp).format('MM-DD HH:mm');
}

export function formatFullTime(timestamp: string): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm');
}

export function getUrgencyLevel(hours: number): 'urgent' | 'warning' | 'normal' {
  if (hours <= 0) return 'urgent';
  if (hours <= 24) return 'urgent';
  if (hours <= 48) return 'warning';
  return 'normal';
}
