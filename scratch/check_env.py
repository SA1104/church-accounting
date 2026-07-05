import os

env_path = "backend/.env"
if os.path.exists(env_path):
    print(".env file exists!")
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                key = line.split("=")[0]
                print(f"Variable: {key}")
else:
    print(".env file does NOT exist!")
