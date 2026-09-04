import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api';

const CommentsPanel = ({ entity, entityType, color }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  // Edit & Delete states
  const [actionModal, setActionModal] = useState(null); // { type: 'edit' | 'delete', comment: Object }
  const [actionPassword, setActionPassword] = useState('');
  const [actionContent, setActionContent] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchComments = async () => {
    if (!entity) return;
    try {
      const q = entityType === 'politician' ? `politician_id=${entity.id}` : `party_name=${entity.name}`;
      const data = await apiClient(`/api/services/politics/comments?${q}`);
      if (data?.success) {
        setComments(data.data);
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
      let userId = null;
      try {
        const u = JSON.parse(localStorage.getItem('user'));
        if (u && u.id) userId = u.id;
      } catch (e) {}

      const payload = {
        content: newComment,
        user_name: userName.trim() || '익명 유권자',
        password: password || '',
        user_id: userId
      };
      if (entityType === 'politician') payload.politician_id = entity.id;
      else payload.party_name = entity.name;

      const data = await apiClient('/api/services/politics/comments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data?.success) {
        setMsg(data.message);
        setNewComment('');
        setPassword('');
        fetchComments();
      } else {
        setMsg(data?.error || '등록 실패');
      }
    } catch (e) {
      setMsg(e.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAction = async () => {
    if (!actionModal) return;
    setActionMsg('');
    try {
      const payload = { password: actionPassword };
      if (actionModal.type === 'edit') {
        payload.content = actionContent;
        const data = await apiClient(`/api/services/politics/comments/${actionModal.comment.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (data?.success) {
          setActionModal(null);
          fetchComments();
        } else {
          setActionMsg(data?.error || '비밀번호가 일치하지 않습니다.');
        }
      } else {
        // delete
        const data = await apiClient(`/api/services/politics/comments/${actionModal.comment.id}`, {
          method: 'DELETE',
          body: JSON.stringify(payload)
        });
        if (data?.success) {
          setActionModal(null);
          fetchComments();
        } else {
          setActionMsg(data?.error || '비밀번호가 일치하지 않습니다.');
        }
      }
    } catch (e) {
      setActionMsg(e.message || '처리 중 오류가 발생했습니다.');
    }
  };

  if (!entity) return null;

  return (
    <div className="flex flex-col w-full h-full bg-slate-900/40 rounded-xl border border-slate-700/50 p-4">
      <h3 className="text-sm font-bold text-slate-300 mb-3 flex justify-between items-center">
        <span>🗣️ 시민 토론장 <span className="text-xs font-normal text-slate-400 ml-1">(총 {comments.length}개)</span></span>
        <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-800/50">
          AI 클린봇 작동중
        </span>
      </h3>
      
      {/* Comment List */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[150px] max-h-[300px] pr-2 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-8">첫 번째 의견을 남겨주세요.</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 group">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-slate-300">
                  {c.user_name} 
                  {c.user_id && <span className="text-[10px] text-indigo-400 font-bold ml-1 border border-indigo-400/30 px-1 py-0.5 rounded bg-indigo-500/10">(회원)</span>}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">{new Date(c.created_at).toLocaleString()}</span>
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => { setActionModal({ type: 'edit', comment: c }); setActionPassword(''); setActionContent(c.content); }} className="text-[10px] text-slate-400 hover:text-white">수정</button>
                  <button onClick={() => { setActionModal({ type: 'delete', comment: c }); setActionPassword(''); }} className="text-[10px] text-red-400 hover:text-red-300">삭제</button>
                </div>
              </div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-auto">
        {msg && <div className="text-[10px] text-indigo-400 mb-1">{msg}</div>}
        <div className="flex flex-col gap-2">
          {/* Row 1: Credentials */}
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="닉네임 (미입력시 익명)"
              className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              disabled={loading}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              disabled={loading}
            />
          </div>
          {/* Row 2: Comment & Submit */}
          <div className="flex w-full gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="건전한 비판과 토론을 남겨주세요"
              className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !newComment.trim() || !password.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold disabled:opacity-50 min-w-[70px]"
              style={{ backgroundColor: color }}
            >
              등록
            </button>
          </div>
        </div>
      </form>
      
      {/* Action Modal (Edit/Delete) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">
              {actionModal.type === 'edit' ? '댓글 수정' : '댓글 삭제'}
            </h3>
            {actionMsg && <div className="text-xs text-red-400 mb-3">{actionMsg}</div>}
            
            {actionModal.type === 'edit' && (
              <textarea
                value={actionContent}
                onChange={e => setActionContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white mb-3 min-h-[80px]"
              />
            )}
            
            <input
              type="password"
              value={actionPassword}
              onChange={e => setActionPassword(e.target.value)}
              placeholder="작성 시 입력한 비밀번호"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white mb-4"
            />
            
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
              >
                취소
              </button>
              <button 
                onClick={handleAction}
                className={`px-4 py-2 text-white rounded-lg text-sm font-bold ${actionModal.type === 'delete' ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
              >
                {actionModal.type === 'edit' ? '수정' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsPanel;