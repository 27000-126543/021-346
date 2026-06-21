import { create } from 'zustand';
import dayjs from 'dayjs';
import type { NegotiationItem, TimelineNode, User, UserRole, AttachmentItem } from '@/types/negotiation';
import { FLOW_ORDER, NODE_NAME_MAP } from '@/types/negotiation';
import { mockNegotiations, mockTimelines, mockUser } from '@/data/mockNegotiations';

const STORAGE_KEY_NEGOTIATIONS = 'negotiation_store_negotiations';
const STORAGE_KEY_TIMELINES = 'negotiation_store_timelines';
const STORAGE_KEY_USER = 'negotiation_store_user';

const ROLE_LABEL_MAP: Record<UserRole, string> = {
  owner: '建设单位代表',
  supervisor: '监理工程师',
  general_contractor: '总包项目经理',
  subcontractor: '分包负责人',
};

const COMPANY_MAP: Record<UserRole, string> = {
  owner: '瑞达置业发展有限公司',
  supervisor: '华诚工程监理有限公司',
  general_contractor: '中建三局第一项目部',
  subcontractor: '鑫达装饰工程公司',
};

const NEXT_ROLE = (currentRole: UserRole): UserRole | null => {
  const idx = FLOW_ORDER.indexOf(currentRole);
  if (idx < 0 || idx >= FLOW_ORDER.length - 1) return null;
  return FLOW_ORDER[idx + 1];
};

const PREV_ROLE = (currentRole: UserRole): UserRole | null => {
  const idx = FLOW_ORDER.indexOf(currentRole);
  if (idx <= 0) return null;
  return FLOW_ORDER[idx - 1];
};

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const saveToStorage = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

export interface NegotiationState {
  user: User;
  negotiations: NegotiationItem[];
  timelines: Record<string, TimelineNode[]>;
  switchRole: (role: UserRole) => void;
  getNegotiationById: (id: string) => NegotiationItem | undefined;
  getTimelineById: (id: string) => TimelineNode[];
  signNegotiation: (
    id: string,
    action: 'agree' | 'return_supplement' | 'need_design_confirm',
    opinion: string,
    costRequirement?: string,
    supplementAttachments?: AttachmentItem[]
  ) => void;
  resubmitNegotiation: (
    id: string,
    opinion: string,
    supplementAttachments?: AttachmentItem[]
  ) => void;
  urgeNegotiation: (id: string) => void;
  addViewRecord: (id: string) => void;
  addExportRecord: (ids: string[], exportType: 'single' | 'batch' | 'share' | 'print') => void;
}

const selectUser = (s: NegotiationState) => s.user;
const selectNegotiations = (s: NegotiationState) => s.negotiations;
const selectTimelines = (s: NegotiationState) => s.timelines;
const selectTodoList = (s: NegotiationState) =>
  s.negotiations.filter((n) => {
    if (n.currentNodeRole !== s.user.role) return false;
    if (n.status === 'waiting' || n.status === 'processing') return true;
    if (n.status === 'returned') return true;
    return false;
  });
const selectRecordList = (s: NegotiationState) =>
  s.negotiations.filter((n) => n.status === 'completed');

export { selectUser, selectNegotiations, selectTimelines, selectTodoList, selectRecordList };

