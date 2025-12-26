import {
  Edit3,
  Globe,
  Zap,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EventStatus, CreateEventRequest } from "@/store/api";

// Status configuration
export interface StatusConfig {
  label: string;
  variant: "draft" | "published" | "live" | "completed" | "cancelled";
  icon: LucideIcon;
}

export const statusConfig: Record<EventStatus, StatusConfig> = {
  draft: { label: "Draft", variant: "draft", icon: Edit3 },
  published: { label: "Published", variant: "published", icon: Globe },
  live: { label: "LIVE", variant: "live", icon: Zap },
  completed: { label: "Completed", variant: "completed", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "cancelled", icon: XCircle },
};

// Default form values
export const defaultFormValues: CreateEventRequest = {
  title: "",
  description: "",
  start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
  language: "en",
  is_vod: false,
  convert_to_vod_after_event: false,
  max_concurrent_viewers_per_link: 1,
  signup_disabled: false,
  purchase_disabled: false,
  status: "published",
  watch_upto: "",
  archive_after: "",
};
