export type UserRole = 'owner' | 'supervisor' | 'general_contractor' | 'subcontractor';

export type NodeStatus = 'waiting' | 'processing' | 'completed' | 'returned';

export type SignAction = 'agree' | 'return_supplement' | 'need_design_confirm';

export type TimelineAction =
  | 'viewed'
  | 'returned'
  | 'agreed'
  | 'submitted'
  | 'forwarded'
  | 'exported'
  | 'urged'
  | 'resubmitted';

export const FLOW_ORDER: UserRole[] = [
  'subcontractor',
  'general_contractor',
  'supervisor',
  'owner',
];

export const NODE_NAME_MAP: Record<UserRole, string> = {
  subcontractor: '分包审核',
  general_contractor: '总包审核',
  supervisor: '监理审核',
  owner: '建设单位审核',
};

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
  supplementAttachments?: AttachmentItem[];
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
  action: TimelineAction;
  opinion: string;
  timestamp: string;
  signAction?: SignAction;
  costRequirement?: string;
  exportType?: 'single' | 'batch' | 'share' | 'print';
  returnFromRole?: UserRole;
  returnReason?: string;
  urgeTargetRole?: UserRole;
  supplementAttachments?: AttachmentItem[];
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
  exported: '导出会签包',
  urged: '催办',
  resubmitted: '重新提交',
};

export const COMMON_OPINIONS: Record<UserRole, string[]> = {
  owner: [
    '同意变更，按预算内费用执行',
    '原则同意，费用需严格控制',
    '请补充详细费用测算后再报',
    '需走招投标流程确定单价',
  ],
  supervisor: [
    '情况属实，同意变更',
    '同意按此方案施工，请总包做好质量管控',
    '建议请设计单位出具正式变更图',
    '需补充现场实测数据',
    '附件不完整，请补充相关资料',
  ],
  general_contractor: [
    '同意按此方案执行',
    '已核实现场情况，情况属实',
    '请明确费用承担方后再施工',
    '需补充技术交底记录',
    '工期影响需另行评估',
  ],
  subcontractor: [
    '现场情况已核实，申请变更',
    '按甲方要求调整做法，特此申请',
    '原做法无法实施，申请变更',
    '已补充相关证明材料，请审核',
  ],
};
