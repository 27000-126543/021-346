import { create } from 'zustand';
import dayjs from 'dayjs';
import type { NegotiationItem, TimelineNode, User, UserRole } from '@/types/negotiation';
import { FLOW_ORDER, NODE_NAME_MAP } from '@/types/negotiation';
import { mockNegotiations, mockTimelines, mockUser } from '@/data/mockNegotiations';

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
    costRequirement?: string
  ) => void;
  addViewRecord: (id: string) => void;
  addExportRecord: (ids: string[], exportType: 'single' | 'batch' | 'share' | 'print') => void;
}

const selectUser = (s: NegotiationState) => s.user;
const selectNegotiations = (s: NegotiationState) => s.negotiations;
const selectTimelines = (s: NegotiationState) => s.timelines;
const selectTodoList = (s: NegotiationState) =>
  s.negotiations.filter(
    (n) => n.currentNodeRole === s.user.role && (n.status === 'waiting' || n.status === 'processing')
  );
const selectRecordList = (s: NegotiationState) =>
  s.negotiations.filter((n) => n.status === 'completed' || n.status === 'returned');

export { selectUser, selectNegotiations, selectTimelines, selectTodoList, selectRecordList };

export const useNegotiationStore = create<NegotiationState>((set, get) => ({
  user: mockUser,
  negotiations: mockNegotiations,
  timelines: mockTimelines,

  switchRole: (role: UserRole) => {
    set((state) => ({
      user: {
        ...state.user,
        role,
        roleLabel: ROLE_LABEL_MAP[role],
        company: COMPANY_MAP[role],
      },
    }));
    console.info('[SwitchRole] 切换角色', role);
  },

  getNegotiationById: (id: string) => {
    return get().negotiations.find((n) => n.id === id);
  },

  getTimelineById: (id: string) => {
    return get().timelines[id] || [];
  },

  signNegotiation: (id, action, opinion, costRequirement) => {
    set((state) => {
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

        return {
          ...n,
          status: newStatus,
          currentNodeRole: newNodeRole,
          currentNode: newNodeName,
          updatedAt: new Date().toISOString(),
        };
      });

      const targetNeg = updatedNegotiations.find((n) => n.id === id);
      const newTimelineNode: TimelineNode = {
        id: `t_${Date.now()}`,
        negotiationId: id,
        role: state.user.role,
        actorName: state.user.name,
        action: action === 'agree' ? 'agreed' : 'returned',
        opinion,
        signAction: action,
        timestamp: new Date().toISOString(),
        ...(costRequirement ? { costRequirement } : {}),
      };

      const existingTimelines = state.timelines[id] || [];
      const updatedTimelines = {
        ...state.timelines,
        [id]: [...existingTimelines, newTimelineNode],
      };

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
      console.info('[AddViewRecord]', { id, actor: state.user.name });
      return {
        timelines: {
          ...state.timelines,
          [id]: [...existingTimelines, newNode],
        },
      };
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
      console.info('[AddExportRecord]', { ids, exportType, actor: state.user.name });
      return { timelines: newTimelines };
    });
  },
}));
