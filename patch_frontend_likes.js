const fs = require('fs'); 
const content = fs.readFileSync('frontend/src/apps/politics/pages/PoliticsAnalysisPage.jsx', 'utf8'); 

let newContent = content.replace(
  `const partyArray = Array.from(partyMap.values());`,
  `
        const partyData = await apiClient('/api/services/politics/parties');
        const partyStats = (partyData?.data || []).reduce((acc, p) => ({...acc, [p.name]: p}), {});
        const partyArray = Array.from(partyMap.values()).map(p => ({
          ...p, 
          likes: partyStats[p.name]?.likes || 0,
          dislikes: partyStats[p.name]?.dislikes || 0
        }));
  `
);

newContent = newContent.replace(
  `const handleInteraction = async (commentId, type) => {`,
  `
  const handleEntityInteraction = async (entityId, entityType, type) => {
    try {
      const endpoint = entityType === 'politician' ? 'politician' : 'party';
      const data = await apiClient(\`/api/services/politics/\${endpoint}/\${entityId}/interaction\`, {
        method: 'POST',
        body: JSON.stringify({ type })
      });
      if (data?.success) {
        if (entityType === 'politician') {
          setPoliticians(prev => prev.map(p => p.id === entityId ? { ...p, likes: data.data.likes, dislikes: data.data.dislikes } : p));
        } else {
          setParties(prev => prev.map(p => p.name === entityId ? { ...p, likes: data.data.likes, dislikes: data.data.dislikes } : p));
        }
      }
    } catch (e) { console.error(e); }
  };
  
  const handleInteraction = async (commentId, type) => {`
);

// Add PolA interaction UI
newContent = newContent.replace(
  `<span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">{polA.role_type === 'MAYOR' ? '지자체장' : polA.role_type === 'EXTRA_PARLIAMENTARY' ? '원외인사' : '국회의원'}</span>
                    </div>`,
  `<span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">{polA.role_type === 'MAYOR' ? '지자체장' : polA.role_type === 'EXTRA_PARLIAMENTARY' ? '원외인사' : '국회의원'}</span>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <button onClick={() => handleEntityInteraction(polA.id, 'politician', 'like')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👍 {polA.likes || 0}</button>
                      <button onClick={() => handleEntityInteraction(polA.id, 'politician', 'dislike')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👎 {polA.dislikes || 0}</button>
                    </div>`
);

// Add PolB interaction UI
newContent = newContent.replace(
  `<span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">{polB.role_type === 'MAYOR' ? '지자체장' : polB.role_type === 'EXTRA_PARLIAMENTARY' ? '원외인사' : '국회의원'}</span>
                    </div>`,
  `<span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">{polB.role_type === 'MAYOR' ? '지자체장' : polB.role_type === 'EXTRA_PARLIAMENTARY' ? '원외인사' : '국회의원'}</span>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <button onClick={() => handleEntityInteraction(polB.id, 'politician', 'like')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👍 {polB.likes || 0}</button>
                      <button onClick={() => handleEntityInteraction(polB.id, 'politician', 'dislike')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👎 {polB.dislikes || 0}</button>
                    </div>`
);

// Add PartyA interaction UI
newContent = newContent.replace(
  `<span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600 mb-4">소속 인물 {partyA.members.length}명</span>`,
  `<span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600 mb-2">소속 인물 {partyA.members.length}명</span>
                    <div className="flex gap-4 mb-4">
                      <button onClick={() => handleEntityInteraction(partyA.name, 'party', 'like')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👍 {partyA.likes || 0}</button>
                      <button onClick={() => handleEntityInteraction(partyA.name, 'party', 'dislike')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👎 {partyA.dislikes || 0}</button>
                    </div>`
);

// Add PartyB interaction UI
newContent = newContent.replace(
  `<span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600 mb-4">소속 인물 {partyB.members.length}명</span>`,
  `<span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600 mb-2">소속 인물 {partyB.members.length}명</span>
                    <div className="flex gap-4 mb-4">
                      <button onClick={() => handleEntityInteraction(partyB.name, 'party', 'like')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👍 {partyB.likes || 0}</button>
                      <button onClick={() => handleEntityInteraction(partyB.name, 'party', 'dislike')} className="flex items-center gap-1 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-300 text-sm transition-colors border border-slate-700/50">👎 {partyB.dislikes || 0}</button>
                    </div>`
);

fs.writeFileSync('frontend/src/apps/politics/pages/PoliticsAnalysisPage.jsx', newContent);
console.log('Patched frontend');
