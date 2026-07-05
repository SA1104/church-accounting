import re

path = "backend/core/db/mock-data.js"
with open(path, "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

pattern = r"created_at:\s*new\s*Date\(\)\.toISOString\(\),\s*[\s\S]*?changer_name:[\s\S]*?new_position_name:[\s\S]*?};"
match = re.search(pattern, content)
if match:
    replacement = (
        "created_at: new Date().toISOString(),\n"
        "      changer_name: '\\uad00\\ub9ac\\uc790', // \uad00\ub9ac\uc790\n"
        "      prev_committee_name: prevCommId ? '\\uc608\\ubc30\\uc758\\uc6d0\\ud68c' : null, // \uc608\ubc30\uc758\uc6d0\ud68c\n"
        "      prev_group_name: prevGrpId ? '\\ucc2c\\uc591\\ud300' : null, // \ucc2c\uc591\ud300\n"
        "      prev_position_name: prevPosId ? '\\ubd80\\uc7a5' : null, // \ubd80\uc7a5\n"
        "      new_committee_name: newCommId ? '\\uc608\\ubc30\\uc758\\uc6d0\\ud68c' : null, // \uc608\ubc30\uc758\uc6d0\ud68c\n"
        "      new_group_name: newGrpId ? '\\ucc2c\\uc591\\ud300' : null, // \ucc2c\uc591\ud300\n"
        "      new_position_name: newPosId ? '\\ubd80\\uc7a5' : null // \ubd80\uc7a5\n"
        "    };"
    )
    
    new_content = content.replace(match.group(0), replacement)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully replaced assignment log interception block!")
else:
    print("Could not find the target block to replace!")
