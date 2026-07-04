import sys
import codecs

try:
    with codecs.open('frontend/src/apps/church/pages/Settings.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update newUserRole default state
    content = content.replace(
        "useState('DEPARTMENT_ACCOUNTANT')",
        "useState('USER')"
    )

    # 2. Fix alert(err.message) -> alert(err.message || '요청 처리 중 오류가 발생했습니다.')
    content = content.replace(
        "alert(err.message);",
        "alert(err.message || '요청 처리 중 오류가 발생했습니다.');"
    )

    # 3. Add USER role to options
    role_options_old = """                  <option value="DEPARTMENT_ACCOUNTANT">부서 회계</option>
                  <option value="DEPARTMENT_HEAD">위원회/부서장</option>
                  <option value="FINANCE_MANAGER">재정부장 (회계팀장)</option>
                  <option value="AUDITOR">감사</option>
                  <option value="SYSTEM_ADMIN">시스템 관리자</option>"""
    
    role_options_new = """                  <option value="USER">일반 사용자 (USER)</option>
                  <option value="DEPARTMENT_ACCOUNTANT">부서 회계</option>
                  <option value="DEPARTMENT_HEAD">위원회/부서장</option>
                  <option value="FINANCE_MANAGER">재정부장 (회계팀장)</option>
                  <option value="AUDITOR">감사</option>
                  <option value="SYSTEM_ADMIN">시스템 관리자</option>"""

    if role_options_old in content:
        content = content.replace(role_options_old, role_options_new)
    else:
        print("Warning: Could not find exact role_options_old string")

    # 4. Reorder UI blocks
    # We will search for the specific lines where these blocks start.
    # We need:
    # - Committee + Group (Top)
    # - Position + Role (Bottom)

    ui_old = """            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">이름 *</span>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="실명 입력"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">직책 지정 *</span>
                <select
                  value={newUserPositionId}
                  onChange={(e) => setNewUserPositionId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="">직책 선택</option>
                  {groupPositions.filter(p => p.is_active).map(p => (
                    <option key={p.position_id} value={p.position_id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">권한 역할</span>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="USER">일반 사용자 (USER)</option>
                  <option value="DEPARTMENT_ACCOUNTANT">부서 회계</option>
                  <option value="DEPARTMENT_HEAD">위원회/부서장</option>
                  <option value="FINANCE_MANAGER">재정부장 (회계팀장)</option>
                  <option value="AUDITOR">감사</option>
                  <option value="SYSTEM_ADMIN">시스템 관리자</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">소속 위원회</span>
                <select
                  value={newUserCommitteeId}
                  onChange={handleNewUserCommitteeChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="">위원회 선택</option>
                  {adminOrgs.map(org => (
                    <option key={org.department_id} value={org.department_id}>{org.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">소속 찬양팀/그룹</span>
                <select
                  value={newUserGroupId}
                  onChange={(e) => setNewUserGroupId(e.target.value)}
                  disabled={!newUserCommitteeId}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none disabled:opacity-50"
                >
                  <option value="">그룹 선택</option>
                  {newUserAvailableGroups.map(g => (
                    <option key={g.group_id} value={g.group_id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>"""

    ui_new = """            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">이름 *</span>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="실명 입력"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">직책 지정 *</span>
                <select
                  value={newUserPositionId}
                  onChange={(e) => setNewUserPositionId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="">직책 선택</option>
                  {groupPositions.filter(p => p.is_active).map(p => (
                    <option key={p.position_id} value={p.position_id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">소속 위원회</span>
                <select
                  value={newUserCommitteeId}
                  onChange={handleNewUserCommitteeChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="">위원회 선택</option>
                  {adminOrgs.map(org => (
                    <option key={org.department_id} value={org.department_id}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">소속 그룹</span>
                <select
                  value={newUserGroupId}
                  onChange={(e) => setNewUserGroupId(e.target.value)}
                  disabled={!newUserCommitteeId}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none disabled:opacity-50"
                >
                  <option value="">그룹 선택</option>
                  {newUserAvailableGroups.map(g => (
                    <option key={g.group_id} value={g.group_id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">권한 역할</span>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="USER">일반 사용자 (USER)</option>
                  <option value="DEPARTMENT_ACCOUNTANT">부서 회계</option>
                  <option value="DEPARTMENT_HEAD">위원회/부서장</option>
                  <option value="FINANCE_MANAGER">재정부장 (회계팀장)</option>
                  <option value="AUDITOR">감사</option>
                  <option value="SYSTEM_ADMIN">시스템 관리자</option>
                </select>
              </div>
            </div>"""

    if ui_old in content:
        content = content.replace(ui_old, ui_new)
        print("UI successfully replaced.")
    else:
        print("Warning: Could not find exact ui_old block.")

    with codecs.open('frontend/src/apps/church/pages/Settings.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Done")
except Exception as e:
    print(f"Error: {e}")
