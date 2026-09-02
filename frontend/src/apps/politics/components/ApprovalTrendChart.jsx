import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../../core/api';

const ApprovalTrendChart = ({ entityA, entityB, colorA, colorB, isSameParty }) => {
  const [dataA, setDataA] = useState([]);
  const [dataB, setDataB] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      setLoading(true);
      try {
        let resultsA = [];
        let resultsB = [];
        if (entityA?.id) {
          const resA = await apiClient.get('/api/services/politics/ratings/' + entityA.id);
          if (resA.data?.success) resultsA = resA.data.data;
        }
        if (entityB?.id) {
          const resB = await apiClient.get('/api/services/politics/ratings/' + entityB.id);
          if (resB.data?.success) resultsB = resB.data.data;
        }
        setDataA(resultsA);
        setDataB(resultsB);
      } catch (err) {
        console.error('Failed', err);
      } finally {
        setLoading(false);
      }
    };
    if (entityA?.id || entityB?.id) fetchRatings();
  }, [entityA, entityB]);

  const mergedData = [];
  const months = ['3월', '4월', '5월', '6월', '7월', '8월'];
  months.forEach(month => {
    const ptA = dataA.find(d => d.month === month);
    const ptB = dataB.find(d => d.month === month);
    mergedData.push({
      month,
      approvalA: ptA ? Math.round(ptA.approval * 10) / 10 : null,
      buzzA: ptA ? Math.round(ptA.buzz * 10) / 10 : null,
      approvalB: ptB ? Math.round(ptB.approval * 10) / 10 : null,
      buzzB: ptB ? Math.round(ptB.buzz * 10) / 10 : null,
    });
  });

  const nameA = entityA?.name || 'A';
  const nameB = entityB?.name || 'B';

  return (
    <div className="w-full h-full flex flex-col bg-slate-950/30 rounded-xl border border-slate-800 overflow-hidden relative">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span className="text-xl">📈</span> 최근 6개월 지지율 및 화제성 추이 (여론조사 종합)
        </h3>
        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/30">
          AI 분석 연동형
        </span>
      </div>
      <div className="flex-1 p-4 h-[350px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500">데이터를 불러오는 중...</div>
        ) : (!entityA && !entityB) ? (
          <div className="h-full flex items-center justify-center text-slate-500">비교할 대상을 선택해주세요.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} axisLine={false} tickLine={false} />
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} 
                itemStyle={{ color: '#e2e8f0', fontSize: '13px' }} 
                labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }} 
              />
              
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} iconType="circle" />
              
              {entityA && <Bar yAxisId="left" name={nameA + ' 화제성(막대)'} dataKey="buzzA" fill={colorA} fillOpacity={0.4} barSize={20} radius={[4,4,0,0]} />}
              {entityB && <Bar yAxisId="left" name={nameB + ' 화제성(막대)'} dataKey="buzzB" fill={colorB} fillOpacity={0.4} barSize={20} radius={[4,4,0,0]} />}
              
              {entityA && <Line yAxisId="left" type="monotone" name={nameA + ' 지지율(선)'} dataKey="approvalA" stroke={colorA} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }} activeDot={{ r: 6 }} />}
              {entityB && <Line yAxisId="left" type="monotone" name={nameB + ' 지지율(선)'} dataKey="approvalB" stroke={colorB} strokeWidth={3} strokeDasharray={isSameParty ? "5 5" : undefined} dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }} activeDot={{ r: 6 }} />}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
export default ApprovalTrendChart;
