# Bitmoth（彼魔）

> 封印在最小位元（Bit）中的上古巨獸（Behemoth）

跨平台雜湊像素巨獸生成器。透過掃描 QR Code 或輸入任意字串，利用確定性雜湊演算法將數據解碼為獨一無二的「彼魔基因（DNA）」，並實時渲染出復古 8-bit/16-bit 左右對稱的像素魔獸。**相同的輸入源將永遠召喚出絕對相同的彼魔。**

---

## 目錄

- [系統架構總覽](#系統架構總覽)
- [技術棧](#技術棧)
- [專案結構](#專案結構)
- [彼魔種族系統](#彼魔種族系統)
- [彼魔 DNA 解碼演算法](#彼魔-dna-解碼演算法)
- [名稱與數值生成系統](#名稱與數值生成系統)
- [自適應佈局](#自適應佈局)
- [技術注意事項](#技術注意事項)

---

## 系統架構總覽

```
Client（Expo App / Web）
  │
  ├─ 1. 掃描 QR / 輸入字串
  ├─ 2. SHA-256 → hash               （client, crypto-js）
  ├─ 3. hash → BitmothDNA            （client, dnaDecoder.ts）
  │     └─ 種族、體型、顏色、眼型、裝飾
  │
  └─ 4. GET /api/bitmoth/:hash       （HTTP → Backend）
              │
              ├─ DB 查詢 hash
              │   ├─ HIT  → 直接回傳快取的 name / stats
              │   └─ MISS →
              │       ├─ 組裝 Ollama prompt（DNA + 規則）
              │       ├─ POST ollama/api/generate
              │       ├─ 解析 JSON 回應
              │       ├─ INSERT INTO bitmoth_cache
              │       └─ 回傳 name / stats
              │
Client 收到 name + stats，合併 DNA，渲染 BitmothSprite
```

---

## 技術棧

### 前端（Expo App）

| 類別 | 技術 | 用途 |
|------|------|------|
| 跨平台核心 | Expo + Expo Router | 一套程式碼同步 iOS / Android / Web |
| 加密邏輯 | `crypto-js` | 輸入字串 → SHA-256 雜湊 |
| 條碼與相機 | `expo-camera` | 原生相機；Web 降級至 WebRTC |
| 像素視覺渲染 | `react-native-svg` | SVG `<Rect>` 陣列，任何解析度 Pixel-Perfect |
| UI 自適應佈局 | `NativeWind v4+` | Tailwind CSS 語法，支援平板雙欄佈局 |

### 後端（API Server）

| 類別 | 技術 | 用途 |
|------|------|------|
| Runtime | Node.js + Fastify | 輕量 API server |
| 資料庫 | SQLite（`better-sqlite3`） | 本地快取；若需多人共用可換 PostgreSQL |
| ORM | Drizzle ORM | 型別安全的 SQL，輕量無魔法 |
| AI 生成 | Ollama（本地）+ `ollama` npm | 生成怪獸名稱、稱號、數值、一句話描述 |

---

## 專案結構

```
bitmoth/
├── apps/
│   └── mobile/                      # Expo App
│       └── src/
│           ├── utils/
│           │   ├── dnaDecoder.ts    # String → SHA-256 → BitmothDNA
│           │   └── dnaDecoder.test.ts
│           ├── components/
│           │   ├── BitmothSprite.tsx
│           │   └── QrScanner.tsx
│           └── app/                 # Expo Router 頁面
│               ├── index.tsx
│               ├── archive.tsx
│               └── info.tsx
│
└── apps/
    └── server/                      # API Server
        ├── src/
        │   ├── db/
        │   │   ├── schema.ts        # Drizzle schema（bitmoth_cache 表）
        │   │   └── index.ts         # DB 連線
        │   ├── ollama/
        │   │   ├── prompt.ts        # 組裝 Ollama prompt
        │   │   └── client.ts        # 呼叫 Ollama API + 解析 JSON 回應
        │   └── routes/
        │       └── bitmoth.ts       # GET /api/bitmoth/:hash
        └── index.ts
```

---

## 彼魔種族系統

共定義 **9 大種族**，由 DNA `12 ~ 13` 碼決定（`十進位 mod 9`）。種族決定體型範本池、顏色傾向與裝飾特徵，確保生成結果有辨識度而不發散。

| ID | 種族 | 外觀風格 | 主色傾向 | 專屬裝飾 | 數值傾向 |
|----|------|---------|---------|---------|---------|
| 0 | 龍種 | 鱗甲、長尾、威嚴感 | 深紅、金、暗綠 | 龍角、背鰭、尾刺 | 高 ATK / DEF |
| 1 | 妖精種 | 輕盈、小巧、魔法光暈 | 粉、淡藍、翠綠 | 翅膀、觸角、光環 | 高 SPD，低 HP |
| 2 | 惡魔種 | 扭曲、尖角、暗能量 | 暗紫、血紅、焦黑 | 惡魔角、骨刺、惡翼 | 均衡偏高 ATK |
| 3 | 獸種 | 肌肉、毛皮、爪牙 | 棕、橙、灰 | 獸耳、利爪、獠牙 | 高 HP / ATK |
| 4 | 魚種 | 鱗片、流線型、深海感 | 深藍、青、銀 | 魚鰭、觸鬚、發光器 | 高 DEF / SPD |
| 5 | 鳥種 | 羽毛、冠羽、銳爪 | 金、紅、藍 | 冠羽、翅膀、尾羽 | 最高 SPD |
| 6 | 元素種 | 能量結晶、無機質形體 | 由次色決定元素屬性 | 元素核心、放射光芒 | 依屬性偏移 |
| 7 | 機械種 | 齒輪裝甲、電路板紋理 | 銀、鋼藍、螢光綠 | 機械臂、感測眼、排氣管 | 高 DEF，低 SPD |
| 8 | 亡靈種 | 骨骸、幽靈、腐化感 | 骨白、幽靈綠、暗灰 | 骨角、空洞眼、殘翼 | 高 ATK，低 DEF |

### 種族與顏色的交互規則

原始主色（`0 ~ 5` 碼）先決定色相，渲染時按種族做**飽和度與明度偏移**：

- 龍種 / 惡魔種 → 拉高對比、壓暗底色
- 妖精種 / 鳥種 → 提亮、增加飽和度
- 機械種 → 去飽和偏灰，點綴螢光色作為電子高光
- 亡靈種 → 強制去飽和至接近灰階，僅保留幽靈綠作為發光色
- 元素種 → 忽略主色，由次色色相判斷屬性（紅=火、藍=水/冰、褐=土、綠/青=風）

---

## 彼魔 DNA 解碼演算法

系統將 SHA-256 產生的 **64 位十六進位字串（256-bit）** 視為彼魔的染色體，拆解如下：

> `dnaDecoder.ts` 輸出的 `BitmothDNA` 物件必須包含 `schemaVersion` 欄位。演算法邏輯凍結後不得修改，否則相同輸入將召喚出不同的彼魔。

| 基因位置（Hash 區段） | 決定特徵 | 實作說明 |
|---|---|---|
| `0 ~ 5`（共 6 碼） | 主體色系 | 轉為 Hex 顏色（如 `#7B2CBF`），作為皮膚或外殼主色 |
| `6 ~ 11`（共 6 碼） | 次要裝飾色 | 用於眼睛、斑紋、發光特效；元素種以此判斷元素屬性 |
| `12 ~ 13`（共 2 碼） | 種族（Race ID） | 十進位 mod 9，對應上方 9 大種族表 |
| `14 ~ 15`（共 2 碼） | 體型變體（Variant ID） | 十進位 mod 4，決定該種族內的具體輪廓 |
| `16 ~ 17`（共 2 碼） | 魔眼特徵（Eye ID） | 十進位 mod 6（獨眼、三眼、裂瞳、電子眼、空洞眼、巨獸黑瞳） |
| `18 ~ 19`（共 2 碼） | 裝飾特徵（Deco ID） | 十進位 mod 4，從種族專屬裝飾池中抽取 |
| `20 ~ 63`（其餘碼） | 傳給 Ollama | 作為 AI 生成名稱與數值的熵來源（見下節） |

---

## 名稱與數值生成系統

### 資料庫 Schema

```typescript
// apps/server/src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const bitmothCache = sqliteTable('bitmoth_cache', {
  hash:          text('hash').primaryKey(),       // SHA-256 64碼，唯一識別
  schemaVersion: integer('schema_version').notNull(),
  race:          integer('race').notNull(),        // 0~8，冗余存放方便查詢
  title:         text('title').notNull(),          // 修飾詞，如「源碼的」
  name:          text('name').notNull(),           // 核心稱號，如「暴食」
  flavor:        text('flavor').notNull(),         // 一句話描述
  hp:            integer('hp').notNull(),
  atk:           integer('atk').notNull(),
  def:           integer('def').notNull(),
  spd:           integer('spd').notNull(),
  generatedAt:   integer('generated_at', { mode: 'timestamp' }).notNull(),
})
```

### API 端點

```
GET /api/bitmoth/:hash
```

**Response（快取命中 或 AI 新生成）：**

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
  "spd": 38
}
```

### Ollama Prompt 設計

```typescript
// apps/server/src/ollama/prompt.ts
export function buildPrompt(dna: BitmothDNA, entropyHex: string): string {
  const raceNames = ['龍種','妖精種','惡魔種','獸種','魚種','鳥種','元素種','機械種','亡靈種']
  const race = raceNames[dna.raceId]

  return `
你是一個奇幻世界的神話學者，負責為召喚出的彼魔賦予名諱與數值。

## 彼魔基因
- 種族：${race}
- 主色：${dna.primaryColor}
- 次色：${dna.secondaryColor}
- 體型變體 ID：${dna.variantId}
- 魔眼 ID：${dna.eyeId}
- 裝飾 ID：${dna.decoId}
- 熵碼（可作為靈感）：${entropyHex}

## 命名規則
- title（修飾詞）：從顏色或概念提取，2~4 字，如「源碼的」「永夜的」「熔岩的」
- name（核心稱號）：代表性格或力量，2~6 字，如「暴食」「裂淵」「虛無吞噬者」
- flavor：一句話描述，20 字以內

## 數值規則
- HP：100 ~ 999
- ATK / DEF / SPD：10 ~ 99
- ATK + DEF + SPD 總和不超過 200
- 依種族傾向偏移（${race}：${raceStatHint(dna.raceId)}）

請僅回覆以下 JSON，不要包含任何其他文字：
{"title":"...","name":"...","flavor":"...","hp":0,"atk":0,"def":0,"spd":0}
`.trim()
}

function raceStatHint(raceId: number): string {
  const hints = [
    '高 ATK / DEF',    // 龍種
    '高 SPD，低 HP',   // 妖精種
    '均衡偏高 ATK',    // 惡魔種
    '高 HP / ATK',     // 獸種
    '高 DEF / SPD',    // 魚種
    '最高 SPD',        // 鳥種
    '依屬性偏移',       // 元素種
    '高 DEF，低 SPD',  // 機械種
    '高 ATK，低 DEF',  // 亡靈種
  ]
  return hints[raceId] ?? '均衡'
}
```

### 快取流程實作

```typescript
// apps/server/src/routes/bitmoth.ts
fastify.get('/api/bitmoth/:hash', async (req, reply) => {
  const { hash } = req.params

  // 1. 查快取
  const cached = db.select().from(bitmothCache).where(eq(bitmothCache.hash, hash)).get()
  if (cached) {
    return { ...cached, cached: true }
  }

  // 2. 從 hash 重建 DNA（server 端也做一次，確保一致）
  const dna = decodeDna(hash)

  // 3. 呼叫 Ollama
  const prompt = buildPrompt(dna, hash.slice(20))
  const raw = await ollama.generate({ model: 'llama3.2', prompt, format: 'json' })
  const generated = JSON.parse(raw.response) as GeneratedStats

  // 4. 寫入快取
  db.insert(bitmothCache).values({
    hash,
    schemaVersion: DNA_SCHEMA_VERSION,
    race: dna.raceId,
    ...generated,
    generatedAt: new Date(),
  }).run()

  return { ...generated, hash, cached: false }
})
```

### 推薦 Ollama 模型

| 模型 | 優點 | 備註 |
|------|------|------|
| `llama3.2:3b` | 輕量快速，適合 JSON 格式輸出 | 推薦開發期使用 |
| `llama3.1:8b` | 更豐富的命名創意 | 記憶體需求較高 |
| `mistral:7b` | 指令遵從性佳 | 格式控制穩定 |

> **注意：** 需在本機先行執行 `ollama pull llama3.2`，並確保 Ollama 服務運行於 `http://localhost:11434`。

---

## 自適應佈局

利用 NativeWind（Tailwind）斷點，畫面根據螢幕尺寸自動變形：

### 手機端（Mobile）

```
┌─────────────────────┐
│                     │
│    相機掃描區        │
│                     │
├─────────────────────┤
│   最近召喚的彼魔    │
└─────────────────────┘
```

掃描成功後，畫面淡入切換至詳情頁，滿版秀出彼魔卡片。

### 平板 / Web 端（`md:flex-row` 斷點）

```
┌──────────────────┬───────────────────────────┐
│                  │                           │
│  相機掃描        │   彼魔卡片（大尺寸）       │
│  歷史收藏        │                           │
│  (40%)           │   (60%)                   │
│                  │   ← 解封印動畫即時更新     │
└──────────────────┴───────────────────────────┘
```

左側掃描到新 QR Code 時，右側彼魔直接播放「解封印動畫」並即時更新數據。

---

## 技術注意事項

### 演算法穩定性

`dnaDecoder.ts` 凍結後不得修改，否則相同輸入將召喚出不同的彼魔。

- 輸出型別定義為嚴格的 `BitmothDNA` TypeScript 介面
- 使用 Jest 對已知輸入固定期望輸出，防止演算法漂移
- `BitmothDNA` 含 `schemaVersion: number`，DB 也記錄版本方便未來分流

### SVG 渲染效能

16×32 點陣鏡射後達 1024 個 `<Rect>`，低階裝置容易卡頓：

- `BitmothSprite` 用 `useMemo` 緩存點陣計算結果
- 圖鑑列表頁使用預先快取的 base64 縮圖，不在列表中即時渲染 SVG

### Web 端 QR Code 降級

`expo-camera` 在 Web 端依賴 WebRTC 相機授權，建議額外支援「**上傳圖片解析 QR Code**」（`jsQR` 純 JS 函式庫）。

### 分享連結

詳情頁支援「**分享連結**」：將輸入字串 encode 進 URL query string（如 `?seed=<encoded>`），讓別人點連結就能直接召喚出同一隻彼魔。
