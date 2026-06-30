import { env } from "./env";
import type { Gateway } from "./gateway";
import { mockGateway } from "./mockGateway";
import { realGateway } from "./realGateway";

export const gateway: Gateway = env.useMock ? mockGateway : realGateway;
