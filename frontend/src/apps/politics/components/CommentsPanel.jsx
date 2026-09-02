import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api';

const CommentsPanel = ({ entity, entityType, color }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchComments = async () => {
    if (!entity) return;
    try {
      const q = entityType === 'politician' ? `politician_id=${entity.id}` : `party_name=${entity.name}`;
      const res = await apiClient.get(`/api/services/politics/comments?${q}`);
      if (res.data?.success) {
        setComments(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [entity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !entity) return;
    
    setLoading(true);
    setMsg('');
    try {
      const payload = {
        content: newComment,
        user_name: '테스트 유저'
      };
      if (entityType === 'politician') payload.politician_id = entity.id;
      else payload.party_name = entity.name;

      const res = await apiClient.post('/api/services/politics/comments', payload);
      if (res.data?.success) {
        setMsg(res.data.message);
        setNewComment('');
        fetchComments();
      }
    } catch (e) {
      setMsg('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!entity) return null;

  return (
    <div className="flex flex-col w-full h-full bg-slate-900/40 rounded-xl border border-slate-700/50 p-4 mt-4">
      <h3 className="text-sm font-bold text-slate-300 mb-3 flex justify-between items-center">
        <span>💬 시민 토론장</span>
        <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-800/50">
          AI 클린봇 작동중
        </span>
      </h3>
      
      {/* Comment List */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-[300px] pr-2 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-4">첫 번째 의견을 남겨주세요.</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-slate-300">{c.user_name}</span>
                <span className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-200">{c.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {msg && <div className="text-[10px] text-indigo-400 mb-1">{msg}</div>}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="건전한 비판과 토론을 나눠보세요. (욕설/비방은 AI가 차단합니다)"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !newComment.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
            style={{ backgroundColor: color }}
          >
            등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentsPanel;