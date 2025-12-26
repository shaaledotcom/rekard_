import {
  Edit3,
  Globe,
  Package,
  Archive,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TicketStatus, CreateTicketRequest } from "@/store/api";

// Status configuration for tickets
export interface TicketStatusConfig {
  label: string;
  variant: "draft" | "published" | "sold_out" | "archived";
  icon: LucideIcon;
}

export const ticketStatusConfig: Record<TicketStatus, TicketStatusConfig> = {
  draft: { label: "Draft", variant: "draft", icon: Edit3 },
  published: { label: "Published", variant: "published", icon: Globe },
  sold_out: { label: "Sold Out", variant: "sold_out", icon: Package },
  archived: { label: "Archived", variant: "archived", icon: Archive },
};

// Default form values for creating a ticket
export const defaultTicketFormValues: CreateTicketRequest = {
  title: "",
  description: "",
  url: "",
  price: 0,
  currency: "INR",
  total_quantity: 100,
  max_quantity_per_user: 5,
  purchase_without_login: false,
  geoblocking_enabled: false,
  status: "draft",
};

// Animation variants for Framer Motion
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const cardHover = {
  scale: 1.02,
  transition: { type: "spring", stiffness: 300 },
};

