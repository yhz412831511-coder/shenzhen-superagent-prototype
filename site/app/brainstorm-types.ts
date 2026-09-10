export type BrainstormPhase =
  | 'issue_preparation'
  | 'material_authorization'
  | 'theme_contribution'
  | 'cross_inquiry'
  | 'decision_outline'
  | 'drafting_delivery';

export type BrainstormPhaseStatus =
  | 'awaiting_issue_confirmation'
  | 'awaiting_participants'
  | 'awaiting_scope'
  | 'collecting'
  | 'retrying'
  | 'partial_ready'
  | 'inquiring'
  | 'awaiting_high_impact_decision'
  | 'outline_ready'
  | 'awaiting_outline_confirmation'
  | 'drafting'
  | 'fact_gap_attention'
  | 'awaiting_working_version_confirmation'
  | 'completed';

export type VerificationStatus =
  | 'verified'
  | 'as_of'
  | 'estimated'
  | 'pending_year_end'
  | 'missing';

export type BrainstormParticipant = {
  id: string;
  name: string;
  groupId: string;
  dutyBasis: string;
  dutyBasisDate: string;
  scenarioCapability: string;
  materialScope: string;
  contributionIds: string[];
  selected: boolean;
  status: 'pending' | 'submitted' | 'retrying' | 'missing_view';
  retryCount: number;
};

export type BrainstormTopic = {
  id: string;
  title: string;
  summary: string;
  participantIds: string[];
  contributionIds: string[];
  status: 'pending' | 'ready' | 'needs_attention';
};

export type BrainstormFact = {
  id: string;
  label: string;
  value: string | null;
  unit?: string;
  nature: 'synthetic' | 'authoritative' | 'estimate' | 'pending';
  sourceId: string;
  asOf: string;
  statisticScope: string;
  verificationStatus: VerificationStatus;
  usedIn: string[];
  resolution?: 'keep_limited' | 'remove_from_draft' | 'replace_verified';
};

export type BrainstormPolicy = {
  id: string;
  level: '中央' | '广东省' | '深圳市';
  title: string;
  sourceId: string;
  sourceDate: string;
  publicationStatus:
    | 'published_verified'
    | 'published_pending_check'
    | 'unpublished_or_unknown';
  topicIds: string[];
};

export type BrainstormContribution = {
  id: string;
  participantId: string;
  position: string;
  basisStatus: string;
  questions: { participantId: string; text: string }[];
  draftImpact: string;
  achievement: string;
  problem: string;
  policyResponses: string[];
  nextYearSuggestion: string;
  factIds: string[];
  sourceRefs: string[];
  subtitle: string;
  collaborationNeeds: string[];
  status: 'ready' | 'pending';
};

export type BrainstormRoundEntry = {
  participantId: string;
  effect: 'origin' | 'add' | 'challenge' | 'correct' | 'keep';
  statement: string;
  basisStatus: string;
  outcome: string;
  responseToParticipantId?: string;
};

export type BrainstormRound = {
  id: 'v0' | 'v1' | 'v2';
  version: 0 | 1 | 2;
  title: string;
  focus: string;
  description: string;
  entries: BrainstormRoundEntry[];
  consensus: string[];
  conflicts: string[];
  artifacts: string[];
  continuationReason: string;
  status: 'pending' | 'active' | 'completed';
};

export type BrainstormEvolutionChange = {
  kind:
    | 'added_condition'
    | 'corrected_boundary'
    | 'formed_dependency'
    | 'reduced_claim';
  participantIds: string[];
  text: string;
  impact: string;
};

export type BrainstormEvolution = {
  baselineTitle: string;
  baselineText: string;
  convergedTitle: string;
  convergedText: string;
  changes: BrainstormEvolutionChange[];
  finalText?: string;
};

export type BrainstormConflictOption = {
  id: string;
  label: string;
  impact: string;
  recommended?: boolean;
};

