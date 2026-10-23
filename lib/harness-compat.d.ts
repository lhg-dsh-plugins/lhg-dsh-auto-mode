import type { SessionEvent } from '@deepseek-ai/dsh-session';
/** Reject old/mixed directly resolved API peers before a user turn.
 * The CLI doctor separately audits the full runtime and profile resolution graph. */
export declare function assertHarnessCompatibility(): void;
/** Alpha.2 exposes events; Alpha.4+ exposes an exclusive seq and eventAt. */
export declare function sessionEventsNewestFirst(session: object): Iterable<SessionEvent>;
//# sourceMappingURL=harness-compat.d.ts.map