/**
 * Booza Think Core SDK - Report & Insight Template Builder (Phase 7)
 */
const db = require('../db/index.js');

class ReportBuilder {
  constructor(title) {
    this.title = title;
    this.sections = [];
  }

  addSection(header, content) {
    this.sections.push({ header, content });
    return this;
  }

  buildMarkdown() {
    let md = `# ${this.title}\n\n`;
    for (const sec of this.sections) {
      md += `## ${sec.header}\n${sec.content}\n\n`;
    }
    return md;
  }
}

class InsightBuilder {
  buildFinancialInsight(stats) {
    return `[AI Insight] 현재 총 수입은 ${stats.income}원, 지출은 ${stats.expense}원으로 가용 예산 대비 안정적 흐름을 유지하고 있습니다.`;
  }
}

class RecommendationBuilder {
  buildRecommendation(decision) {
    return `[권고사항] ${decision.recommendation}을 진행하시길 권장하며, 차선책으로 ${decision.alternative ? decision.alternative.join(', ') : '없음'}이 가능합니다.`;
  }
}

class SummaryBuilder {
  buildSummary(text) {
    return `[요약] ${text.slice(0, 100)}...`;
  }
}

class ChartBuilder {
  buildPieChartConfig(labels, data) {
    return {
      type: 'pie',
      data: {
        labels,
        datasets: [{ data, backgroundColor: ['#38669b', '#2b517d', '#1e3a5f'] }]
      }
    };
  }
}

class NarrationBuilder {
  buildVoiceNarration(text) {
    console.log('[Narration SDK] Synthesizing voice speech prompt.');
    return { text, voiceModel: 'ko-KR-Standard-A', speed: 1.0 };
  }
}

class TemplateEngine {
  render(templateStr, data) {
    let rendered = templateStr;
    for (const key of Object.keys(data)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
    }
    return rendered;
  }
}

module.exports = {
  ReportBuilder,
  InsightBuilder,
  RecommendationBuilder,
  SummaryBuilder,
  ChartBuilder,
  NarrationBuilder,
  TemplateEngine
};
