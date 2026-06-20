import { create } from 'zustand';
import type { NegotiationItem, TimelineNode, User } from '@/types/negotiation';
import { mockNegotiations, mockTimelines, mockUser } from '@/data/mockNegotiations';

interface NegotiationState {
  user: User;
  negotiations: NegotiationItem[];
  timelines: Record<string, TimelineNode[]>;
  getTodoList: () => NegotiationItem[];
  getRecordList: () => NegotiationItem[];
  getNegotiationById: (id: string) => NegotiationItem | undefined;
  getTimelineById: (id: string) => TimelineNode[];
  signNegotiation: (id: string, action: string, opinion: string, costRequirement?: string) => void;
}

export const useNegotiationStore = create<NegotiationState>((set, get) => ({
  user: mockUser,
  negotiations: mockNegotiations,
  timelines: mockTimelines,

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
      };

      const existingTimelines = state.timelines[id] || [];
      const updatedTimelines = {
        ...state.timelines,
        [id]: [...existingTimelines, newTimelineNode],
      };

      console.info('[SignNegotiation]', { id, action, opinion });

      return {
        negotiations: updatedNegotiations,
        timelines: updatedTimelines,
      };
    });
  },
}));
