# Bitmoth（彼魔）

> 封印在最小位元（Bit）中的上古巨獸（Behemoth）

跨平台雜湊像素巨獸生成器。透過輸入任意字串，利用確定性雜湊演算法將數據解碼為獨一無二的「彼魔基因（DNA）」，並即時渲染出復古 8-bit/16-bit 左右對稱的像素魔獸。**相同的輸入源將永遠召喚出絕對相同的彼魔。**

---

## 目錄

- [快速啟動](#快速啟動)
- [系統架構總覽](#系統架構總覽)
- [技術棧](#技術棧)
- [專案結構](#專案結構)
- [彼魔種族系統](#彼魔種族系統)
- [彼魔 DNA 解碼演算法](#彼魔-dna-解碼演算法)
- [名稱與數值生成系統](#名稱與數值生成系統)
- [技術注意事項](#技術注意事項)

---

## 快速啟動

### 前置需求

- Node.js 18+
- Docker（用於 MySQL）
- Ollama（選用，未安裝時自動 fallback 到確定性數值）

### 1. 啟動 MySQL

```bash
docker compose up -d
```

### 2. 啟動 Server

```bash
cd apps/server
npm install
npm run dev      # node --watch，存檔自動重啟
```

### 3. 開啟瀏覽器

```
http://localhost:3000
```

### 環境變數

複製 `.env.example` 為 `.env`（已預設本機值，開箱即用）：

```bash
cp .env.example .env
```

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `bitmoth` | MySQL user |
| `DB_PASSWORD` | `bitmoth` | MySQL password |
| `DB_NAME` | `bitmoth` | MySQL database |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API |
| `OLLAMA_MODEL` | `llama3.2` | 使用的模型 |
| `SERVER_PORT` | `3000` | Server port |

### Ollama（選用）

```bash
ollama pull llama3.2
ollama serve
```

未啟動時 server 會自動 fallback，以種族 bias 產生確定性名稱與數值，不影響 demo 運行。

---

## 系統架構總覽

```
Browser（Web Demo）
  │
  ├─ 1. 輸入任意字串
  ├─ 2. SHA-256 → hash               （SubtleCrypto API，純前端）
  ├─ 3. hash → BitmothDNA            （前端 dnaDecoder 邏輯）
  │     └─ 種族、體型、顏色、眼型、裝飾
  ├─ 4. Canvas 即時渲染像素精靈
  │
  └─ 5. GET /api/bitmoth/:hash       （HTTP → Backend）
              │
              ├─ DB 查詢 hash（MySQL）
              │   ├─ HIT  → 直接回傳快取的 name / stats
              │   └─ MISS →
              │       ├─ 組裝 Ollama prompt（DNA + 規則）
              │       ├─ POST ollama/api/generate
              │       ├─ 解析 JSON 回應（失敗時 fallback 確定性數值）
              │       ├─ INSERT INTO bitmoth_cache
              │       └─ 回傳 name / stats
              │
Browser 收到 name + stats，合併 DNA 更新卡片
```

---

## 技術棧

### Web Demo 前端

| 類別 | 技術 |
|------|------|
| 語言 | 純 HTML / Vanilla JS（無 framework） |
| 雜湊 | Web Crypto API `SubtleCrypto.digest('SHA-256')` |
| 像素渲染 | Canvas 2D API（16×24 點陣，左右鏡射） |
| 字型 | Press Start 2P（Google Fonts） |

### 後端（API Server）

| 類別 | 技術 | 用途 |
|------|------|------|
| Runtime | Node.js 18+ | ES Module，內建 fetch |
| Web Framework | Fastify | 輕量 API + 靜態檔案 serve |
| 資料庫 | MySQL 8（Docker） | 永久快取；可改 .env 指向任意 MySQL |
| DB Driver | `mysql2` | Promise pool |
| AI 生成 | Ollama（本地）| 生成怪獸名稱、稱號、數值、描述 |

### 未來 Mobile App（規劃中）

| 類別 | 技術 |
|------|------|
| 跨平台核心 | Expo + Expo Router |
| 加密邏輯 | `crypto-js` |
| 相機 / QR | `expo-camera` |
| 像素渲染 | `react-native-svg` |
| UI | NativeWind v4+ |

---

## 專案結構

```
bitmoth/
├── docker-compose.yml              # MySQL 8 container
├── .env                            # 本機環境變數（git ignored）
├── .env.example                    # 環境變數範本
│
└── apps/
    └── server/                     # Fastify API Server（同時 serve 前端）
        ├── index.js                # 入口：啟動 server、initDb、註冊 routes
        ├── package.json
        ├── public/
        │   └── index.html          # Web Demo 前端（單頁，含 Canvas 渲染）
        └── src/
            ├── dnaDecoder.js       # hash → BitmothDNA（演算法凍結）
            ├── db/
            │   └── index.js        # MySQL pool、initDb、getCached、insertCache
            ├── ollama/
            │   ├── prompt.js       # buildPrompt(dna) → LLM prompt string
            │   └── client.js       # generateStats（Ollama）+ generateFallbackStats
            └── routes/
                └── bitmoth.js      # GET /api/bitmoth/:hash、GET /api/gallery
```

---

## API

### `GET /api/bitmoth/:hash`

傳入 64 位元 hex SHA-256 hash，回傳彼魔資料。

**Response：**
```json
{
  "hash": "7b2cbf...",
  "cached": true,
  "title": "源碼的",
  "name": "暴食",
  "flavor": "吞噬一切數據的原初之獸，其咆哮化作亂碼席捲世界。",
  "hp": 480,
  "atk": 72,
  "def": 55,
  "spd": 38,
  "dna": {
    "schemaVersion": 1,
    "primaryColor": "#7b2cbf",
    "secondaryColor": "...",
    "raceId": 2,
    "variantId": 1,
    "eyeId": 3,
    "decoId": 0,
    "entropyHex": "..."
  }
}
```

### `GET /api/gallery`

回傳最近 50 筆召喚記錄（含 DNA）。

---

## 彼魔種族系統

共定義 **9 大種族**，由 DNA `12 ~ 13` 碼決定（`十進位 mod 9`）。

| ID | 種族 | 外觀風格 | 主色傾向 | 數值傾向 |
|----|------|---------|---------|---------|
| 0 | 龍種 | 鱗甲、長尾、威嚴感 | 深紅、金、暗綠 | 高 ATK / DEF |
| 1 | 妖精種 | 輕盈、小巧、魔法光暈 | 粉、淡藍、翠綠 | 高 SPD，低 HP |
| 2 | 惡魔種 | 扭曲、尖角、暗能量 | 暗紫、血紅、焦黑 | 均衡偏高 ATK |
| 3 | 獸種 | 肌肉、毛皮、爪牙 | 棕、橙、灰 | 高 HP / ATK |
| 4 | 魚種 | 鱗片、流線型、深海感 | 深藍、青、銀 | 高 DEF / SPD |
| 5 | 鳥種 | 羽毛、冠羽、銳爪 | 金、紅、藍 | 最高 SPD |
| 6 | 元素種 | 能量結晶、無機質形體 | 由次色決定元素屬性 | 依屬性偏移 |
| 7 | 機械種 | 齒輪裝甲、電路板紋理 | 銀、鋼藍、螢光綠 | 高 DEF，低 SPD |
| 8 | 亡靈種 | 骨骸、幽靈、腐化感 | 骨白、幽靈綠、暗灰 | 高 ATK，低 DEF |

---

## 彼魔 DNA 解碼演算法

系統將 SHA-256 產生的 **64 位十六進位字串（256-bit）** 視為彼魔的染色體：

| 基因位置（Hash 區段） | 決定特徵 | 實作說明 |
|---|---|---|
| `0 ~ 5`（共 6 碼） | 主體色系 | 轉為 Hex 顏色（如 `#7B2CBF`），作為皮膚或外殼主色 |
| `6 ~ 11`（共 6 碼） | 次要裝飾色 | 用於眼睛、斑紋、發光特效；元素種以此判斷元素屬性 |
| `12 ~ 13`（共 2 碼） | 種族（Race ID） | 十進位 mod 9，對應上方 9 大種族表 |
| `14 ~ 15`（共 2 碼） | 體型變體（Variant ID） | 十進位 mod 4，決定該種族內的具體輪廓 |
| `16 ~ 17`（共 2 碼） | 魔眼特徵（Eye ID） | 十進位 mod 6（獨眼、三眼、裂瞳、電子眼、空洞眼、巨獸黑瞳） |
| `18 ~ 19`（共 2 碼） | 裝飾特徵（Deco ID） | 十進位 mod 4，從種族專屬裝飾池中抽取 |
| `20 ~ 63`（其餘碼） | 傳給 Ollama | 作為 AI 生成名稱與數值的熵來源 |

> **演算法穩定性**：`dnaDecoder.js` 凍結後不得修改，否則相同輸入將召喚出不同的彼魔。`schemaVersion` 欄位記錄版本，方便未來分流處理。

---

## 名稱與數值生成系統

### Ollama Prompt 設計

```
你是一個奇幻世界的神話學者，負責為召喚出的彼魔賦予名諱與數值。

## 命名規則
- title（修飾詞）：2~4 字，如「源碼的」「永夜的」「熔岩的」
- name（核心稱號）：2~6 字，如「暴食」「裂淵」「虛無吞噬者」
- flavor：一句話描述，20 字以內

## 數值規則
- HP：100 ~ 999
- ATK / DEF / SPD：10 ~ 99，總和不超過 200
```

### Fallback（無 Ollama 時）

依種族 bias 的確定性演算法，使用 `entropyHex` 前 8 碼作為 seed，保證相同 hash 永遠產生相同數值。

### 推薦 Ollama 模型

| 模型 | 說明 |
|------|------|
| `llama3.2:3b` | 輕量快速，適合開發（預設） |
| `llama3.1:8b` | 更豐富的命名創意 |
| `mistral:7b` | 指令遵從性佳，格式穩定 |

---

## 技術注意事項

### Canvas 像素渲染

- 16×24 點陣（左半 8 列，右半鏡射），每格 14px，canvas 共 224×336
- 主色（body）+ 次色（outline）+ 白色高光 + 強制眼睛座標
- 使用 `shadowBlur` 實現次色光暈效果
- 掃描線 overlay 模擬 CRT 顯示器風格

### 分享連結

詳情頁點「分享連結」會將 seed 字串寫入 `?seed=<value>` query string，開啟連結即自動召喚同一隻彼魔。
