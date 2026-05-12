import type { ReactNode } from "react";
import type { ThemeDefinition } from "../types";
import { cn } from "../utils/cn";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  theme: ThemeDefinition;
  align?: "left" | "center";
  action?: ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  lead,
  theme,
  align = "center",
  action
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto mb-12 flex max-w-6xl flex-col gap-5",
        align === "center" ? "items-center text-center" : "items-start text-start"
      )}
    >
      <div>
        <p className={theme.classes.sectionEyebrow}>{eyebrow}</p>
        <h2 className={theme.classes.sectionTitle}>{title}</h2>
        {lead ? <p className={theme.classes.sectionLead}>{lead}</p> : null}
        <div className={theme.classes.divider} aria-hidden="true" />
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
