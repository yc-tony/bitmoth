# Bitmoth（彼魔）

> 封印在最小位元（Bit）中的上古巨獸（Behemoth）

跨平台雜湊像素巨獸生成器。輸入任意字串，透過確定性雜湊演算法解碼出獨一無二的「彼魔基因（DNA）」，以復古 8-bit/16-bit 像素風格渲染魔獸。**相同的輸入永遠召喚出絕對相同的彼魔。**

---

## 目錄

- [專案架構](#專案架構)
- [快速啟動](#快速啟動)
- [孵化流程](#孵化流程)
- [API 文件](#api-文件)
- [彼魔種族系統](#彼魔種族系統)
- [彼魔 DNA 解碼演算法](#彼魔-dna-解碼演算法)
- [名稱與數值生成系統](#名稱與數值生成系統)
- [技術注意事項](#技術注意事項)

---

## 專案架構

```
bitmoth/
├── package.json                  ← npm workspaces root
│
├── packages/
│   └── core/                     ← @bitmoth/core（共用邏輯）
│       └── dnaDecoder.js         ← hash → DNA 演算法（凍結）
│
└── apps/
    ├── server/                   ← Fastify API server（port 3000）
    │   └── src/
    │       ├── pokedex/          ← 圖鑑 service
    │       ├── routes/           ← Bitmoth AI 生成 API
    │       ├── db/               ← MySQL（bitmoth_cache）
    │       └── ollama/           ← AI 生成邏輯
    │
    ├── desktop/                  ← Tauri + React（macOS / Windows）
    │   └── src/
    │       ├── screens/          ← SummonScreen / EggScreen / CollectionScreen
    │       └── lib/              ← hash.ts / pokedex.ts
    │
    └── mobile/                   ← Expo React Native（iOS / Android）
        ├── app/(tabs)/           ← 掃描 / 孵化 / 收藏
        └── lib/                  ← hash.ts / pokedex.ts
```

---

## 快速啟動

### 前置需求

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 所有 app |
| Docker | 任意 | MySQL container |
| Rust + Cargo | 1.70+ | Desktop (Tauri) build |
| Xcode / Android Studio | 最新 | Mobile build |
| Ollama | 選用 | 本地 AI 生成名稱與數值 |

---

### 1. 啟動 MySQL

```bash
docker compose up -d
```

---

### 2. 啟動 Server

```bash
cd apps/server
cp .env.example .env   # 第一次需要
npm install
npm run dev
# → http://localhost:3000
```

**Server 環境變數（`.env`）：**

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

---

### 3. 啟動 Desktop App（Tauri）

```bash
cd apps/desktop
npm install
npm run tauri dev
```

> 第一次執行會編譯 Rust，約需 3～5 分鐘。之後重啟只需幾秒。

**Desktop 環境變數（`apps/desktop/.env`）：**

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `VITE_SERVER_URL` | `http://localhost:3000` | 圖鑑 Server 位址 |

打包成可執行檔：

```bash
npm run tauri build
# 輸出在 apps/desktop/src-tauri/target/release/bundle/
```

---

### 4. 啟動 Mobile App（Expo）

```bash
cd apps/mobile
npm install
npm start          # 開啟 Expo Dev Tools

npm run ios        # 啟動 iOS Simulator
npm run android    # 啟動 Android Emulator
```

**Mobile 環境變數（`apps/mobile/.env`）：**

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `EXPO_PUBLIC_SERVER_URL` | `http://localhost:3000` | 圖鑑 Server 位址（裝置需與 server 同網路） |

---

### 5. Ollama（選用）

未啟動時 server 自動 fallback，以種族 bias 確定性產生名稱與數值，不影響核心流程。

```bash
ollama pull llama3.2
ollama serve
```

---

## 孵化流程

```
輸入任意字串（或掃描 QR Code）
        ↓
    SHA-256 → Hash
        ↓
  DNA decode（@bitmoth/core）
  種族 / 顏色 / 眼型 / 裝飾
        ↓
  渲染「蛋」（待識別）🥚
        ↓
  查詢圖鑑 Server（需網路）
        │
  ┌─────┴─────┐
  │有記錄      │無記錄
  │           ↓
  │      Ollama 生成 name / stats
  │           ↓
  │      登記到圖鑑（INSERT IGNORE）
  │
  └───→ 蛋發光 ✨（識別完成）
              ↓
          等待孵化
              ↓
        孵化完成 🦋
   資料存入本地，不再需要網路

※ 無網路時蛋持續停留在「待識別」狀態
```

---

## API 文件

### `GET /api/pokedex/:hash`

查詢圖鑑，無記錄回傳 `404`。

**Response：**
```json
{
  "hash": "7b2cbf...",
  "schemaVersion": 1,
  "raceId": 2,
  "title": "源碼的",
  "name": "暴食",
  "flavor": "吞噬一切數據的原初之獸，其咆哮化作亂碼席捲世界。",
  "hp": 480,
  "atk": 72,
  "def": 55,
  "spd": 38,
  "discoveredAt": "2025-06-10T00:00:00.000Z"
}
```

### `POST /api/pokedex`

登記新怪獸到圖鑑。同一 hash 重複提交不報錯，永遠回傳第一筆（first-write canonical）。

**Request body：**
```json
{
  "hash": "7b2cbf...",
  "raceId": 2,
  "title": "源碼的",
  "name": "暴食",
  "flavor": "...",
  "hp": 480, "atk": 72, "def": 55, "spd": 38,
  "imageBase64": "data:image/png;base64,..."
}
```

**Response：**
- `201`：新登記成功，`registered: true`
- `200`：已存在，回傳既有資料，`registered: false`

### `GET /api/pokedex`

最近 50 筆圖鑑列表（不含 image）。

### `GET /api/bitmoth/:hash`

觸發 Ollama AI 生成名稱與數值（server 內部快取用）。

---

## 彼魔種族系統

共定義 **9 大種族**，由 DNA `12 ~ 13` 碼決定（十進位 mod 9）。

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
| `12 ~ 13`（共 2 碼） | 種族（Race ID） | 十進位 mod 9，對應 9 大種族表 |
| `14 ~ 15`（共 2 碼） | 體型變體（Variant ID） | 十進位 mod 4，決定該種族內的具體輪廓 |
| `16 ~ 17`（共 2 碼） | 魔眼特徵（Eye ID） | 十進位 mod 6（獨眼、三眼、裂瞳、電子眼、空洞眼、巨獸黑瞳） |
| `18 ~ 19`（共 2 碼） | 裝飾特徵（Deco ID） | 十進位 mod 4，從種族專屬裝飾池中抽取 |
| `20 ~ 63`（其餘碼） | 傳給 Ollama | 作為 AI 生成名稱與數值的熵來源 |

> **演算法穩定性**：`packages/core/dnaDecoder.js` 凍結後不得修改，否則相同輸入將召喚出不同的彼魔。`schemaVersion` 欄位記錄版本，方便未來分流處理。

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

### @bitmoth/core

`packages/core` 為 npm workspace 共用套件，被 `apps/server`、`apps/desktop`、`apps/mobile` 同時引用。修改 `dnaDecoder.js` 會影響所有平台，需謹慎版本控管。

### 圖鑑一致性

圖鑑 server 使用 `INSERT IGNORE` 搭配 hash PRIMARY KEY，確保同一隻彼魔的名稱與數值只被寫入一次（first-write canonical）。多個裝置同時發現同一隻彼魔時，第一筆寫入的資料即為正典。

### 離線行為

孵化前必須連線至圖鑑 server。無網路時蛋停留在「待識別」狀態，直到連線後自動重試。孵化完成後的彼魔資料永久存在裝置本地，不再需要網路。

### Desktop Canvas 像素渲染

- 16×24 點陣（左半 8 列，右半鏡射），每格 14px，canvas 共 224×336
- 主色（body）+ 次色（outline）+ 白色高光 + 強制眼睛座標
- 使用 `shadowBlur` 實現次色光暈效果
- 掃描線 overlay 模擬 CRT 顯示器風格
