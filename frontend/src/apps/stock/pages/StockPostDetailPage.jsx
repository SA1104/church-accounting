import { useParams, Link } from 'react-router-dom';
import VerificationStatusBadge from '../components/VerificationStatusBadge';
import InvestmentThesisPanel from '../components/InvestmentThesisPanel';
import { mockCommunityPosts } from '../data/stockUiPlaceholderData';
import { Clock, Eye, MoreHorizontal, MessageSquare, Send } from 'lucide-react';

export default function StockPostDetailPage() {
  const { postId } = useParams();
  
  const post = mockCommunityPosts.find(p => p.id === postId);

  if (!post) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-slate-500 mb-2">존재하지 않거나 삭제된 분석글입니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-8 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
              {post.title} {post.isSample && <span className="text-slate-500 text-base font-normal">(UI 예시)</span>}
            </h1>
            <button className="text-slate-500 hover:text-white p-1">
              <MoreHorizontal size={20} />
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-800/50 pb-4">
            <Link to={`/stock/stocks/${post.stockCode}`} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-lg text-sm font-bold transition-colors">
              {post.stockName} ({post.stockCode})
            </Link>
            <span className="text-sm font-bold text-rose-400">목표가: -- 원</span>
            <span className="text-sm font-bold text-blue-400">손절가: -- 원</span>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">{post.author.charAt(0)}</div>
                {post.author}
              </div>
              <span className="flex items-center gap-1"><Clock size={14}/> {new Date(post.createdAt).toLocaleDateString()} 작성</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Eye size={14}/> 조회 {post.viewCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">실제 결과 검증</h3>
            <p className="text-xs text-slate-400">작성자가 등록한 매수가 및 기준일을 바탕으로 자동 검증됩니다.</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <VerificationStatusBadge status={post.verificationStatus} />
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold">
              상태: {post.status}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold">
              현재 수익률: -- %
            </span>
          </div>
        </div>

        <InvestmentThesisPanel thesis={null} />

        <div className="pt-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare size={18} /> 댓글 {post.commentCount}
          </h3>
          
          <div className="flex gap-3 mb-6">
            <div className="w-8 h-8 bg-slate-800 rounded-full shrink-0 flex items-center justify-center">
              <span className="text-slate-500 text-xs">나</span>
            </div>
            <div className="flex-1 flex gap-2">
              <input 
                type="text" 
                placeholder="로그인 후 댓글을 작성할 수 있습니다." 
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                disabled
              />
              <button className="bg-blue-600/50 text-white/50 px-4 rounded-xl flex items-center justify-center disabled:cursor-not-allowed">
                <Send size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-slate-800 rounded-full shrink-0 flex items-center justify-center text-xs text-white">A</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-300 text-xs">AnotherUser</span>
                  <span className="text-[10px] text-slate-500">2시간 전</span>
                </div>
                <p className="text-sm text-slate-400 bg-slate-900/50 p-3 rounded-xl rounded-tl-none border border-slate-800 inline-block">
                  관점 잘 보았습니다. (UI 예시)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
