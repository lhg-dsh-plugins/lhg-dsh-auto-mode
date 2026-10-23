/** Conservative support for the native *** Begin Patch format. Other dialects ask. */
export interface PatchEffect {
    readonly kind: 'create-or-overwrite' | 'delete';
    readonly path: string;
}
export declare function patchPayload(args: unknown): string | undefined;
export declare function patchPayloadsForGuard(args: unknown): string[];
/** Inspect both native and unified headers for critical destinations, even in malformed patches. */
export declare function patchGuardPaths(patch: string): string[];
export declare function parsePatchEffects(patch: string): PatchEffect[] | undefined;
//# sourceMappingURL=patch.d.ts.map