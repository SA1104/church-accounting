import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Newspaper, BarChart2, MessageSquare, Flame, Plus, X, User, ThumbsUp, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../App';
import { apiFetch } from '../core/api';

const SERVICE_META = {
  'stock': { title: '주식', desc: '국내/해외 주식 시장 이슈 및 가치 평가' },
  'real_estate': { title: '부동산', desc: '부동산 정책, 실거래가 및 입지 분석' },
  'politics': { title: '정치', desc: '정치 핫이슈 및 정책 분석' },
  'economy': { title: '경제', desc: '거시 경제 동향 및 지표 분석' },
  'mission': { title: '선교', desc: '선교지 소식 및 환율/안전 지표 분석' },
  'word_sharing': { title: '말씀 나눔', desc: '말씀 묵상 및 커뮤니티' },
};

export default function ServiceView() {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('board');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const meta = SERVICE_META[serviceId] || { title: '서비스', desc: '알 수 없는 서비스' };

  const fetchPostsAndNews = async () => {
    try {
      setLoading(true);
      const [postsRes, newsRes] = await Promise.all([
        apiFetch(`/api/services/board/posts?category=${serviceId}`),
        apiFetch(`/api/services/board/news?category=${serviceId}`)
      ]);
      
      if (postsRes) setPosts(postsRes);
      if (newsRes) setNewsList(newsRes);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsAndNews();
  }, [serviceId]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    
    try {
      await apiFetch('/api/services/board/posts', {
        method: 'POST',
        body: JSON.stringify({
          category: serviceId,
          title: newPostTitle,
          content: newPostContent
        })
      });
      
      setNewPostTitle('');
      setNewPostContent('');
      setIsWriteModalOpen(false);
      fetchPostsAndNews(); // reload
    } catch (err) {
      console.error('Failed to create post', err);
      alert('게시글 등록에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">{meta.title} Think</h1>
          <p className="text-sm text-slate-400 mt-1">{meta.desc}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl w-fit border border-slate-800">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'today' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Newspaper size={16} /> 오늘의 {meta.title} 시장
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart2 size={16} /> {meta.title} 분석
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'board' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare size={16} /> 게시판
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px] border border-slate-800 bg-slate-900/20 rounded-2xl p-6 relative overflow-hidden">
        {activeTab === 'today' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame size={18} className="text-rose-500" /> 실시간 핫이슈 (아웃링크 뉴스)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newsList.map(news => (
                <a 
                  key={news.id} 
                  href={news.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-colors block group"
                >
                  <div className="text-xs text-indigo-400 font-bold mb-1">API 수집됨</div>
                  <div className="text-sm font-bold text-slate-200 group-hover:text-white">{news.title}</div>
                  <div className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {news.summary}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-emerald-500" /> 고정 분석 대시보드
            </h2>
            <div className="h-64 w-full rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30">
              <BarChart2 size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-bold">RAW DATA 기반 분석 시각화 대기중</p>
              <p className="text-xs mt-1">이곳에 {meta.title} 특화 RAW 데이터를 연동한 차트가 들어갑니다.</p>
            </div>
          </div>
        )}

        {activeTab === 'board' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500" /> 자유 게시판
              </h2>
              <button 
                onClick={() => setIsWriteModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
              >
                <Plus size={14} /> 글쓰기
              </button>
            </div>
            
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{post.title}</h3>
                    <span className="text-[10px] text-slate-500">{post.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mb-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md">
                      <User size={10} className="text-slate-400" /> {post.author}
                    </div>
                    <div className="flex items-center gap-1 hover:text-rose-400 transition-colors">
                      <ThumbsUp size={12} /> {post.likes}
                    </div>
                    <div className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
                      <MessageCircle size={12} /> {post.comments}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Write Post Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-indigo-400" /> 새 글 작성
              </h3>
              <button 
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePostSubmit} className="p-6 space-y-4">
              <div>
                <input 
                  type="text" 
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="제목을 입력하세요" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="내용을 입력하세요..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all min-h-[200px] resize-y"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  disabled={!newPostTitle.trim() || !newPostContent.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors flex items-center gap-2"
                >
                  <Send size={14} /> 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