export type BrainstormConflict = {
  id: string;
  title: string;
  kind: 'ordinary' | 'high_impact';
  category:
    | 'direction'
    | 'boundary'
    | 'responsibility'
    | 'policy'
    | 'commitment'
    | 'wording';
  participantIds: string[];
  inquiryRounds: number;
  status: 'pending' | 'resolved' | 'deferred';
  summary: string;
  options: BrainstormConflictOption[];
  selectedOptionId?: string;
};

export type BrainstormDecision = {
  id: string;
  conflictId: string;
  optionId: string;
  actor: string;
  at: string;
  impact: string;
  boundary: string;
};

export type BrainstormEvent = {
  id: string;
  type: string;
  at: string;
  actor: string;
  entityId: string;
  from: string;
  to: string;
  reason: string;
};

export type BrainstormArtifactMeta = {
  artifactId: string;
  evidenceIds: string[];
  nature: 'synthetic_working_version';
  asOf: string;
  verificationStatus: 'pending_review' | 'reviewed';
};

export type BrainstormFlow = {
  id: string;
  taskId: string;
  version: number;
  phase: BrainstormPhase;
  phaseStatus: BrainstormPhaseStatus;
  stopped: boolean;
  source: string;
  scenarioAt: string;
  factCutoff: string;
  issue: {
    title: string;
    goal: string;
    audience: string;
    period: string;
    policyRange: string;
    outputs: string[];
    quality: string;
    boundary: string;
    confirmed: boolean;
  };
  participants: BrainstormParticipant[];
  sourceScopes: {
    publicDuties: boolean;
    authorizedSummaries: boolean;
    crossOfficeOriginals: boolean;
    personalMemory: boolean;
    confirmed: boolean;
  };
  topics: BrainstormTopic[];
  contributions: BrainstormContribution[];
  consensus: { id: string; text: string }[];
  conflicts: BrainstormConflict[];
  decisions: BrainstormDecision[];
  facts: BrainstormFact[];
  policies: BrainstormPolicy[];
  rounds: BrainstormRound[];
  evolution: BrainstormEvolution;
  artifactIds: string[];
  artifactMeta: BrainstormArtifactMeta[];
  completedPhaseIds: BrainstormPhase[];
  pendingAttention: string[];
  anchors: Partial<
    Record<
      | 'issue'
      | 'participants'
      | 'scope'
      | 'synthesis'
      | 'round'
      | 'decision'
      | 'outline'
      | 'gaps'
      | 'final',
      string
    >
  >;
  eventLog: BrainstormEvent[];
};

export type BrainstormState = { flows: Record<string, BrainstormFlow> };

export type BrainstormAction =
  | {
      type: 'issue-update';
      taskId: string;
      field: 'goal' | 'audience' | 'period' | 'quality';
      value: string;
    }
  | { type: 'issue-confirm'; taskId: string }
  | { type: 'participants-toggle'; taskId: string; participantId: string }
  | { type: 'participants-confirm'; taskId: string }
  | {
      type: 'scope-toggle';
      taskId: string;
      field: 'crossOfficeOriginals' | 'personalMemory';
    }
  | { type: 'scope-confirm'; taskId: string }
  | { type: 'collect'; taskId: string }
  | { type: 'inquire'; taskId: string }
  | {
      type: 'decision-resolve';
      taskId: string;
      conflictId: string;
      optionId: string;
    }
  | { type: 'outline-confirm'; taskId: string }
  | { type: 'artifacts-generate'; taskId: string }
  | {
      type: 'fact-gap-resolve';
      taskId: string;
      resolution: 'keep_limited' | 'remove_from_draft';
    }
  | { type: 'working-version-confirm'; taskId: string }
  | { type: 'pause'; taskId: string }
  | { type: 'resume'; taskId: string };

export type BrainstormEffect =
  | {
      type: 'message';
      role: 'user' | 'assistant' | 'system';
      text: string;
      anchor?: keyof BrainstormFlow['anchors'];
    }
  | {
      type: 'artifact';
      name: string;
      body: string;
      source: string;
      evidenceIds: string[];
    };

export type BrainstormTransition = {
  state: BrainstormState;
  effects: BrainstormEffect[];
  notice?: string;
};