export const useNegotiationStore = create<NegotiationState>((set, get) => ({
  user: loadFromStorage(STORAGE_KEY_USER, mockUser),
  negotiations: loadFromStorage(STORAGE_KEY_NEGOTIATIONS, mockNegotiations),
  timelines: loadFromStorage(STORAGE_KEY_TIMELINES, mockTimelines),

  switchRole: (role: UserRole) => {
    set((state) => {
      const newUser = {
        ...state.user,
        role,
        roleLabel: ROLE_LABEL_MAP[role],
        company: COMPANY_MAP[role],
      };
      saveToStorage(STORAGE_KEY_USER, newUser);
      return { user: newUser };
    });
    console.info('[SwitchRole] 切换角色', role);
  },

  getNegotiationById: (id: string) => {
    return get().negotiations.find((n) => n.id === id);
  },

  getTimelineById: (id: string) => {
    return get().timelines[id] || [];
  },

  signNegotiation: (id, action, opinion, costRequirement, supplementAttachments) => {
    set((state) => {
      const signerRole = state.user.role;
      const updatedNegotiations = state.negotiations.map((n) => {
        if (n.id !== id) return n;

        let newStatus: NegotiationItem['status'] = n.status;
        let newNodeRole: UserRole = n.currentNodeRole;
        let newNodeName: string = n.currentNode;

        if (action === 'agree') {
          const next = NEXT_ROLE(n.currentNodeRole);
          if (next) {
            newNodeRole = next;
            newNodeName = NODE_NAME_MAP[next];
            newStatus = 'waiting';
          } else {
            newStatus = 'completed';
          }
        } else {
          const prev = PREV_ROLE(n.currentNodeRole) || n.initiatorRole;
          newNodeRole = prev;
          newNodeName = NODE_NAME_MAP[prev];
          newStatus = 'returned';
        }

        const updatedSupp = supplementAttachments && supplementAttachments.length > 0
          ? [...(n.supplementAttachments || []), ...supplementAttachments]
          : n.supplementAttachments;

        return {
          ...n,
          status: newStatus,
          currentNodeRole: newNodeRole,
          currentNode: newNodeName,
          updatedAt: new Date().toISOString(),
          supplementAttachments: updatedSupp,
        };
      });

      const targetNeg = updatedNegotiations.find((n) => n.id === id);
      const newTimelineNode: TimelineNode = {
        id: `t_${Date.now()}`,
        negotiationId: id,
        role: signerRole,
        actorName: state.user.name,
        action: action === 'agree' ? 'agreed' : 'returned',
        opinion,
        signAction: action,
        timestamp: new Date().toISOString(),
        ...(costRequirement ? { costRequirement } : {}),
        ...(action !== 'agree' ? { returnFromRole: signerRole, returnReason: opinion } : {}),
        ...(supplementAttachments && supplementAttachments.length > 0 ? { supplementAttachments } : {}),
      };

      const existingTimelines = state.timelines[id] || [];
      const updatedTimelines = {
        ...state.timelines,
        [id]: [...existingTimelines, newTimelineNode],
      };

      saveToStorage(STORAGE_KEY_NEGOTIATIONS, updatedNegotiations);
      saveToStorage(STORAGE_KEY_TIMELINES, updatedTimelines);

      console.info('[SignNegotiation]', {
        id,
        action,
        opinion,
        costRequirement,
        nextStatus: targetNeg?.status,
        nextNode: targetNeg?.currentNode,
      });

      return {
        negotiations: updatedNegotiations,
        timelines: updatedTimelines,
      };
    });
  },

  resubmitNegotiation: (id, opinion, supplementAttachments) => {
    set((state) => {
      const current = state.negotiations.find((n) => n.id === id);
      if (!current || current.status !== 'returned') return {};

      const nextRole = NEXT_ROLE(current.currentNodeRole) || current.initiatorRole;
      const updatedNegotiations = state.negotiations.map((n) => {
        if (n.id !== id) return n;
        const updatedSupp = supplementAttachments && supplementAttachments.length > 0
          ? [...(n.supplementAttachments || []), ...supplementAttachments]
          : n.supplementAttachments;
        return {
          ...n,
          status: 'waiting',
          currentNodeRole: nextRole,
          currentNode: NODE_NAME_MAP[nextRole],
          updatedAt: new Date().toISOString(),
          supplementAttachments: updatedSupp,
        };
      });

      const targetNeg = updatedNegotiations.find((n) => n.id === id);
      const newTimelineNode: TimelineNode = {
        id: `t_${Date.now()}`,
        negotiationId: id,
        role: state.user.role,
        actorName: state.user.name,
        action: 'resubmitted',
        opinion,
        timestamp: new Date().toISOString(),
        ...(supplementAttachments && supplementAttachments.length > 0 ? { supplementAttachments } : {}),
      };

      const existingTimelines = state.timelines[id] || [];
      const updatedTimelines = {
        ...state.timelines,
        [id]: [...existingTimelines, newTimelineNode],
      };

      saveToStorage(STORAGE_KEY_NEGOTIATIONS, updatedNegotiations);
      saveToStorage(STORAGE_KEY_TIMELINES, updatedTimelines);

      console.info('[ResubmitNegotiation]', {
        id,
        opinion,
        nextNode: targetNeg?.currentNode,
      });

      return {
        negotiations: updatedNegotiations,
        timelines: updatedTimelines,
      };
    });
  },

  urgeNegotiation: (id: string) => {
    set((state) => {
      const current = state.negotiations.find((n) => n.id === id);
      if (!current) return {};

      const newTimelineNode: TimelineNode = {
        id: `t_${Date.now()}`,
        negotiationId: id,
        role: state.user.role,
        actorName: state.user.name,
        action: 'urged',
        opinion: '请尽快处理该洽商',
        timestamp: new Date().toISOString(),
        urgeTargetRole: current.currentNodeRole,
      };

      const existingTimelines = state.timelines[id] || [];
      const updatedTimelines = {
        ...state.timelines,
        [id]: [...existingTimelines, newTimelineNode],
      };

      saveToStorage(STORAGE_KEY_TIMELINES, updatedTimelines);

      console.info('[UrgeNegotiation]', {
        id,
        from: state.user.role,
        to: current.currentNodeRole,
      });

      return { timelines: updatedTimelines };
    });
  },

  addViewRecord: (id: string) => {
    set((state) => {
      const existingTimelines = state.timelines[id] || [];
      const todayStr = dayjs().format('YYYY-MM-DD');
      const hasTodayView = existingTimelines.some(
        (t) =>
          t.action === 'viewed' &&
          t.actorName === state.user.name &&
          t.role === state.user.role &&
          dayjs(t.timestamp).format('YYYY-MM-DD') === todayStr
      );
      if (hasTodayView) {
        return {};
      }
      const newNode: TimelineNode = {
        id: `t_${Date.now()}`,
        negotiationId: id,
        role: state.user.role,
        actorName: state.user.name,
        action: 'viewed',
        opinion: '',
        timestamp: new Date().toISOString(),
      };
      const updatedTimelines = {
        ...state.timelines,
        [id]: [...existingTimelines, newNode],
      };
      saveToStorage(STORAGE_KEY_TIMELINES, updatedTimelines);
      console.info('[AddViewRecord]', { id, actor: state.user.name });
      return { timelines: updatedTimelines };
    });
  },

  addExportRecord: (ids: string[], exportType) => {
    set((state) => {
      const newTimelines = { ...state.timelines };
      const now = new Date().toISOString();
      ids.forEach((id, idx) => {
        const list = newTimelines[id] || [];
        const newNode: TimelineNode = {
          id: `t_${Date.now()}_${idx}`,
          negotiationId: id,
          role: state.user.role,
          actorName: state.user.name,
          action: 'exported',
          opinion: '',
          timestamp: now,
          exportType,
        };
        newTimelines[id] = [...list, newNode];
      });
      saveToStorage(STORAGE_KEY_TIMELINES, newTimelines);
      console.info('[AddExportRecord]', { ids, exportType, actor: state.user.name });
      return { timelines: newTimelines };
    });
  },
}));
