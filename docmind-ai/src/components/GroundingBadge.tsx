import type { Critique } from "@/lib/services/types";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

export function GroundingBadge({ critique }: { critique?: Critique }) {
  if (!critique) return null;
  const map = {
    pass: { cls: "dm-grade-pass", Icon: ShieldCheck, text: "Grounded" },
    revise: { cls: "dm-grade-warn", Icon: ShieldAlert, text: "Needs review" },
    fail: { cls: "dm-grade-fail", Icon: ShieldX, text: "Ungrounded" },
  } as const;
  const { cls, Icon, text } = map[critique.verdict];
  return (
    <span className={`d-inline-flex align-items-center gap-1 ${cls}`} style={{ fontSize: 12 }}>
      <Icon size={14} /> {text}
      {critique.issues?.length ? <span className="dm-text-muted">· {critique.issues.length} issue(s)</span> : null}
    </span>
  );
}
