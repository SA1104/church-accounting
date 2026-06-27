const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ engine: 'decision', status: 'ok' });
});

router.post('/execute', async (req, res) => {
  res.json({ engine: 'decision', result: 'stub execute successful' });
});

const db = require('../db/index.js');
const { eventBus } = require('../../kernel/index.js');

class DecisionContext {
  constructor(projectId, serviceId, userId) {
    this.projectId = projectId;
    this.serviceId = serviceId;
    this.userId = userId;
    this.metadata = {};
  }
}

class DecisionBuilder {
  constructor(context) {
    this.context = context;
    this.decision = {
      decision_score: 80,
      confidence: 0.90,
      risk: '',
      opportunity: '',
      evidence: [],
      reason: '',
      recommendation: '',
      alternative: [],
      expected_impact: '',
      priority: 'MEDIUM',
      timeline: 'ASAP',
      action: ''
    };
  }

  setScore(score) { this.decision.decision_score = score; return this; }
  setConfidence(conf) { this.decision.confidence = conf; return this; }
  setRisk(risk) { this.decision.risk = risk; return this; }
  setOpportunity(opp) { this.decision.opportunity = opp; return this; }
  addEvidence(ev) { this.decision.evidence.push(ev); return this; }
  setReason(reason) { this.decision.reason = reason; return this; }
  setRecommendation(rec) { this.decision.recommendation = rec; return this; }
  addAlternative(alt) { this.decision.alternative.push(alt); return this; }
  setExpectedImpact(impact) { this.decision.expected_impact = impact; return this; }
  setPriority(prio) { this.decision.priority = prio; return this; }
  setTimeline(time) { this.decision.timeline = time; return this; }
  setAction(act) { this.decision.action = act; return this; }

  build() {
    return this.decision;
  }
}

class DecisionValidator {
  static validate(decision) {
    const required = [
      'decision_score', 'confidence', 'risk', 'opportunity',
      'evidence', 'reason', 'recommendation', 'expected_impact',
      'priority', 'timeline', 'action'
    ];
    for (const f of required) {
      if (decision[f] === undefined || decision[f] === null) {
        throw new Error(`[Decision SDK] Missing standard decision property: ${f}`);
      }
    }
    if (decision.decision_score < 0 || decision.decision_score > 100) {
      throw new Error(`[Decision SDK] Invalid score: ${decision.decision_score}`);
    }
    return true;
  }
}

class DecisionScoring {
  static calculateScore(baseScore, modifier) {
    const score = Math.max(0, Math.min(100, baseScore + modifier));
    return Math.floor(score);
  }
}

class DecisionLifecycle {
  static nextState(currentState) {
    const states = ['Generated', 'Validated', 'Reviewed', 'Approved', 'Executed', 'Measured', 'Learned', 'Archived'];
    const idx = states.indexOf(currentState);
    if (idx === -1 || idx === states.length - 1) return currentState;
    return states[idx + 1];
  }
}

class DecisionRepository {
  async saveHistory(context, decision, status = 'Generated') {
    DecisionValidator.validate(decision);
    console.log(`[Decision SDK] Archiving decision history to db: ${context.serviceId}`);
    try {
      const res = await db.query.run(`
        INSERT INTO decision_history (
          project_id, service_id, decision_score, confidence, recommendation, alternative,
          risk, opportunity, reason, evidence, expected_impact, priority, action, timeline, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        context.projectId,
        context.serviceId,
        decision.decision_score,
        decision.confidence,
        decision.recommendation,
        JSON.stringify(decision.alternative || []),
        decision.risk,
        decision.opportunity,
        decision.reason,
        JSON.stringify(decision.evidence),
        decision.expected_impact,
        decision.priority,
        decision.action,
        decision.timeline,
        status
      ]);
      
      eventBus.publish('decision:archived', { serviceId: context.serviceId, score: decision.decision_score });
      return res.id;
    } catch (err) {
      console.error('[Decision SDK] Failed to save decision history:', err);
      return null;
    }
  }

  async saveFeedback(decisionId, rating, comment) {
    try {
      await db.query.run(`
        INSERT INTO decision_feedback (decision_id, rating, comment)
        VALUES (?, ?, ?)
      `, [decisionId, rating, comment]);
      return true;
    } catch (err) {
      console.error('[Decision SDK] Failed to save feedback:', err);
      return false;
    }
  }
}

router.DecisionContext = DecisionContext;
router.DecisionBuilder = DecisionBuilder;
router.DecisionValidator = DecisionValidator;
router.DecisionScoring = DecisionScoring;
router.DecisionLifecycle = DecisionLifecycle;
router.DecisionRepository = DecisionRepository;
router.repository = new DecisionRepository();

module.exports = router;
