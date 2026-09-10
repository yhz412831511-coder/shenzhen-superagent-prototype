import test from 'node:test';
import assert from 'node:assert/strict';
import {
  brainstormConflicts,
  brainstormContributions,
  brainstormFacts,
  brainstormParticipants,
  brainstormPolicies,
  brainstormTopics,
} from '../app/brainstorm-fixtures.ts';

test('脑暴协作固定为13个岗位、5个议题组和7个跨处室主题', () => {
  assert.equal(brainstormParticipants.length, 13);
  assert.equal(new Set(brainstormParticipants.map((item) => item.id)).size, 13);
  assert.equal(new Set(brainstormParticipants.map((item) => item.groupId)).size, 5);
  assert.equal(brainstormTopics.length, 7);
  assert.equal(brainstormTopics[0].id, 'ai-government');
  assert.equal(brainstormContributions.length, 13);
  assert.ok(brainstormParticipants.every((item) => item.contributionIds.length === 1));
});

test('事实与政策fixture保留合成、待核验和缺口边界', () => {
  assert.deepEqual(
    brainstormFacts.filter((item) => item.value !== null).map((item) => [item.value, item.nature, item.verificationStatus]),
    [
      ['96.4', 'synthetic', 'pending_year_end'],
      ['32', 'synthetic', 'pending_year_end'],
    ],
  );
  assert.equal(brainstormFacts.filter((item) => item.value === null).length, 2);
  assert.ok(brainstormPolicies.every((item) => item.publicationStatus === 'unpublished_or_unknown'));
  assert.ok(brainstormPolicies.every((item) => item.title.includes('待核验')));
});

test('冲突fixture区分普通归并和高影响用户裁决', () => {
  const ordinary = brainstormConflicts.find((item) => item.kind === 'ordinary');
  const highImpact = brainstormConflicts.find((item) => item.kind === 'high_impact');
  assert.equal(ordinary.options.length, 0);
  assert.equal(highImpact.options.length, 3);
  assert.equal(highImpact.options.filter((item) => item.recommended).length, 1);
});
