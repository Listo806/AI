import { SetMetadata } from "@nestjs/common";

/**
 * Marks a route as public so JwtAuthGuard skips authentication for it.
 * Used for endpoints that are hit by third parties without a bearer token,
 * e.g. OAuth callbacks where the provider redirects the user's browser back.
 */
export const IS_PUBLIC_KEY = "isPublic";

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
