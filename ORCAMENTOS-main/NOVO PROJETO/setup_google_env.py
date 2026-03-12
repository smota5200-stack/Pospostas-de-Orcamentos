import json
import os

# Caminho do JSON da service account
json_path = input("Digite o caminho do arquivo JSON da Service Account: ").strip()

# Caminho do .env
env_path = ".env"

# Ler o JSON
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

client_email = data.get("client_email")
private_key = data.get("private_key")

# Pede o ID da pasta do Drive
folder_id = input("Digite o GOOGLE_DRIVE_FOLDER_ID (ID da pasta no Drive): ").strip()

# Formatar private key para .env
private_key_env = private_key.replace("\n", "\\n")

# Conteúdo para adicionar no .env
env_vars = f"""
GOOGLE_SERVICE_ACCOUNT_EMAIL={client_email}
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="{private_key_env}"
GOOGLE_DRIVE_FOLDER_ID={folder_id}
"""

# Verificar se .env existe
if not os.path.exists(env_path):
    open(env_path, "w").close()

# Ler conteúdo atual
with open(env_path, "r", encoding="utf-8") as f:
    env_content = f.read()

# Atualizar ou adicionar variáveis
def update_env(content, key, value):
    lines = content.splitlines()
    found = False
    for i, line in enumerate(lines):
        if line.startswith(key + "="):
            lines[i] = f"{key}={value}"
            found = True
    if not found:
        lines.append(f"{key}={value}")
    return "\n".join(lines)

env_content = update_env(env_content, "GOOGLE_SERVICE_ACCOUNT_EMAIL", client_email)
env_content = update_env(env_content, "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", f'"{private_key_env}"')
env_content = update_env(env_content, "GOOGLE_DRIVE_FOLDER_ID", folder_id)

# Salvar
with open(env_path, "w", encoding="utf-8") as f:
    f.write(env_content)

print("\n✅ .env atualizado com sucesso!")
print("EMAIL:", client_email)
print("FOLDER ID:", folder_id)