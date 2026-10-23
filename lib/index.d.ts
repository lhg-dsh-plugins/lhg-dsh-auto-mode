import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { ToolExecution } from '@deepseek-ai/dsh-tools';
export { ArtifactRegistry } from './artifacts.js';
export { createHttpClassifier, sanitizeClassifierArguments, type HttpClassifierConfig } from './classifier.js';
export { createDshClassifier, type DshClassifierConfig } from './dsh-classifier.js';
export { AutoApprovalGrants } from './escalation.js';
export * from './paths.js';
export * from './policy.js';
export * from './shell.js';
export type * from './types.js';
export declare const name = "auto-permission-mode";
export declare const inject: string[];
/** Plugin-owned permission preset key; distinct from the official full-access Auto. */
export declare const AUTO_PERMISSION_PRESET = "sandbox-auto";
export declare const AUTO_MODE_REDUNDANT_SANDBOX_MARKER = "[auto-mode redundant sandbox request]";
export declare const AUTO_MODE_REDUNDANT_SANDBOX_REASON = "[auto-mode redundant sandbox request] Auto already runs in workspace-write. Retry the same tool call after completely removing sandbox_permissions and justification; this call did not execute.";
export declare const AUTO_MODE_REDUNDANT_SANDBOX_RETRY_CONTEXT: string;
/** Dynamic Agent guidance shown only while Auto (or inherited Auto) is active. */
export declare const AUTO_MODE_AGENT_GUIDANCE: string;
/** Host policy configuration. */
export interface Config {
    readonly presetName?: string;
    readonly workspaceRoot?: string;
    readonly dshHome?: string;
    readonly tempRoots?: string[];
    readonly classifierEndpoint?: string;
    readonly classifierProvider?: string;
    readonly classifierModel?: string;
    readonly classifierApiKeyEnv?: string;
    readonly classifierTimeoutMs?: number;
    readonly classifierMaxOutputTokens?: number;
}
export declare const Config: z<Config>;
type AgentSession = NonNullable<ToolExecution['agent']>['session'];
/** Current preset resolver supplied by the Alpha.2 permission projection service. */
export interface CurrentPermissionPreset {
    (session: AgentSession): string;
}
/** Whether the pending tool call belongs to a session currently using the Auto permission preset. */
export declare function isAutoPermissionExecution(exec: Readonly<ToolExecution>, currentPreset: CurrentPermissionPreset, presetName?: string): boolean;
type ParentSessionId = NonNullable<NonNullable<ToolExecution['agent']>['session']['header']['parentSession']>;
interface ParentAgentLookup {
    (sessionId: ParentSessionId): ToolExecution['agent'] | undefined;
}
/**
 * Auto is a session capability, so official in-process subagents inherit it
 * through their durable parentSession lineage. DSH already inherits the
 * parent's tool composition/sandbox but deliberately pins child approval to
 * `never`; applying Auto to every child tool call keeps routine work moving
 * while ambiguous calls fail closed instead of bypassing this policy.
 */
export declare function isAutoOrDelegatedPermissionExecution(exec: Readonly<ToolExecution>, parentAgent: ParentAgentLookup, currentPreset: CurrentPermissionPreset, presetName?: string): boolean;
/** Resolve the direct Auto session whose durable user messages authorize this execution. */
export declare function autoPermissionAuthority(exec: Readonly<ToolExecution>, parentAgent: ParentAgentLookup, currentPreset: CurrentPermissionPreset, presetName?: string): ToolExecution['agent'] | undefined;
/** Rename only the former workspace-sandboxed selection, preserving both durable knobs. */
export declare function migrateLegacyAutoSession(session: AgentSession, presetName?: string): boolean;
export declare function trustedUserMessages(authority: ToolExecution['agent']): string[];
/** Install the automatic permission policy on the official tool pipeline. */
export declare function apply(ctx: Context, config?: Config): void;
//# sourceMappingURL=index.d.ts.map