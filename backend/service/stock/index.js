// backend/service/stock/index.js
// Stock Think - Capability Router (Platform 3.1)
// Handles Stock Think workspaces and AI portfolio research history
const express = require('express');
const router = express.Router();
const { query } = require('../../core/db');

// In-memory fallback if DB table doesn't have records
let researchStore = [
  {
    id: 'res-101',
    question: '삼성전자 지금 추가 매수 해도 괜찮을까?',
    ticker: '삼성전자',
    market: 'KOSPI',
    portfolio: { holdingPrice: 72000, holdingQuantity: 150 },
    investmentStyle: 'Long-term Growth',
    hypothesis: '단기 주가 과매도 국면 진입 및 배당 메리트 부각으로 분할 추가 매수 적기',
    evidence: [
      { category: 'Financials', title: '분기 영업이익 전분기 대비 14.5% 증가', status: 'Positive' },
      { category: 'Valuation', title: 'PER 11.2배로 5개년 평균 하단 도달', status: 'Positive' },
      { category: 'Sentiment', title: '반도체 공급 과잉 해소 전망 뉴스 우세', status: 'Neutral' },
      { category: 'Technicals', title: 'RSI(14) 지표 32로 과매도 국면 접근', status: 'Positive' }
    ],
    analysis: 'DRAM 가격 하방 지지와 파운드리 수주 회복 가능성이 단기 주가 반등을 지지합니다.',
    decision: {
      id: 'dec-101',
      decisionType: 'StockBuyHoldSell',
      title: '삼성전자 추가 매수 의사결정',
      recommendation: 'BUY (분할 추가 매수)',
      confidence: 0.82,
      riskLevel: 'MEDIUM',
      targetPrice: 78000,
      stopLoss: 64000,
      expectedPeriod: '6 Months',
      status: 'Learned'
    },
    validation: {
      trackedDays: 30,
      targetReached: true,
      stopLossTriggered: false,
      actualPrice30d: 78200,
      accuracyEvaluated: true
    },
    outcome: {
      returnRate: 23.7,
      success: true,
      timestamp: '2026-06-25T04:00:00Z'
    },
    learning: '과매도 시그널(RSI) 기반 분할 매수 전략의 유효성 검증 완료.',
    createdAt: '2026-05-25T09:00:00Z'
  },
  {
    id: 'res-102',
    question: '현대차 매도 시점은 언제로 잡아야 하나?',
    ticker: '현대차',
    market: 'KOSPI',
    portfolio: { holdingPrice: 195000, holdingQuantity: 80 },
    investmentStyle: 'Value Investing',
    hypothesis: '친환경 신차 사이클 호조이나 거시 금리 부담으로 단기 고점 분할 차익 실현 권장',
    evidence: [
      { category: 'Financials', title: '영업이익률 8.4%로 역대 최고치 유지', status: 'Positive' },
      { category: 'Valuation', title: 'PBR 0.65배로 장기 평균 상단 터치', status: 'Neutral' },
      { category: 'Macro', title: '고금리 장기화에 따른 글로벌 차입 구매 수요 둔화 우려', status: 'Negative' },
      { category: 'Technicals', title: '볼린저 밴드 상단 터치 후 거래량 소폭 감소', status: 'Negative' }
    ],
    analysis: '호실적은 선반영되었으며, 환율 효과 둔화 및 금리 영향으로 박스권 상단 저항 예상.',
    decision: {
      id: 'dec-102',
      decisionType: 'StockBuyHoldSell',
      title: '현대차 분할 매도 의사결정',
      recommendation: 'HOLD (목표가 도달 시 분할 매도)',
      confidence: 0.74,
      riskLevel: 'LOW',
      targetPrice: 220000,
      stopLoss: 185000,
      expectedPeriod: '3 Months',
      status: 'Learned'
    },
    validation: {
      trackedDays: 30,
      targetReached: false,
      stopLossTriggered: false,
      actualPrice30d: 202000,
      accuracyEvaluated: true
    },
    outcome: {
      returnRate: 3.5,
      success: true,
      timestamp: '2026-06-27T02:00:00Z'
    },
    learning: '금리 모멘텀 둔화 시 박스권 상단 트레이딩 전략 유효.',
    createdAt: '2026-05-27T10:00:00Z'
  }
];

// GET /api/stock/workspace
router.get('/workspace', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    let ws = await query.get('SELECT * FROM public.stock_workspaces WHERE user_id = ? AND is_active = TRUE LIMIT 1', [userId]);
    if (!ws) {
      // Auto-create default stock workspace
      const result = await query.run(
        'INSERT INTO public.stock_workspaces (user_id, name, investment_style, risk_preference, is_active) VALUES (?, ?, ?, ?, TRUE) RETURNING workspace_id',
        [userId, '내 투자계정', 'Growth', 'MEDIUM']
      );
      ws = {
        workspace_id: result.id,
        user_id: userId,
        name: '내 투자계정',
        investment_style: 'Growth',
        risk_preference: 'MEDIUM'
      };
      // Register in platform_workspaces
      await query.run(
        'INSERT INTO public.platform_workspaces (workspace_id, capability, name, owner_id, is_active) VALUES (?, ?, ?, ?, TRUE)',
        [result.id, 'stock', '내 투자계정', userId]
      );
    }
    res.json(ws);
  } catch (err) {
    console.error('[Stock workspace] Error:', err);
    res.status(500).json({ message: 'Database error fetching workspace' });
  }
});

