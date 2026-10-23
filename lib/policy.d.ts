import type { ToolExecution } from '@deepseek-ai/dsh-tools';
import type { ArtifactRegistry } from './artifacts.js';
import { type PolicyRoots } from './paths.js';
import type { Assessment } from './types.js';
/** One model-requested, tool-native widening of the standing workspace sandbox. */
export interface SandboxWideningRequest {
    readonly requestedMode: 'danger-full-access';
    readonly justification: string;
}
/**
 * @deprecated Use `SandboxRequestState` / `sandboxRequestState` for new code.
 * Kept as a compatibility view for consumers of the pre-rc.2 export.
 */
export interface SandboxEscalationRequest {
    readonly requestedMode: string;
    readonly justification: string;
}
/** Semantic state of the raw sandbox fields before any authorization decision. */
export type SandboxRequestState = {
    readonly kind: 'absent';
} | {
    readonly kind: 'redundant-standing';
} | {
    readonly kind: 'widening';
    readonly request: SandboxWideningRequest;
} | {
    readonly kind: 'invalid';
    readonly requestedMode: unknown;
};
/** Classify the official sandbox request fields without treating them as authorization. */
export declare function sandboxRequestState(argumentsValue: unknown): SandboxRequestState;
/** Read the legacy paired sandbox fields without treating them as authorization. */
export declare function sandboxEscalationRequest(argumentsValue: unknown): SandboxEscalationRequest | undefined;
/** Synchronous hard-deny reason suitable for the monotonic tool guard. */
export declare function hardDenyReason(exec: Readonly<ToolExecution>, roots: PolicyRoots): string | undefined;
/** Deterministic first-pass classification for every normal tool call. */
export declare function assessTool(exec: Readonly<ToolExecution>, roots: PolicyRoots, artifacts: ArtifactRegistry): Assessment;
//# sourceMappingURL=policy.d.ts.map