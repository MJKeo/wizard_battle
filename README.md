# Wizard Battle 🧙‍♂️ - Setup Guide

> This project uses **Anaconda (or Miniconda)** for Python, **Ollama** to run **Llama 3.2**, a **FastAPI** backend, and a **React** frontend.  
> Follow these steps to get the game running from scratch — even on a clean computer.


## ⚙️ What You’ll Be Running

- **Backend:** `python ./backend/main.py` (FastAPI)
- **Frontend:** `npm start` (React)
- **Model Runtime:** Ollama serving **Llama 3.2** locally


## 1 - Install the Prerequisites

### 1.1 Git
- **macOS:** Usually preinstalled. If not:
  ```bash
  brew install git
  ```
- **Windows:** Install [Git for Windows](https://git-scm.com/download/win)
- **Linux:**
  ```bash
  sudo apt-get install git
  ```

### 1.2 Node.js + npm
Install the **LTS version** of Node.js (includes npm).

- **macOS (Homebrew):**
  ```bash
  brew install node
  ```
- **Windows/Linux:**
  Download from [nodejs.org](https://nodejs.org/) or install via `nvm`:
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  nvm install --lts
  ```

Verify installation:
```bash
node -v
npm -v
```

### 1.3 Anaconda or Miniconda
- Download **Miniconda** from [miniconda.org](https://docs.conda.io/en/latest/miniconda.html)
- Verify:
  ```bash
  conda --version
  ```

### 1.4 Ollama (for Llama 3.2)
Install **Ollama** from [ollama.com](https://ollama.com/).

Then pull the Llama 3.2 model:
```bash
ollama pull llama3.2:3b
# or
ollama pull llama3.2
```

Verify:
```bash
ollama --version
ollama list
```

> The first pull downloads model weights — this may take several minutes.


## 2 - Clone the Repository

```bash
git clone https://github.com/MJKeo/wizard_battle.git
cd wizard-battle
```


## 3 - Set Up the Python Environment (using enviromnent.yml)

```
bash
conda env create -f environment.yml
conda activate wizard-battle
```

## 4 - Start the Services

### Run FastAPI Backend

> **Note:** This will run on port 3167 (yes it's a Noah Kahan reference)

```bash
conda activate wizard-battle
python ./backend/main.py
```

Alternative (if using Uvicorn directly):
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 3167 --reload
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:3167
```

### Run React Frontend
```bash
cd frontend
npm install
npm start
```

App will open at [http://localhost:3000](http://localhost:3000)


## 5 - Quick Sanity Checks

- Frontend loads at `http://localhost:3000`
- Backend docs visible at `http://localhost:3167/docs`


## 6 - Common Issues

### ❌ Port Already in Use
Kill processes on 3000 or 3167:
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>
lsof -i :3167
kill -9 <PID>
```
```powershell
# Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```


### ⚠️ CORS Errors
Ensure:
- `REACT_APP_API_BASE_URL` matches backend URL
- CORS is enabled in your FastAPI app


### 🐌 Slow First Response
The first request initializes the model — this is normal.  
Subsequent requests are much faster.


### 🐍 Conda Issues
If you get `conda: command not found`, run:
```bash
conda init <your-shell>
# Restart terminal and try again
```


## 7 - Developer Tips

- **Hot reload:** `npm start` and `uvicorn --reload` automatically reload on file changes  
- **Environment safety:** Store secrets in `.env`, commit `.env.example` instead  
- **Switch models:**  
  ```bash
  ollama pull llama3.2:7b
  ```
  Update `.env` → `LLM_MODEL=llama3.2:7b`


## 8 - Cleanup (Optional)

```bash
conda deactivate
conda env remove -n wizard-battle
cd frontend && rm -rf node_modules
```

To remove Ollama models:
```bash
ollama rm llama3.2:3b
```


## TL;DR — Quick Start

```bash
# 1. Install: Git, Node, Miniconda, Ollama
# 2. Clone repo
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# 3. Backend setup
conda create -y -n wizard-battle python=3.11
conda activate wizard-battle

# 4. Pull model
ollama pull llama3.2:3b

# 5. Run
# Backend:
python ./backend/main.py
# Frontend:
cd frontend && npm install && npm start
```

🎉 **You’re ready to duel!**
