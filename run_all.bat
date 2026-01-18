@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "BE_DIR=%ROOT%BE"
set "BOT_DIR=%ROOT%chatbot-kltn"
set "FE_DIR=%ROOT%kltn-fe-ecom"

start "BE - FastAPI (8000)" cmd /k "cd /d "%BE_DIR%" && python -m app.run"
start "CHATBOT (8001)"      cmd /k "cd /d "%BOT_DIR%" && python .\run.py"
start "FE - NextJS (3000)"  cmd /k "cd /d "%FE_DIR%" && npm run dev"
start "NGROK Service"       cmd /k "cd /d "%ROOT%" && call ngrok_service.bat"

endlocal
