/**
 * save.ts - Unified save & storage persistence interface.
 * Re-exports the persistence routines from storage.ts and gameState.ts,
 * providing the single entry point expected by RUN.DOT game templates.
 */
export * from './storage.ts';
export * from './gameState.ts';
