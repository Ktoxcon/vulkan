import type { EventStatus as EventStatusConst } from "@vulkan/lib/constants/event-status";

export type EventStatus = (typeof EventStatusConst)[keyof typeof EventStatusConst];
