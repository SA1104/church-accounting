const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/apps/church/pages/Settings.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of the invite modal section (line 2919)
const modalStart = content.indexOf('      {/* \ucd08\ub300 \ubaa8\ub2ec \ub2e4\uc774\uc5bc\ub85c\uadf8 */}');
if (modalStart === -1) {
  console.error('Could not find modal start marker!');
  process.exit(1);
}
console.log('Found modal start at index:', modalStart);

// Find the closing that matches - the last closing tags
const modalEnd = content.indexOf('      </div>\r\n    </div>\r\n  );\r\n}\r\n', modalStart);
if (modalEnd === -1) {
  console.error('Could not find modal end marker!');
  // Try alternative endings
  const alt = content.indexOf('  );\r\n}\r\n', modalStart);
  console.log('Alternative end at:', alt);
  process.exit(1);
}
console.log('Found modal end at index:', modalEnd);
console.log('Modal section length:', modalEnd - modalStart);

const newModal = `      {/* \ucd08\ub300 \ubaa8\ub2ec \ub2e4\uc774\uc5bc\ub85c\uadf8 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="glass max-w-md w-full p-5 rounded-3xl border border-slate-800 shadow-2xl max-h-[92vh] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-church-500/10 rounded-full filter blur-xl pointer-events-none" />

            {/* \ud5e4\ub354 */}
            <div className="flex justify-between items-center shrink-0 mb-4">
              <div>
                <h3 className="text-xs font-bold text-white">\uc2e0\uaddc \uba64\ubc84 \ucd08\ub300\uc7a5 \uc791\uc131</h3>
                <p className="text-[8.5px] text-slate-500 mt-0.5">\ucd08\ub300\ub97c \ubc1b\uc744 \ubd84\uc758 \uc815\ubcf4\uc640 \uc784\uba85 \ub0b4\uc6a9\uc744 \uc785\ub825\ud574\uc8fc\uc138\uc694</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-500 hover:text-white transition-colors shrink-0 ml-3"
              >
                <X size={16} />
              </button>
            </div>

            {/* \ucf58\ud150\uce20 \uc601\uc5ed */}
            {inviteLinkResult ? (
              /* \uc0dd\uc131 \uc644\ub8cc \ud654\uba74 */
              <div className="space-y-3 overflow-y-auto flex-1 no-scrollbar text-left">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-[10.5px] leading-relaxed font-semibold">
                  \u2713 \ucd08\ub300\uc7a5 \uc0dd\uc131 \uc644\ub8cc! \uc544\ub798 \ub9c1\ud06c\ub97c \ubcf5\uc0ac\ud558\uc5ec \uc784\uba85 \ub300\uc0c1\uc790\uc5d0\uac8c \uc804\ub2ec\ud574\uc8fc\uc138\uc694.
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold block">\ucd08\ub300 \ub9c1\ud06c (\ub300\uc0c1\uc790\uc5d0\uac8c \uc804\ub2ec)</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={inviteLinkResult.url}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[10px] text-slate-300 font-mono focus:outline-none"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLinkResult.url);
                        alert('\ucd08\ub300 \ub9c1\ud06c\uac00 \ud074\ub9bd\ubcf4\ub4dc\uc5d0 \ubcf5\uc0ac\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
                      }}
                      className="shrink-0 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 font-bold px-3 rounded-xl text-[9px] transition-all"
                    >
                      \ubcf5\uc0ac
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold block">\uc548\ub0b4 \uba54\uc138\uc9c0 \ud15c\ud50c\ub9bf</span>
                  <textarea
                    readOnly
                    rows={5}
                    value={inviteLinkResult.message}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[10px] text-slate-400 font-sans focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLinkResult.message);
                      alert('\uc548\ub0b4 \uba54\uc2dc\uc9c0\uac00 \ud074\ub9bd\ubcf4\ub4dc\uc5d0 \ubcf5\uc0ac\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
                    }}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2 rounded-xl text-[9px] transition-all"
                  >
                    \uba54\uc2dc\uc9c0 \ubcf5\uc0ac
                  </button>
                  <a
                    href={\`sms:?body=\${encodeURIComponent(inviteLinkResult.message)}\`}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2 rounded-xl text-[9px] transition-all text-center flex items-center justify-center"
                  >
                    SMS \uacf5\uc720
                  </a>
                  <a
                    href={\`https://sharer.kakao.com/talk/friends/picker/link?link=\${encodeURIComponent(inviteLinkResult.url)}\`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-[9px] transition-all text-center flex items-center justify-center"
                  >
                    \uce74\uce74\uc624 \uacf5\uc720
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all mt-1"
                >
                  \ub2eb\uae30
                </button>
              </div>
            ) : profileCommittees.length === 0 ? (
              /* \uc704\uc6d0\ud68c \uc5c6\uc744 \ub54c \uc548\ub0b4 */
              <div className="py-8 text-center space-y-4 flex flex-col items-center">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                  <AlertTriangle size={28} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white mb-1">\uc704\uc6d0\ud68c \ub610\ub294 \ubd80\uc11c \uc124\uc815\uc774 \ud544\uc694\ud569\ub2c8\ub2e4</p>
                  <p className="text-[9.5px] text-slate-400 leading-relaxed">
                    \ucd08\ub300\uc7a5\uc744 \ubc1c\uc1a1\ud558\ub824\uba74 \uba3c\uc800 \uc18c\uc18d\ub420<br />
                    <span className="text-amber-400 font-bold">\uc704\uc6d0\ud68c(\ubd80\uc11c)</span>\ub97c \ud558\ub098 \uc774\uc0c1 \ub4f1\ub85d\ud574\uc57c \ud569\ub2c8\ub2e4.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => { setShowInviteModal(false); setActiveTab('orgs'); }}
                    className="bg-church-600 hover:bg-church-500 text-white font-bold py-2.5 rounded-xl text-[10px] transition-all"
                  >
                    \ubd80\uc11c/\uc704\uc6d0\ud68c \uc124\uc815\uc73c\ub85c
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-[10px] transition-all"
                  >
                    \ucde8\uc18c
                  </button>
                </div>
              </div>
            ) : (
              /* \ucd08\ub300\uc7a5 \uc791\uc131 \ud3fc */
              <form onSubmit={handleCreateInvitation} className="space-y-3.5 overflow-y-auto flex-1 pr-1 no-scrollbar text-left">

                {/* \ubc1c\uc1a1 \ub300\uc0c1\uc790 */}
                <p className="text-[8px] font-black text-church-400 uppercase tracking-widest">\ubc1c\uc1a1 \ub300\uc0c1\uc790 \uc815\ubcf4</p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">\ubc1b\ub294 \uc0ac\ub78c \uc774\ub984 <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="\uc608: \ud64d\uae38\ub3d9"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">\ubc1b\ub294 \uc0ac\ub78c \uc774\uba54\uc77c <span className="text-rose-400">*</span></label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="\uc608: hong@gmail.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500 font-mono"
                  />
                  <p className="text-[8.5px] text-slate-500">\uc774 \uc774\uba54\uc77c\ub85c \ucd08\ub300 \ub9c1\ud06c\uac00 \ubc1c\uc1a1\ub429\ub2c8\ub2e4 (\uacc4\uc815 \uac00\uc785 \uc2dc\uc5d0\ub3c4 \uc0ac\uc6a9)</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">\ubc1b\ub294 \uc0ac\ub78c \ud734\ub300\ud3f0 \ubc88\ud638</label>
                  <input
                    type="text"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="\uc608: 010-1234-5678 (\uc120\ud0dd)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  />
                </div>

                {/* \uc784\uba85 \ub0b4\uc6a9 */}
                <p className="text-[8px] font-black text-church-400 uppercase tracking-widest pt-1 border-t border-slate-800/60">\uc784\uba85 \ub0b4\uc6a9</p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">\uc18c\uc18d \uc704\uc6d0\ud68c <span className="text-rose-400">*</span></label>
                  <select
                    required
                    value={inviteCommId}
                    onChange={(e) => { setInviteCommId(e.target.value); setInviteGroupId(''); }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  >
                    <option value="">\u2014 \uc704\uc6d0\ud68c\ub97c \uc120\ud0dd\ud558\uc138\uc694 \u2014</option>
                    {profileCommittees.map(c => (
                      <option key={c.department_id} value={c.department_id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">
                    \uc18c\uc18d \ubd80\uc11c/\uadf8\ub8f9
                    <span className="text-[8.5px] text-slate-500 font-normal ml-1">(\uc704\uc6d0\ud68c \uc120\ud0dd \ud6c4 \uc120\ud0dd \uac00\ub2a5)</span>
                  </label>
                  <select
                    value={inviteGroupId}
                    onChange={(e) => setInviteGroupId(e.target.value)}
                    disabled={!inviteCommId || inviteGroupOptions.length === 0}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500 disabled:opacity-50"
                  >
                    <option value="">
                      {!inviteCommId ? '\uc704\uc6d0\ud68c \uba3c\uc800 \uc120\ud0dd' : inviteGroupOptions.length === 0 ? '\ud558\uc704 \ubd80\uc11c \uc5c6\uc74c (\uc704\uc6d0\ud68c \uc9c1\uc18d)' : '\u2014 \ubd80\uc11c \uc120\ud0dd \uc548 \ud568 (\uc704\uc6d0\ud68c \uc9c1\uc18d) \u2014'}
                    </option>
                    {inviteGroupOptions.map(g => (
                      <option key={g.group_id} value={g.group_id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">\uc784\uba85 \uc9c1\uccb8 <span className="text-rose-400">*</span></label>
                  <select
                    required
                    value={invitePosId}
                    onChange={(e) => setInvitePosId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  >
                    <option value="">\u2014 \uc9c1\uccb8\uc744 \uc120\ud0dd\ud558\uc138\uc694 \u2014</option>
                    {profilePositions.map(p => (
                      <option key={p.position_id} value={p.position_id}>{p.name}</option>
                    ))}
                  </select>
                  {profilePositions.length === 0 && (
                    <p className="text-[8.5px] text-amber-400">
                      \u26a0 \ub4f1\ub85d\ub41c \uc9c1\uccb8\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.{' '}
                      <button type="button" onClick={() => { setShowInviteModal(false); setActiveTab('positions'); }} className="underline">\uc9c1\uccb8 \uc124\uc815\uc73c\ub85c \uc774\ub3d9</button>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">\ubd80\uc5ec\ud560 \uc2dc\uc2a4\ud15c \uad8c\ud55c <span className="text-rose-400">*</span></label>
                  <select
                    required
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  >
                    <option value="member">\uc77c\ubc18 \ud68c\uc6d0 \u2014 \uae30\ubcf8 \uc5f4\ub78c \uad8c\ud55c</option>
                    <option value="teacher">\uad50\uc0ac \u2014 \ubd80\uc11c \ud65c\ub3d9 \ucc38\uc5ec</option>
                    <option value="department_head">\ubd80\uc11c \ubd80\uc7a5 \u2014 \ubd80\uc11c \uad00\ub9ac \uad8c\ud55c</option>
                    <option value="committee_head">\uc704\uc6d0\uc7a5 \u2014 \uc704\uc6d0\ud68c \uc804\uccb4 \uad00\ub9ac</option>
                    <option value="auditor">\uac10\uc0ac\uc704\uc6d0 \u2014 \uc7ac\uc815 \uc5f4\ub78c \uc804\uc6a9</option>
                    <option value="finance_admin">\uc7ac\uc815 \ubd80\uc7a5/\ucd1d\ubb34 \u2014 \uc7ac\uc815 \uc785\ub825\u00b7\uacb0\uc0b0</option>
                    <option value="elder">\uc7a5\ub85c/\uc548\uc218\uc9d1\uc0ac \u2014 \uc758\uacb0 \ucc38\uc5ec \uad8c\ud55c</option>
                    <option value="pastor">\uad50\uc5ed\uc790 \u2014 \uc804\uccb4 \uc5f4\ub78c \ubc0f \ubcf4\uace0</option>
                  </select>
                  <p className="text-[8.5px] text-slate-500">\u203b \ud50c\ub7ab\ud3fc \uad00\ub9ac\uc790 \uad8c\ud55c\uc740 \ucd08\ub300\ub85c \ubd80\uc5ec\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4</p>
                </div>

                {/* \ubc1c\uc1a1 \uc635\uc158 */}
                <p className="text-[8px] font-black text-church-400 uppercase tracking-widest pt-1 border-t border-slate-800/60">\ubc1c\uc1a1 \uc635\uc158</p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">\ucd08\ub300 \uba54\uc2dc\uc9c0 (\uc120\ud0dd)</label>
                  <textarea
                    rows={2}
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="\ub300\uc0c1\uc790\uc5d0\uac8c \uc804\ub2ec\ud560 \uac1c\uc778 \uba54\uc2dc\uc9c0\ub97c \uc785\ub825\ud558\uc138\uc694 (\uc0dd\ub7b5 \uac00\ub2a5)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-church-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">\ucd08\ub300 \ub9c1\ud06c \uc720\ud6a8 \uae30\uac04 <span className="text-rose-400">*</span></label>
                  <select
                    required
                    value={inviteExpiresDays}
                    onChange={(e) => setInviteExpiresDays(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  >
                    <option value={1}>1\uc77c (\uae34\uae09 \ubc1c\uc1a1)</option>
                    <option value={3}>3\uc77c \uc774\ub0b4 \uc218\ub099</option>
                    <option value={7}>7\uc77c \uc774\ub0b4 \uc218\ub099 (\uae30\ubcf8 \uad8c\uc7a5)</option>
                    <option value={30}>30\uc77c \uc774\ub0b4 \uc218\ub099 (\uc7a5\uae30)</option>
                  </select>
                </div>

                {/* \ud655\uc778/\ucde8\uc18c \ubc84\ud2bc */}
                <div className="grid grid-cols-2 gap-2 pt-2 shrink-0 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]"
                  >
                    \ucde8\uc18c
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-church-600 to-church-500 hover:brightness-110 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
                  >
                    \ucd08\ub300\uc7a5 \uc0dd\uc131 \ubc0f \ub9c1\ud06c \ubc1c\uae09
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
`;

// Find the exact positions
const markerStart = '      {/* \ucd08\ub300 \ubaa8\ub2ec \ub2e4\uc774\uc5bc\ub85c\uadf8 */}';
const startIdx = content.indexOf(markerStart);
console.log('startIdx:', startIdx);

const endMarker = '      </div>\r\n    </div>\r\n  );\r\n}\r\n';
const endIdx = content.indexOf(endMarker, startIdx);
console.log('endIdx:', endIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('MARKERS NOT FOUND');
  process.exit(1);
}

const newContent = content.slice(0, startIdx) + newModal;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('SUCCESS: Settings.jsx updated');
