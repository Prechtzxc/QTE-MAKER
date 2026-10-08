declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";

  export type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

  export const ArrowLeft: LucideIcon;
  export const Calculator: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Copy: LucideIcon;
  export const Download: LucideIcon;
  export const Eye: LucideIcon;
  export const FileText: LucideIcon;
  export const FolderOpen: LucideIcon;
  export const GripVertical: LucideIcon;
  export const Info: LucideIcon;
  export const LayoutList: LucideIcon;
  export const LoaderCircle: LucideIcon;
  export const Plus: LucideIcon;
  export const Save: LucideIcon;
  export const Search: LucideIcon;
  export const Settings: LucideIcon;
  export const Trash2: LucideIcon;
}
