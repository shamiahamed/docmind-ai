import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

type ConvoStore = {
  convos: Conversation[];
  activeId: string | null;
  loading: boolean;

  load: (userId: string) => Promise<void>;
  setActive: (id: string | null) => void;
  createConvo: (userId: string) => Promise<string | null>;
  renameConvo: (id: string, title: string) => Promise<void>;
  deleteConvo: (id: string) => Promise<void>;
  upsert: (convo: Conversation) => void;
};

export const useConvoStore = create<ConvoStore>((set, get) => ({
  convos: [],
  activeId: null,
  loading: false,

  load: async (userId) => {
    set({ loading: true });
    const { data } = await supabase
      .from("conversations")
      .select("id,title,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    const list = (data ?? []) as Conversation[];
    set({
      convos: list,
      activeId: list.length ? list[0].id : null,
      loading: false,
    });
  },

  setActive: (id) => set({ activeId: id }),

  createConvo: async (userId) => {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title: "New chat" })
      .select("id,title,updated_at")
      .single();
    if (error || !data) return null;
    const convo = data as Conversation;
    set((s) => ({ convos: [convo, ...s.convos], activeId: convo.id }));
    return convo.id;
  },

  renameConvo: async (id, title) => {
    const updated_at = new Date().toISOString();
    await supabase.from("conversations").update({ title, updated_at }).eq("id", id);
    set((s) => ({
      convos: s.convos.map((c) => (c.id === id ? { ...c, title, updated_at } : c)),
    }));
  },

  deleteConvo: async (id) => {
    await supabase.from("conversations").delete().eq("id", id);
    set((s) => {
      const convos = s.convos.filter((c) => c.id !== id);
      const activeId =
        s.activeId === id ? (convos[0]?.id ?? null) : s.activeId;
      return { convos, activeId };
    });
  },

  upsert: (convo) =>
    set((s) => {
      const exists = s.convos.some((c) => c.id === convo.id);
      const convos = exists
        ? s.convos.map((c) => (c.id === convo.id ? convo : c))
        : [convo, ...s.convos];
      // Keep sorted by updated_at desc
      convos.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
      return { convos };
    }),
}));
