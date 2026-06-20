export type UserRole = 'owner' | 'supervisor' | 'general_contractor' | 'subcontractor';

export type NodeStatus = 'waiting' | 'processing' | 'completed' | 'returned';

export type SignAction = 'agree' | 'return_supplement' | 'need_design_confirm';

export interface NegotiationItem {
  id: string;
  title: string;
  initiator: string;
  initiatorRole: UserRole;
  currentNode: string;
  currentNodeRole: UserRole;
  status: NodeStatus;
  remainingHours: number;
  changeBasis: string;
  proposedMethod: string;
  photos: string[];
  attachments: AttachmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface TimelineNode {
  id: string;
  negotiationId: string;
  role: UserRole;
  actorName: string;
  action: 'viewed' | 'returned' | 'agreed' | 'submitted' | 'forwarded';
  opinion: string;
  timestamp: string;
  signAction?: SignAction;
  costRequirement?: string;
}

export interface SignOpinion {
  role: UserRole;
  action: SignAction;
  opinion: string;
  costRequirement?: string;
  timestamp: string;
  signer: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  company: string;
  phone: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: '建设单位',
  supervisor: '监理单位',
  general_contractor: '总包单位',
  subcontractor: '分包单位',
};

export const NODE_STATUS_LABELS: Record<NodeStatus, string> = {
  waiting: '待处理',
  processing: '处理中',
  completed: '已完成',
  returned: '已退回',
};

export const SIGN_ACTION_LABELS: Record<SignAction, string> = {
  agree: '同意',
  return_supplement: '退回补充',
  need_design_confirm: '需设计确认',
};

export const TIMELINE_ACTION_LABELS: Record<string, string> = {
  viewed: '查看',
  returned: '退回',
  agreed: '同意',
  submitted: '提交',
  forwarded: '转交',
};