// GET /api/stock/research
router.get('/research', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    // Check if research history exists in DB
    const dbList = await query.all(
      'SELECT * FROM public.stock_research_history WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    if (dbList && dbList.length > 0) {
      return res.json(dbList.map(item => ({
        id: item.research_id,
        question: item.question,
        ticker: item.ticker,
        portfolio: { holdingPrice: item.holding_price, holdingQuantity: item.holding_quantity },
        investmentStyle: item.investment_style,
        riskPreference: item.risk_preference,
        evidence: typeof item.result_snapshot === 'string' ? JSON.parse(item.result_snapshot).evidence : (item.result_snapshot?.evidence || []),
        analysis: typeof item.result_snapshot === 'string' ? JSON.parse(item.result_snapshot).analysis : (item.result_snapshot?.analysis || ''),
        decision: item.decision_score ? {
          id: `dec-${item.research_id.slice(-4)}`,
          decisionType: 'StockBuyHoldSell',
          title: `${item.ticker} 의사결정`,
          recommendation: item.recommendation,
          confidence: 0.8,
          riskLevel: item.risk_preference,
          status: 'Learned'
        } : null,
        createdAt: item.created_at
      })));
    }
    res.json(researchStore);
  } catch (err) {
    console.error('[Stock research] Error:', err);
    res.json(researchStore);
  }
});

// POST /api/stock/research
router.post('/research', async (req, res) => {
  const { ticker, question, holdingPrice, holdingQuantity, investmentStyle, riskPreference } = req.body;
  try {
    const userId = req.user.userId || req.user.id;
    let ws = await query.get('SELECT workspace_id FROM public.stock_workspaces WHERE user_id = ? LIMIT 1', [userId]);
    if (!ws) {
      const result = await query.run(
        'INSERT INTO public.stock_workspaces (user_id, name) VALUES (?, ?) RETURNING workspace_id',
        [userId, '내 투자계정']
      );
      ws = { workspace_id: result.id };
    }

    const newRes = {
      id: `res-${Date.now().toString().slice(-4)}`,
      question: question || '종목 분석 제안',
      ticker: ticker || '삼성전자',
      market: 'KOSPI',
      portfolio: { holdingPrice: holdingPrice ? parseFloat(holdingPrice) : 0, holdingQuantity: holdingQuantity ? parseInt(holdingQuantity) : 0 },
      investmentStyle: investmentStyle || 'Growth',
      hypothesis: `${ticker} 투자 지표 및 AI 시나리오 분석`,
      evidence: [
        { category: 'Financials', title: '분기 영업이익 지표 긍정적', status: 'Positive' },
        { category: 'Sentiment', title: '시장 내 우호적 분위기 감지', status: 'Positive' }
      ],
      analysis: 'AI 모델의 기술적 분석 결과 지지선 및 성장 모멘텀이 강력합니다.',
      decision: {
        id: `dec-${Date.now().toString().slice(-4)}`,
        decisionType: 'StockBuyHoldSell',
        title: `${ticker} 투자 추가 의사결정`,
        recommendation: 'BUY (추가 분할 매수)',
        confidence: 0.78,
        riskLevel: riskPreference || 'MEDIUM',
        targetPrice: (holdingPrice ? parseFloat(holdingPrice) * 1.15 : 80000),
        stopLoss: (holdingPrice ? parseFloat(holdingPrice) * 0.9 : 60000),
        expectedPeriod: '3 Months',
        status: 'Generated'
      },
      createdAt: new Date().toISOString()
    };

    // Save to database
    await query.run(`
      INSERT INTO public.stock_research_history (
        workspace_id, user_id, ticker, question, investment_style, risk_preference,
        holding_price, holding_quantity, result_snapshot, decision_score, recommendation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ws.workspace_id,
      userId,
      newRes.ticker,
      newRes.question,
      newRes.investmentStyle,
      riskPreference || 'MEDIUM',
      newRes.portfolio.holdingPrice,
      newRes.portfolio.holdingQuantity,
      JSON.stringify({ evidence: newRes.evidence, analysis: newRes.analysis }),
      78,
      'BUY'
    ]);

    researchStore.unshift(newRes);
    res.status(201).json(newRes);
  } catch (err) {
    console.error('[Stock research save] Error:', err);
    res.status(500).json({ message: 'Error processing research request' });
  }
});

module.exports = router;
