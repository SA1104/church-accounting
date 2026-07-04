import re
import codecs

try:
    with codecs.open('frontend/src/apps/church/pages/Settings.jsx', 'r', encoding='utf-8') as f:
        text = f.read()

    # Find the UI sections.
    # The order we want:
    # 1. 소속 위원회, 소속 그룹
    # 2. 직책 지정, 권한 역할

    # Let's extract the actual grid blocks. 
    # Because of JSX formatting, we can use start/end indices.
    
    # 1. Find <div className="space-y-1"> ... <span className="text-[9px] text-slate-500 font-semibold">소속 위원회</span> ... </div>
    committee_idx = text.find('<span className="text-[9px] text-slate-500 font-semibold">소속 위원회</span>')
    committee_start = text.rfind('<div className="space-y-1">', 0, committee_idx)
    committee_end = text.find('</div>', committee_idx) + 6

    committee_block = text[committee_start:committee_end]
    
    # 2. 소속 그룹
    group_idx = text.find('<span className="text-[9px] text-slate-500 font-semibold">소속 찬양팀/그룹</span>')
    group_start = text.rfind('<div className="space-y-1">', 0, group_idx)
    group_end = text.find('</div>', group_idx) + 6
    group_block = text[group_start:group_end]
    
    # 3. 직책 지정 *
    pos_idx = text.find('<span className="text-[9px] text-slate-500 font-semibold">직책 지정 *</span>')
    pos_start = text.rfind('<div className="space-y-1">', 0, pos_idx)
    pos_end = text.find('</div>', pos_idx) + 6
    pos_block = text[pos_start:pos_end]

    # 4. 권한 역할
    role_idx = text.find('<span className="text-[9px] text-slate-500 font-semibold">권한 역할</span>')
    role_start = text.rfind('<div className="space-y-1">', 0, role_idx)
    role_end = text.find('</div>', role_idx) + 6
    role_block = text[role_start:role_end]
    
    # Let's replace the role_block options to include USER
    role_block = role_block.replace('<option value="DEPARTMENT_ACCOUNTANT">', '<option value="USER">일반 사용자 (USER)</option>\n                  <option value="DEPARTMENT_ACCOUNTANT">')

    # Now we need to find the entire container where these blocks reside.
    # Actually, the user name and password inputs are right above.
    # Let's find "이름 *" block.
    name_idx = text.find('<span className="text-[9px] text-slate-500 font-semibold">이름 *</span>')
    name_start = text.rfind('<div className="space-y-1">', 0, name_idx)
    name_end = text.find('</div>', name_idx) + 6
    name_block = text[name_start:name_end]

    # We will reconstruct the layout exactly as requested:
    # 1. 소속 위원회
    # 2. 소속 그룹
    # 3. 직책
    # 4. 권한
    # Let's keep Name and Password above them? The user says: "사용자 등록/Assignment 추가 UI는 반드시 아래 순서로 구성합니다. - 소속 위원회 - 소속 그룹 - 직책 - 권한"
    # But usually Name and Password are part of user creation. The user doesn't mention removing Name. So I'll keep name and password.
    # But wait, it's inside `grid grid-cols-2`.
    
    new_ui = f"""            <div className="grid grid-cols-2 gap-3">
              {committee_block}
              {group_block}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              {pos_block}
              {role_block}
            </div>"""

    # We replace everything from name_block to group_block with our new layout if possible. But name_block has to stay.
    # Actually, Name and Password are at lines 1930~1955.
    # Let's find the start of Name block's grid wrapper:
    grid_start = text.rfind('<div className="grid grid-cols-2 gap-3">', 0, name_start)
    
    # End of the whole block is after group_block.
    wrapper_end = text.find('</div>', group_end) + 6

    # Reconstruct whole section:
    # The grid start containing name_block:
    new_full_ui = f"""            <div className="grid grid-cols-2 gap-3">
              {name_block}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              {committee_block}
              {group_block}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              {pos_block}
              {role_block}
            </div>"""
            
    # We replace from grid_start to wrapper_end
    text = text[:grid_start] + new_full_ui + text[wrapper_end:]

    with codecs.open('frontend/src/apps/church/pages/Settings.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    
    print("UI rewrite successful.")
except Exception as e:
    import traceback
    traceback.print_exc()
