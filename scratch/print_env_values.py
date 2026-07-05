with open("backend/.env", "r", encoding="utf-8") as f:
    for line in f:
        if line.strip() and not line.startswith("#"):
            parts = line.strip().split("=")
            key = parts[0]
            val = parts[1] if len(parts) > 1 else ""
            # print first 5 and last 5 chars of value to see if it is a dummy
            if len(val) > 10:
                masked = f"{val[:10]}...{val[-5:]}"
            else:
                masked = val
            print(f"{key}: {masked}")
