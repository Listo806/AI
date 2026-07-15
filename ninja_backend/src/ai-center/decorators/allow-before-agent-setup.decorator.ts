import { SetMetadata } from "@nestjs/common";

export const ALLOW_BEFORE_AGENT_SETUP_KEY =
  "allowBeforeAgentSetup";

export const AllowBeforeAgentSetup = () =>
  SetMetadata(
    ALLOW_BEFORE_AGENT_SETUP_KEY,
    true,
  );