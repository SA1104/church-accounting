import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { apiClient } from '../../core/api';

const StockAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await apiClient('/api/services/stock/dashboard');
        
        // Merge KOSPI and KOSDAQ by date for chart
        const kospiMap = {};
        res.data.kospi.forEach(item => {
          kospiMap[item.trade_date] = { date: item.trade_date, kospi: parseFloat(item.close_price) };
        });
        
        res.data.kosdaq.forEach(item => {
          if (kospiMap[item.trade_date]) {
            kospiMap[item.trade_date].kosdaq = parseFloat(item.close_price);
          } else {
            kospiMap[item.trade_date] = { date: item.trade_date, kosdaq: parseFloat(item.close_price) };
          }
        });

        const mergedData = Object.values(kospiMap).sort((a, b) => new Date(a.date) - new Date(b.date));
        setData(mergedData);
      } catch (err) {
        console.error('Error fetching stock dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-[400px] flex items-center justify-center">
        <p className="text-slate-400">데이터를 불러올 수 없습니다. API 연결을 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-100">한국 증시 (KOSPI / KOSDAQ)</h2>
      </div>

      <div className="bg-[#151515] p-6 rounded-xl border border-gray-800 shadow-xl">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#888" 
                tick={{fill: '#888', fontSize: 12}}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth()+1}/${d.getDate()}`;
                }}
              />
              <YAxis yAxisId="left" stroke="#888" tick={{fill: '#888', fontSize: 12}} domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" stroke="#888" tick={{fill: '#888', fontSize: 12}} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#ccc' }}
                labelStyle={{ color: '#888', marginBottom: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="kospi" 
                name="KOSPI"
                stroke="#ef4444" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }} 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="kosdaq" 
                name="KOSDAQ"
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
        <h3 className="text-lg font-bold text-gray-200 mb-4">시장 한 줄 요약</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          실시간 데이터 백필이 완료되었습니다. 최근 코스피/코스닥 지수는 위 차트와 같이 변동성을 보이고 있습니다.
          상세한 시황 분석 내용은 &apos;오늘의 시장&apos; 탭을 참고하세요.
        </p>
      </div>
    </div>
  );
};

export default StockAnalysis;