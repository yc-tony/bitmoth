# bitmoth
專案規劃書：Bitmoth (彼魔) —— 跨平台雜湊像素巨獸生成器本專案旨在利用 Expo (React Native) 框架，開發一款跨平台（Mobile App, Tablet App, Mobile Web）的獨立趣味互動系統。「Bitmoth（彼魔）」 的核心概念為「封印在最小位元（Bit）中的上古巨獸（Behemoth）」。系統透過掃描 QR Code 或輸入任意字串，利用確定性雜湊演算法將數據解碼為獨一無二的「彼魔基因（DNA）」，並實時渲染出復古 8-bit/16-bit 左右對稱的像素魔獸。相同的輸入源將永遠召喚出絕對相同的彼魔。1. 技術棧選型 (Tech Stack)為了實現「一套程式碼、三端（iOS / Android / Web）完美同步」且保持像素不失真，技術選型如下：跨平台核心： Expo (React Native) + Expo Router（基於文件系統的路由，確保 Web URL 與 App 頁面完美對應）。加密邏輯： crypto-js（用於將輸入字串計算為穩定、唯一的 SHA-256 雜湊值）。條碼與相機： expo-camera（App 端調用 iOS/Android 原生相機，Web 端自動降級調用 WebRTC 瀏覽器相機，提供極速的 QR Code 識別）。像素視覺渲染： react-native-svg（關鍵核心！放棄傳統 Canvas，改用 SVG 的 <Rect> 陣列繪製像素。在 iPad 或高解析度螢幕上放大時，能透過設定保持絕對銳利、不模糊的 Pixel-Perfect 邊緣）。UI 與自適應佈局： NativeWind (v4+) —— 使用 Tailwind CSS 語法，輕鬆搞定平板/桌上型網頁的雙欄橫式佈局與手機的單欄直式佈局。2. 系統架構與代碼複用設計為了讓專案保持輕量，核心的「演算法」與「像素渲染」被抽離為跨平台通用組件：/bitmoth-app
├── /src
│   ├── /utils
│   │   └── dnaDecoder.js      <-- [純 JS] 核心演算：String -> SHA-256 -> 彼魔外觀與數值 JSON
│   ├── /components
│   │   ├── BitmothSprite.tsx  <-- [通用 UI] 遍歷 DNA 陣列，用 SVG 渲染左右對稱的像素彼魔
│   │   └── QrScanner.tsx      <-- [分流 UI] 處理網頁端與 App 原生相機的權限與調用
│   └── /app                   <-- Expo Router 頁面
│       ├── index.tsx          <-- 主頁 (掃描框 / 手動輸入 / 歷史彼魔列表)
│       ├── archive.tsx        <-- 彼魔圖鑑 (AsyncStorage 本地緩存)
│       └── info.tsx           <-- 彼魔詳情頁 (展示數值卡片、屬性、下載圖片)
3. 彼魔基因解碼演算法 (DNA Alignment)系統將 SHA-256 產生的 64 位十六進位字串（256-bit）視為彼魔的染色體，拆解如下：基因位置 (Hash 區段)決定特徵實作與渲染邏輯0 ~ 5 碼 (共6碼)主體色系轉為 Hex 顏色（如 #7B2CBF），作為彼魔皮膚或外殼主色。6 ~ 11 碼 (共6碼)次要裝飾色轉為 Hex 顏色，用於眼睛、斑紋、發光特效或配件。12 ~ 13 碼 (共2碼)巨獸體型 (Body ID)轉十進位後 mod N，決定是「爬行類、人形、多肢、或是翅怪」的輪廓。14 ~ 15 碼 (共2碼)魔眼特徵 (Eye ID)決定眼睛像素（如：三眼、生氣、巨獸黑瞳、電子眼）。16 ~ 17 碼 (共2碼)外骨骼/裝飾決定是否有「巨角、尾刺、背鰭或混沌翅膀」。其餘欄位神話稱號與數值運算 HP / ATK / DEF。並從字庫中拼湊專屬稱號（例如：[源碼的] [暴食] · 彼魔）。渲染機制：BitmothSprite 僅計算左半邊的 $8 \times 16$ 或 $16 \times 32$ 點陣矩陣，右半邊自動進行軸對稱鏡射，凸顯經典魔獸與復古電玩頭目的威嚴感。4. 行動網頁與手機/平板自適應 (RWD) 體驗利用 NativeWind (Tailwind)，畫面會根據螢幕尺寸自動變形，完美發揮平板大螢幕的優勢：手機端佈局 (Mobile)：全螢幕直式。上半部為相機掃描區，下半部為最近召喚的彼魔。掃描成功後，畫面淡入切換至詳情頁，滿版秀出彼魔卡片。平板 / Web 端佈局 (Tablet / Desktop Web)：利用 Tailwind 的 md:flex-row 斷點。左側固定欄 (40%)： 持續開啟相機掃描或顯示彼魔歷史收藏。右側詳情欄 (60%)： 大尺寸、高清渲染的彼魔卡片。當左側掃描到新的 QR Code 時，右側的彼魔會直接播放「解封印動畫」並即時更新數據，帶來強烈的控制台互動感。
