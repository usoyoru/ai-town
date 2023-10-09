import { memoryTables } from './memory';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { embeddingsCacheTables } from './embeddingsCache';
import { agentWaitingOn, schedulingTables } from './scheduling';

const agentScheduler = v.object({
  worldId: v.id('worlds'),
  generationNumber: v.number(),
  lastRun: v.optional(v.number()),
  state: v.union(
    v.object({
      kind: v.literal('waiting'),
      timer: v.optional(v.number()),
    }),
    v.object({
      kind: v.literal('scheduled'),
    }),
    v.object({
      kind: v.literal('stopped'),
    }),
  ),
});

const agents = v.object({
  worldId: v.id('worlds'),
  playerId: v.id('players'),
  identity: v.string(),
  plan: v.string(),

  // Set of in-progress inputs for the agent. The inputs in this
  // array last across runs of the agent, unlike the per-step
  // waits managed by the scheduling system below.
  inProgressInputs: v.array(v.id('inputs')),
  inProgressAction: v.optional(
    v.object({
      name: v.string(),
      started: v.number(),
    }),
  ),
  // We only use this generation number for "cancelling" inflight actions,
  // not for actually preempting the agent, which is handled by the scheduler.
  generationNumber: v.number(),

  state: v.union(
    v.object({
      kind: v.literal('waiting'),
      timer: v.optional(v.number()),
    }),
    v.object({
      kind: v.literal('scheduled'),
    }),
  ),
  // Last set of events the agent was waiting on for debugging.
  waitingOn: v.optional(v.array(agentWaitingOn)),
});

// Separate out this flag from `agents` since it changes a lot less
// frequently.
const agentIsThinking = v.object({
  playerId: v.id('players'),
  since: v.number(),
});

export const agentTables = {
  agentSchedulers: defineTable(agentScheduler).index('worldId', ['worldId']),

  agents: defineTable(agents)
    .index('playerId', ['playerId'])
    .index('worldIdStatus', ['worldId', 'state.kind', 'state.timer']),
  agentIsThinking: defineTable(agentIsThinking).index('playerId', ['playerId']),

  ...memoryTables,
  ...embeddingsCacheTables,
  ...schedulingTables,
};
