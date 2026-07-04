import sys

with open('frontend/src/apps/church/pages/Settings.jsx', 'r', encoding='utf8') as f:
    content = f.read()

# Update the Assignment tag in User List Header
old_tag = """{userAssigns.map(a => (
                            <span 
                              key={a.assignment_id} 
                              className={`text-[8px] font-semibold px-2 py-0.5 rounded-full border ${
                                a.is_primary 
                                  ? 'bg-church-500/10 border-church-500/30 text-church-400' 
                                  : 'bg-slate-800/50 border-slate-700/40 text-slate-400'
                              }`}
                            >
                              {a.committee_name}{a.group_name ? ` > ${a.group_name}` : ''} ({a.position_name})
                            </span>
                          ))}"""

new_tag = """{userAssigns.map(a => (
                            <span 
                              key={a.id || a.assignment_id} 
                              className={`text-[8px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                a.is_primary 
                                  ? 'bg-church-500/10 border-church-500/30 text-church-400' 
                                  : 'bg-slate-800/50 border-slate-700/40 text-slate-400'
                              }`}
                            >
                              {a.is_primary && <span className="w-1 h-1 rounded-full bg-church-400 mr-0.5"></span>}
                              {a.assignment_code && <span className="font-mono opacity-60 mr-0.5">{a.assignment_code}</span>}
                              {a.committee_name}{a.group_name ? ` > ${a.group_name}` : ''} ({a.position_name})
                            </span>
                          ))}"""

content = content.replace(old_tag, new_tag)

old_list_item = """{userAssigns.map(a => (
                              <div key={a.assignment_id} className="bg-slate-900/60 border border-slate-800/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px]">
                                <div className="text-slate-300">
                                  <span className="font-semibold text-white">{a.committee_name}</span>
                                  {a.group_name && <span className="text-slate-500 mx-1">/</span>}
                                  {a.group_name && <span className="text-slate-400">{a.group_name}</span>}
                                  <span className="mx-1.5 text-slate-500">·</span>
                                  <span className="text-church-400 font-bold">{a.position_name}</span>
                                  {a.is_primary && (
                                    <span className="ml-2 text-[8px] bg-church-500/20 text-church-300 px-1 py-0.2 rounded font-bold">대표</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(u.user_id, a.assignment_id)}
                                  className="text-[9px] text-rose-400 hover:text-rose-300 font-semibold"
                                >
                                  제거
                                </button>
                              </div>
                            ))}"""

new_list_item = """{userAssigns.map(a => (
                              <div key={a.id || a.assignment_id} className="bg-slate-900/60 border border-slate-800/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px]">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 text-slate-300">
                                    {a.assignment_code && <span className="font-mono text-[9px] text-slate-500 bg-slate-800/60 px-1 rounded">{a.assignment_code}</span>}
                                    <span className="font-semibold text-white">{a.committee_name}</span>
                                    {a.group_name && <span className="text-slate-500 mx-0.5">/</span>}
                                    {a.group_name && <span className="text-slate-400">{a.group_name}</span>}
                                    <span className="mx-1 text-slate-500">·</span>
                                    <span className="text-church-400 font-bold">{a.position_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px]">
                                    <span className="text-slate-500">권한: {a.role_id || a.role_code}</span>
                                    <span className={`px-1.5 rounded uppercase font-bold tracking-wider ${a.status === 'approved' ? 'text-emerald-400 bg-emerald-400/10' : a.status === 'pending' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 bg-slate-800'}`}>
                                      {a.status === 'approved' ? '승인됨' : a.status === 'pending' ? '대기중' : a.status}
                                    </span>
                                    {a.is_primary && (
                                      <span className="text-church-300 bg-church-500/20 px-1.5 rounded font-bold">대표 소속</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAssignment(u.user_id, a.id || a.assignment_id)}
                                    className="text-[9px] px-2 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded font-semibold transition-colors"
                                  >
                                    배정 취소
                                  </button>
                                  <span className="text-[8px] text-slate-600">{new Date(a.assigned_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}"""

content = content.replace(old_list_item, new_list_item)

with open('frontend/src/apps/church/pages/Settings.jsx', 'w', encoding='utf8') as f:
    f.write(content)
