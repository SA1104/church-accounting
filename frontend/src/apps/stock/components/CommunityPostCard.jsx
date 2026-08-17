import { Link } from 'react-router-dom';
import VerificationStatusBadge from './VerificationStatusBadge';
import { MessageSquare, Eye } from 'lucide-react';

export default function CommunityPostCard({ post }) {
  return (
    <Link to={`/stock/community/${post.id}`} className="bg-slate-900 border border-slate-800 p-4 md:p-5 rounded-2xl flex flex-col gap-3 hover:bg-slate-800/50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-1">
          <span>{post.stockName} ({post.stockCode})</span>
          <span>·</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <VerificationStatusBadge status={post.verificationStatus} />
      </div>
      
      <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">{post.title}</h3>
      
      <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-800/50 text-[10px] text-slate-500 font-semibold">
        <div className="flex items-center gap-2">
          <span className="text-slate-300">{post.author}</span>
          <span className="text-blue-400">수익률 --%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Eye size={12}/> {post.viewCount}</span>
          <span className="flex items-center gap-1"><MessageSquare size={12}/> {post.commentCount}</span>
        </div>
      </div>
    </Link>
  );
}
