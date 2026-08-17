const test = require('node:test');
const assert = require('node:assert/strict');

const Report = require('../models/Report');
const Comment = require('../models/Comment');

test('report lifecycle resolves the pattern threshold correctly', () => {
  assert.equal(Report.getStatusForReportCount(0), 'Submitted');
  assert.equal(Report.getStatusForReportCount(2), 'UnderReview');
  assert.equal(Report.getStatusForReportCount(3), 'PatternConfirmed');
  assert.match(Report.getLifecycleExplanation('PatternConfirmed'), /3 or more|three or more/i);
});

test('comment validation rejects overlong or abusive text', () => {
  assert.equal(Comment.validateText('x'.repeat(101)), false);
  assert.equal(Comment.validateText('This driver is a stupid liar'), false);
  assert.equal(Comment.validateText('Fare was higher than the meter reading and the ride felt rushed.'), true);
});
