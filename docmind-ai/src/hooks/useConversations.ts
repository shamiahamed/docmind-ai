import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

/**
 * Manages the conversation list + active selection.
 * Lives in component state (no external store needed yet).
 */
export function useConversations(userId: string | undefined) {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  // Load on mount / userId change
  useEffect(() => {
    if (!userId || loaded.current) return;
    loaded.current = true;
    setLoading(true);
    supabase
      .from("conversations")
      .select("id,title,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as Conversation[];
        setConvos(list);
        if (list.length) setActiveId(list[0].id);
        setLoading(false);
      });
  }, [userId]);

  const create = useCallback(
    async (uid: string): Promise<string | null> => {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: uid, title: "New chat" })
        .select("id,title,updated_at")
        .single();
      if (error || !data) return null;
      const c = data as Conversation;
      setConvos((prev) => [c, ...prev]);
      setActiveId(c.id);
      return c.id;
    },
    [],
  );

  const rename = useCallback(async (id: string, title: string) => {
    const updated_at = new Date().toISOString();
    await supabase.from("conversations").update({ title, updated_at }).eq("id", id);
    setConvos((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, title, updated_at } : c))
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    );
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await supabase.from("conversations").delete().eq("id", id);
      setConvos((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (activeId === id) setActiveId(next[0]?.id ?? null);
        return next;
      });
    },
    [activeId],
  );

  return { convos, activeId, loading, setActive: setActiveId, create, rename, remove };
}
