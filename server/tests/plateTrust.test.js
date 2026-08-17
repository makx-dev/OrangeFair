const test = require('node:test');
const assert = require('node:assert/strict');

const { calculatePlateTrust } = require('../utils/plateTrust');

test('calculatePlateTrust rewards accurate rides and penalizes confirmed pattern reports', () => {
  const result = calculatePlateTrust({
    rides: [
      { fareAmount: 120, dropPoints: [{ distanceFromPickup: 5 }, { distanceFromPickup: 10 }] },
      { fareAmount: 150, dropPoints: [{ distanceFromPickup: 5 }, { distanceFromPickup: 10 }] },
      { fareAmount: 250, dropPoints: [{ distanceFromPickup: 12 }, { distanceFromPickup: 13 }] },
    ],
    reports: [{ status: 'PatternConfirmed' }, { status: 'PatternConfirmed' }],
  });

  assert.equal(result.trustTier, 'Watch');
  assert.ok(result.trustScore >= 40 && result.trustScore <= 69);
  assert.match(result.explanation, /PatternConfirmed/i);
});

test('calculatePlateTrust grants a trusted tier when ride accuracy is high and reports are clean', () => {
  const result = calculatePlateTrust({
    rides: [
      { fareAmount: 135, dropPoints: [{ distanceFromPickup: 5 }, { distanceFromPickup: 7 }] },
      { fareAmount: 140, dropPoints: [{ distanceFromPickup: 5 }, { distanceFromPickup: 7 }] },
      { fareAmount: 130, dropPoints: [{ distanceFromPickup: 5 }, { distanceFromPickup: 7 }] },
    ],
    reports: [],
  });

  assert.equal(result.trustTier, 'Trusted');
  assert.ok(result.trustScore >= 70);
});
