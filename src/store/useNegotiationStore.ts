import { create } from 'zustand';
import dayjs from 'dayjs';
import type { NegotiationItem, TimelineNode, User, UserRole } from '@/types/negotiation';
import { mockNegotiations, mockTimelines, mockUser } from '@/data/mockNegotiations';

interface NegotiationState {
  user: User;
  negotiations: NegotiationItem[];
  timelines: Record<string, TimelineNode[]>;
  switchRole: (role: UserRole) => void;
  getTodoList: () => NegotiationItem[];
  getRecordList: () => NegotiationItem[];
  getNegotiationById: (id: string) => NegotiationItem | undefined;
  getTimelineById: (id: string) => TimelineNode[];
  signNegotiation: (id: string, action: string, opinion: string, costRequirement?: string) => void;
  addViewRecord: (id: string) => void;
}

export const useNegotiationStore = create<NegotiationState>((set, get) => ({
  user: mockUser,
  negotiations: mockNegotiations,
  timelines: mockTimelines,

  switchRole: (role: UserRole) => {
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

  getTodoList: () => {
    const { user, negotiations } = get();
    return negotiations.filter(
      (n) => n.currentNodeRole === user.role && (n.status === 'waiting' || n.status === 'processing')
    );
  },

  getRecordList: () => {
    const { negotiations } = get();
    return negotiations.filter(
      (n) => n.status === 'completed' || n.status === 'returned'
    );
  },

  getNegotiationById: (id: string) => {
    return get().negotiations.find((n) => n.id === id);
  },

  getTimelineById: (id: string) => {
    return get().timelines[id] || [];
  },

  signNegotiation: (id: string, action: string, opinion: string, costRequirement?: string) => {
    set((state) => {
      const updatedNegotiations = state.negotiations.map((n) => {
        if (n.id !== id) return n;
        let newStatus = n.status;
        if (action === 'agree') newStatus = 'completed';
        if (action === 'return_supplement') newStatus = 'returned';
        if (action === 'need_design_confirm') newStatus = 'returned';
        return { ...n, status: newStatus as any, updatedAt: new Date().toISOString() };
      });

      const newTimelineNode: TimelineNode = {
        id: `t_${Date.now()}`,
        negotiationId: id,
        role: state.user.role,
        actorName: state.user.name,
        action: action === 'agree' ? 'agreed' : 'returned',
        opinion,
        signAction: action as any,
        timestamp: new Date().toISOString(),
        ...(costRequirement ? { costRequirement } : {}),
      };

      const existingTimelines = state.timelines[id] || [];
      const updatedTimelines = {
        ...state.timelines,
        [id]: [...existingTimelines, newTimelineNode],
      };

      console.info('[SignNegotiation]', { id, action, opinion, costRequirement });

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
}));
