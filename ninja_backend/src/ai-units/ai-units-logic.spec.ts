import {
  computeCycleReset,
  addMonthsClamped,
  thresholdColor,
  planConsumption,
  computeBalanceView,
  mergeAiUnitsConfig,
  actionCost,
  DEFAULT_AI_UNITS_CONFIG,
} from './ai-units-logic';

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe('AI Units — cycle math', () => {
  it('anchors the reset to the signup day-of-month', () => {
    const { cycleStart, cycleReset } = computeCycleReset(d('2026-08-13'), d('2026-08-20'));
    expect(cycleStart.toISOString().slice(0, 10)).toBe('2026-08-13');
    expect(cycleReset.toISOString().slice(0, 10)).toBe('2026-09-13');
  });

  it('rolls to the next cycle once the reset date passes', () => {
    const { cycleStart, cycleReset } = computeCycleReset(d('2026-08-13'), d('2026-09-15'));
    expect(cycleStart.toISOString().slice(0, 10)).toBe('2026-09-13');
    expect(cycleReset.toISOString().slice(0, 10)).toBe('2026-10-13');
  });

  it('clamps a 31st-of-month signup into February', () => {
    // Jan 31 signup, now mid-Feb -> cycle start clamps to Feb 28 (2026 not leap).
    const { cycleStart, cycleReset } = computeCycleReset(d('2026-01-31'), d('2026-02-15'));
    expect(cycleStart.toISOString().slice(0, 10)).toBe('2026-01-31');
    expect(cycleReset.toISOString().slice(0, 10)).toBe('2026-02-28');
  });

  it('handles leap-year February', () => {
    expect(addMonthsClamped(d('2028-01-31'), 1, 31).toISOString().slice(0, 10)).toBe('2028-02-29');
  });

  it('on the exact reset day, advances to the new cycle', () => {
    const { cycleStart } = computeCycleReset(d('2026-08-13'), d('2026-09-13'));
    expect(cycleStart.toISOString().slice(0, 10)).toBe('2026-09-13');
  });
});

describe('AI Units — meter color', () => {
  const th = { green: 50, yellow: 20 };
  it('maps percent to the approved bands', () => {
    expect(thresholdColor(82, th)).toBe('green');
    expect(thresholdColor(50, th)).toBe('green');
    expect(thresholdColor(49, th)).toBe('yellow');
    expect(thresholdColor(20, th)).toBe('yellow');
    expect(thresholdColor(19, th)).toBe('red');
    expect(thresholdColor(1, th)).toBe('red');
    expect(thresholdColor(0, th)).toBe('empty');
  });
});

describe('AI Units — consumption (free first, then purchased)', () => {
  it('spends free units before purchased', () => {
    const r = planConsumption(0, 50, 100, 10);
    expect(r).toMatchObject({ affordable: true, freeCharge: 10, purchasedCharge: 0, newFreeUsed: 10, newPurchased: 100 });
  });

  it('spills over into purchased when free is exhausted', () => {
    const r = planConsumption(48, 50, 100, 10); // 2 free left, need 10
    expect(r).toMatchObject({ affordable: true, freeCharge: 2, purchasedCharge: 8, newFreeUsed: 50, newPurchased: 92 });
  });

  it('is unaffordable when total is insufficient', () => {
    const r = planConsumption(50, 50, 3, 10); // 0 free, 3 purchased, need 10
    expect(r.affordable).toBe(false);
    expect(r.charged).toBe(3);
  });
});

describe('AI Units — balance view', () => {
  it('reports remaining, total and color from raw fields', () => {
    const v = computeBalanceView(9, 0, DEFAULT_AI_UNITS_CONFIG); // 50 allowance, 9 used
    expect(v.freeRemaining).toBe(41);
    expect(v.totalRemaining).toBe(41);
    expect(v.percentRemaining).toBe(82);
    expect(v.color).toBe('green');
  });

  it('keeps purchased units in the total', () => {
    const v = computeBalanceView(50, 340, DEFAULT_AI_UNITS_CONFIG); // free exhausted, 340 purchased
    expect(v.freeRemaining).toBe(0);
    expect(v.totalRemaining).toBe(340);
  });
});

describe('AI Units — config', () => {
  it('applies admin overrides on top of defaults', () => {
    const cfg = mergeAiUnitsConfig({ freeAllowance: 100, actionCosts: { simple: 4 } });
    expect(cfg.freeAllowance).toBe(100);
    expect(cfg.actionCosts.simple).toBe(4);
    expect(cfg.actionCosts.research).toBe(20); // untouched default
  });
  it('falls back to the simple cost for unknown actions', () => {
    expect(actionCost(DEFAULT_AI_UNITS_CONFIG, 'nonexistent')).toBe(2);
    expect(actionCost(DEFAULT_AI_UNITS_CONFIG, 'pipeline_analysis')).toBe(5);
  });
});
