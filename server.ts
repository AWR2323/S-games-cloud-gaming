import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { generateProceduralGame } from './server/fallbackGameGenerator';

// Lazy initialized S AI client
let saiClient: GoogleGenAI | null = null;
function getSAIClient(): GoogleGenAI {
  if (!saiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('S AI APIキーが設定されていません。');
    }
    saiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return saiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cloudmoon AD patterns to block
const AD_PATTERNS = [
  'googlesyndication.com',
  'doubleclick.net',
  'googleadservices.com',
  'google-analytics.com',
  'googletagmanager.com',
  'googletagservices.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'tpc.googlesyndication.com',
  'video-ad-stats.googlesyndication.com',
  'ads.google.com',
  'adssettings.google.com',
  'static.ads-twitter.com',
  'ads-api.twitter.com',
  'ads.facebook.com',
  'an.facebook.com',
  'adnxs.com',
  'advertising.com',
  'outbrain.com',
  'taboola.com',
  'criteo.com',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net',
  'adsafeprotected.com',
  'moatads.com',
  'scorecardresearch.com',
  '/ads/',
  '/ad/',
  '/advert/',
  '/advertisement/',
  '/adsense/',
  '/adserver/',
  '/analytics/',
  'prebid',
  'advertis',
  'banner',
  'popup',
];

function isAdRequest(url: string): boolean {
  const urlLower = url.toLowerCase();
  return AD_PATTERNS.some((pattern) => urlLower.includes(pattern));
}

function blockAdsInHTML(html: string): string {
  let cleaned = html;
  cleaned = cleaned.replace(/<script[^>]*googlesyndication[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*adsbygoogle[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*google-analytics[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*googletagmanager[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*doubleclick[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<iframe[^>]*googlesyndication[^>]*>[\s\S]*?<\/iframe>/gi, '');
  cleaned = cleaned.replace(/<iframe[^>]*doubleclick[^>]*>[\s\S]*?<\/iframe>/gi, '');
  cleaned = cleaned.replace(/<ins[^>]*adsbygoogle[^>]*>[\s\S]*?<\/ins>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*id="google_ads[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  return cleaned;
}

const INJECTION_CODE = `
<style id="cm-ad-blocker-css">
  /* Hide ONLY specific CloudMoon ad container divs */
  .a-div-horizontal,
  .a-div-vertical,
  .a-div-placeholder,
  .a-div-box {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    position: absolute !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
  }
</style>
<script id="cm-fix-js">
(function(){
  console.log('[S Games / Cloudmoon InPlay] Engine Active');
  
  // 1. Block ad network fetch/XHR
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && isAdUrl(url)) {
      console.log('[S Games AdBlock] Blocked ad request:', url);
      return Promise.reject(new Error('Ad blocked'));
    }
    return originalFetch.apply(this, args);
  };

  const originalXHR = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && isAdUrl(url)) {
      console.log('[S Games AdBlock] Blocked XHR ad:', url);
      return;
    }
    return originalXHR.apply(this, arguments);
  };

  function isAdUrl(url) {
    const patterns = [
      'googlesyndication', 'doubleclick', 'googleadservices',
      'google-analytics', 'googletagmanager', 'googletagservices',
      '/ads/', '/ad/', '/advert', 'adsense', 'analytics',
      'facebook.com/ads', 'twitter.com/ads'
    ];
    return patterns.some(p => url.toLowerCase().includes(p));
  }

  // 2. Remove ad elements from DOM
  function removeAds() {
    const googleAdSelectors = [
      'iframe[src*="googlesyndication"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="google-analytics"]',
      'div[id*="google_ads"]',
      'div[class*="adsbygoogle"]',
      'ins.adsbygoogle',
      '[data-ad-slot]',
      '[data-ad-client]'
    ];
    googleAdSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none';
        try { el.remove(); } catch (e) {}
      });
    });

    const adDivs = document.querySelectorAll('.a-div-horizontal, .a-div-vertical, .a-div-placeholder, .a-div-box');
    adDivs.forEach(el => {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      el.style.position = 'absolute';
      el.style.width = '0';
      el.style.height = '0';
      el.style.overflow = 'hidden';
      try { el.remove(); } catch (e) {}
    });
  }

  // 3. Fix Authentication Buttons (Highlight email/password, hide broken Google OAuth in iframe)
  function fixButtons() {
    const allBtns = document.querySelectorAll("button.google-button, button.apple-button");
    for (let i = 0; i < allBtns.length; i++) {
      const btn = allBtns[i];
      const styleAttr = btn.getAttribute("style") || "";
      // Purple background (123, 108, 196) - show this button (Email & password login)
      if (styleAttr.indexOf("123, 108, 196") !== -1 || styleAttr.indexOf("123,108,196") !== -1) {
        btn.style.setProperty("display", "flex", "important");
        btn.style.setProperty("visibility", "visible", "important");
        btn.style.setProperty("opacity", "1", "important");
        btn.style.setProperty("pointer-events", "auto", "important");
        btn.style.setProperty("flex-direction", "row", "important");
        btn.style.setProperty("justify-content", "center", "important");
        btn.style.setProperty("align-items", "center", "important");
        btn.style.setProperty("gap", "1rem", "important");
        btn.style.setProperty("width", "min(350px, 100%)", "important");
        btn.style.setProperty("height", "45px", "important");
        btn.style.setProperty("border-radius", "5rem", "important");
        btn.style.setProperty("cursor", "pointer", "important");
        btn.style.setProperty("font-size", "1rem", "important");
      }
      // White background - OAuth buttons that fail in iframes
      else if (styleAttr.indexOf("255, 255, 255") !== -1 || styleAttr.indexOf("#fff") !== -1 || styleAttr.indexOf("white") !== -1 || btn.querySelector("svg")) {
        btn.style.setProperty("display", "none", "important");
        btn.style.setProperty("visibility", "hidden", "important");
      }
    }
  }

  // 4. Intercept game launch (window.open & links)
  const origOpen = window.open;
  function sendGameUrl(url) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "LOAD_GAME", url: url }, "*");
    }
  }

  function makeFakeWindow() {
    const locObj = { _href: 'about:blank' };
    Object.defineProperty(locObj, 'href', {
      get: function() { return this._href; },
      set: function(url) {
        this._href = url;
        if (typeof url === 'string' && (url.indexOf('/run-site/') > -1 || url.indexOf('/game/') > -1)) {
          sendGameUrl(url);
        }
      }
    });
    locObj.assign = function(url) { locObj.href = url; };
    locObj.replace = function(url) { locObj.href = url; };
    return {
      closed: false,
      close: function(){}, focus: function(){}, blur: function(){},
      location: locObj,
      document: { write: function(){}, close: function(){}, open: function(){} }
    };
  }

  window.open = function(u, t, f) {
    if (u && (u.indexOf('/run-site/') > -1 || u.indexOf('/game/') > -1)) {
      sendGameUrl(u);
      return makeFakeWindow();
    }
    if (!u || u === '' || u === 'about:blank') {
      return makeFakeWindow();
    }
    return origOpen.call(this, u, t, f);
  };

  document.addEventListener('click', function(e) {
    const a = e.target.closest('a');
    if (a && a.href && (a.href.indexOf('/run-site/') > -1 || a.href.indexOf('/game/') > -1)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      sendGameUrl(a.href);
    }
  }, true);

  // 5. Fullscreen event handling with UI overlay preservation
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'REQUEST_FULLSCREEN') {
      const gameWrapper = document.querySelector('#gameWrapper') || document.querySelector('#content') || document.documentElement;
      if (gameWrapper) {
        const inputDiv = document.querySelector('#input-div');
        const sidebar = document.querySelector('.sidebar.sidebar-open') || document.querySelector('.sidebar');
        const floatingBall = document.querySelector('#floating-ball');
        
        const elementsToRestore = [];
        function storeAndMoveElement(element) {
          if (!element) return;
          const originalParent = element.parentNode;
          const originalNextSibling = element.nextSibling;
          const originalStyle = element.getAttribute('style') || '';
          const computedStyle = window.getComputedStyle(element);
          elementsToRestore.push({
            element: element,
            parent: originalParent,
            nextSibling: originalNextSibling,
            styleAttr: originalStyle,
          });
          gameWrapper.appendChild(element);
          element.style.position = 'fixed';
          element.style.zIndex = '999999';
          element.style.pointerEvents = 'auto';
          if (element.id === 'input-div') {
            element.style.bottom = '20px';
            element.style.left = '0px';
          } else if (element.id === 'floating-ball') {
            element.style.left = '0px';
            element.style.top = '50%';
            element.style.transform = 'translateY(-50%)';
          }
        }

        storeAndMoveElement(inputDiv);
        storeAndMoveElement(sidebar);
        storeAndMoveElement(floatingBall);

        if (gameWrapper.requestFullscreen) {
          gameWrapper.requestFullscreen().catch(() => {});
        } else if (gameWrapper.webkitRequestFullscreen) {
          gameWrapper.webkitRequestFullscreen();
        }

        const fullscreenExitHandler = function() {
          if (document.fullscreenElement || document.webkitFullscreenElement) return;
          elementsToRestore.forEach(item => {
            if (item.element && item.parent) {
              if (item.nextSibling && item.nextSibling.parentNode === item.parent) {
                item.parent.insertBefore(item.element, item.nextSibling);
              } else {
                item.parent.appendChild(item.element);
              }
              if (item.styleAttr) {
                item.element.setAttribute('style', item.styleAttr);
              } else {
                item.element.removeAttribute('style');
              }
            }
          });
          document.removeEventListener('fullscreenchange', fullscreenExitHandler);
          document.removeEventListener('webkitfullscreenchange', fullscreenExitHandler);
        };
        document.addEventListener('fullscreenchange', fullscreenExitHandler);
        document.addEventListener('webkitfullscreenchange', fullscreenExitHandler);
      }
    }
  });

  // Run initial cleaners
  removeAds();
  fixButtons();
  setInterval(() => {
    removeAds();
    fixButtons();
  }, 250);
})();
</script>
`;

// Cache API responses for high performance
let cachedGames: any = null;
let cachedGamesTime = 0;
let cachedCategories: any = null;
let cachedCategoriesTime = 0;
let cachedServers: any = null;
let cachedServersTime = 0;

// High-speed LRU memory cache for generated games to achieve instant response
const cachedGeneratedGames = new Map<string, any>();

async function warmCloudmoonCache() {
  try {
    const response = await fetch('https://api.prod.cloudmoonapp.com/game/guest_list', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
      },
    });
    if (response.ok) {
      cachedGames = await response.json();
      cachedGamesTime = Date.now();
      console.log('[S games Cache Engine] Pre-warmed Cloudmoon games catalog in memory.');
    }
  } catch (e) {
    // Non-blocking
  }
}

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'S games - 2608moon / Cloudmoon InPlay Platform' });
});

// Cloudmoon API: Games list (Aggressively cached for instant response)
app.get('/api/cloudmoon/games', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    // Cache for 10 minutes (600,000 ms) for instant response
    if (cachedGames && now - cachedGamesTime < 600000) {
      res.setHeader('Cache-Control', 'public, max-age=600');
      return res.json(cachedGames);
    }
    const response = await fetch('https://api.prod.cloudmoonapp.com/game/guest_list', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch from Cloudmoon API: ${response.statusText}`);
    }
    const data = await response.json();
    cachedGames = data;
    cachedGamesTime = now;
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Cloudmoon games list:', error);
    if (cachedGames) {
      return res.json(cachedGames);
    }
    res.status(500).json({ error: error.message || 'Failed to fetch games' });
  }
});

// Cloudmoon API: Categories
app.get('/api/cloudmoon/categories', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cachedCategories && now - cachedCategoriesTime < 300000) {
      return res.json(cachedCategories);
    }
    const response = await fetch('https://api.prod.cloudmoonapp.com/game/category', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    const data = await response.json();
    cachedCategories = data;
    cachedCategoriesTime = now;
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    if (cachedCategories) return res.json(cachedCategories);
    res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
});

// Cloudmoon API: Servers
app.get('/api/cloudmoon/servers', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (cachedServers && now - cachedServersTime < 300000) {
      return res.json(cachedServers);
    }
    const response = await fetch('https://api.prod.cloudmoonapp.com/game/server_list', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch servers: ${response.statusText}`);
    }
    const data = await response.json();
    cachedServers = data;
    cachedServersTime = now;
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching servers:', error);
    if (cachedServers) return res.json(cachedServers);
    res.status(500).json({ error: error.message || 'Failed to fetch servers' });
  }
});

// S AI: Game Generation Endpoint
app.post('/api/ai/generate-game', async (req: Request, res: Response) => {
  try {
    const { prompt, genre, theme, difficulty, cameraMode } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'プロンプトを入力してください。' });
    }

    const cacheKey = `${prompt.trim()}_${genre || 'any'}_${theme || 'default'}_${difficulty || 'normal'}_${cameraMode || 'default'}`.toLowerCase();
    if (cachedGeneratedGames.has(cacheKey)) {
      console.log('[S AI] Serving pre-generated game from instant memory cache:', cacheKey);
      return res.json({ success: true, game: cachedGeneratedGames.get(cacheKey) });
    }

    const systemInstruction = `あなたは「S games」の専属天才ゲームプログラマー兼クリエイター「S AI」です。
ユーザーのリクエストに応じて、ブラウザ上で即座に軽快・大迫力に動作する完全自立型のHTML5/JavaScriptゲーム（2DゲームまたはThree.jsを用いた本格3Dゲーム）を生成してください。

【ゲーム制作の必須要件】
1. 完全なHTML5単一ドキュメントとして出力してください（<!DOCTYPE html>から</html>まで）。
   - 【3Dゲームの場合】: 必ず <head> 内で Three.js の安定版CDNを読み込んでください:
     <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
     パルクール・アスレチック(Obby)、3Dレース、オープンワールド探検、3D迷路、アクション、TPSなど、美しいライティング、影、色彩豊かな3Dブロック/オブジェクト、アニメーション、三人称視点(TPS)または一人称(FPS)カメラを実装してください。
   - 【2Dゲームの場合】: Canvas API 2D（またはSVG・CSSシェイプ）で美しく描画してください。

2. 【モバイル版の操作方法（Roblox / ロブロックス完全互換）】:
   - モバイルやタブレット環境では、**Roblox（ロブロックス）と全く同じ快適な操作UI**を必ず画面上にオーバーレイ描画・実装してください:
     ① 画面左下: **バーチャルジョイスティック**（外側の丸いベース枠と、内側のドラッグ追従ノブ。タッチ＆ドラッグで前後左右360度スムーズに移動。タッチを離すと中央に戻る）。
     ② 画面右下: **丸い大きなジャンプボタン**（透明感のある円形デザイン、「JUMP」または「▲」アイコン。タップで即座にジャンプ）。
     ③ 画面右側のタッチスワイプ: **カメラ視点回転**（Roblox同様、画面右側をスワイプすることでカメラの旋回・視点移動が可能）。
   - PCでの操作:
     - [W][A][S][D] または 矢印キー で移動
     - [SPACE] キーでジャンプ
     - マウスドラッグ でカメラ視点回転
   - タッチ操作とキーボード操作の両方が同時に自然に動作すること。

3. サウンド効果:
   - Web Audio API (AudioContext) によるシンセサイザー効果音（ジャンプ音、コイン/アイテム取得音、着地音、爆発音、ゲームオーバー音、BGM風アルペジオ）を組み込み、外部音声ファイルなしで気持ち良い音が出るようにしてください。
   - 最初のタップ・クリック・キー入力で必ず audioCtx.resume() を実行してください。

4. ゲームループと演出:
   - スタート画面（タイトルロゴ、「START / タップまたはSPACEで開始」）
   - プレイ画面（スコア/コイン数、ステージ/チェックポイント、タイマー、残機/HP）
   - ゲームオーバー・クリア画面（リトライボタン、スコア表示）
   - 豊かな演出（落ちた時のリスポーン、紙吹雪パーティクル、発光・ネオンシェーディング、リッチなグラフィックス）

5. レスポンシブ設計:
   - 画面全体（width: 100vw; height: 100vh; overflow: hidden; position: fixed;）に綺麗にフィットし、タッチズーム無効（touch-action: none; user-scalable=no）で快適に操作できるようにしてください。

【レスポンス形式】
必ず指定されたJSON構造で返してください。
- title: キャッチーで魅力的な日本語のゲームタイトル
- description: ゲームの概要、ルール、操作方法（Roblox風モバイル操作とPC操作の説明を含む）
- genre: ゲームジャンル（例: 3Dパルクール(Obby), 3Dレース, 3Dアクション, 2Dシューティングなど）
- code: 完全なHTMLソースコード`;

    const userPromptText = `ユーザーのリクエスト:
【作りたいゲーム】: ${prompt}
【ジャンル】: ${genre || 'おまかせ'}
【スタイル/テーマ】: ${theme || 'ネオンアーケード'}
【難易度】: ${difficulty || 'NORMAL'}
【カメラ視点】: ${cameraMode || '3人称 (TPS)'}

このリクエストに基づき、最高に楽しくて完成度の高いオリジナルゲーム（3Dゲームが指定または適している場合はThree.jsを使用し、モバイルはロブロックスと同じ操作方法を完備）をプログラミングしてJSONで出力してください。`;

    let gameData: any = null;

    // 1. Attempt generation via Gemini API if key is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getSAIClient();
        // Candidate models: gemini-3.1-flash-lite is lightweight and resilient against 503 high demand, followed by 3.8-flash and flash-latest
        const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
        
        for (const model of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: userPromptText,
              config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    genre: { type: Type.STRING },
                    code: { type: Type.STRING },
                  },
                  required: ['title', 'description', 'genre', 'code'],
                },
              },
            });

            if (response.text) {
              let raw = response.text.trim();
              if (raw.startsWith('```json')) {
                raw = raw.replace(/^```json\s*/, '').replace(/```$/, '').trim();
              } else if (raw.startsWith('```')) {
                raw = raw.replace(/^```\s*/, '').replace(/```$/, '').trim();
              }
              const parsed = JSON.parse(raw);
              if (parsed && parsed.code && parsed.title) {
                gameData = parsed;
                console.log(`[S AI] Game successfully generated with model ${model}:`, parsed.title);
                break;
              }
            }
          } catch (modelErr: any) {
            const errMsg = modelErr.message || String(modelErr);
            if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
              console.log(`[S AI] Model ${model} temporarily busy (503), switching to next model or generator...`);
            } else {
              console.log(`[S AI] Model ${model} status note:`, errMsg);
            }
          }
        }
      } catch (clientErr: any) {
        console.log('[S AI] Gemini service note:', clientErr.message);
      }
    }

    // 2. High-speed procedural synthesis fallback if AI is rate-limited, quota-exceeded, or key is absent
    if (!gameData) {
      console.log('[S AI] Activating seamless high-performance procedural game generator for prompt:', prompt);
      gameData = generateProceduralGame(prompt, genre, theme);
    }

    // Cache the result for instant replay
    if (gameData && gameData.code) {
      if (cachedGeneratedGames.size > 100) {
        const firstKey = cachedGeneratedGames.keys().next().value;
        if (firstKey) cachedGeneratedGames.delete(firstKey);
      }
      cachedGeneratedGames.set(cacheKey, gameData);
    }

    return res.json({ success: true, game: gameData });
  } catch (error: any) {
    console.error('S AI game generation unexpected error:', error);
    // Even in unexpected failure, return a working game so user never experiences an error
    try {
      const fallback = generateProceduralGame(req.body?.prompt || 'アクションゲーム', req.body?.genre, req.body?.theme);
      return res.json({ success: true, game: fallback });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: error.message || 'ゲームの生成に失敗しました。',
      });
    }
  }
});

// PWA Manifest matching Google Classroom disguise
app.get('/manifest.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.json({
    id: '/?source=pwa',
    name: 'Google Classroom',
    short_name: 'Classroom',
    description: 'A Simple way for Parents, Students, And teachers to connect through learning',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    background_color: '#0d1117',
    theme_color: '#2d2d2d',
    orientation: 'any',
    icons: [
      {
        src: 'https://ssl.gstatic.com/classroom/favicon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'https://ssl.gstatic.com/classroom/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['games', 'entertainment'],
    prefer_related_applications: false,
  });
});

// Service Worker for Cloudmoon InPlay caching
app.get('/sw.js', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.send(`
const CACHE_NAME = 'cloudmoon-sgames-v1';
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  // Let network handle by default
  return;
});
`);
});

// Proxy Core Function for Cloudmoon
async function proxyToCloudmoon(targetURL: string, req: Request, res: Response) {
  if (isAdRequest(targetURL)) {
    return res.status(204).send('');
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: req.headers['accept'] || '*/*',
      'Accept-Language': (req.headers['accept-language'] as string) || 'en-US,en;q=0.9,ja;q=0.8',
    };

    if (req.headers['authorization']) {
      headers['Authorization'] = req.headers['authorization'] as string;
    }
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }
    if (req.headers['cookie']) {
      headers['Cookie'] = req.headers['cookie'] as string;
    }

    const init: RequestInit = {
      method: req.method,
      headers,
      redirect: 'follow',
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        init.body = JSON.stringify(req.body);
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
      } else if (typeof req.body === 'string') {
        init.body = req.body;
      }
    }

    const response = await fetch(targetURL, init);

    // Set CORS and Frame permission headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Permissions-Policy',
      'accelerometer=*, gyroscope=*, camera=*, microphone=*, geolocation=*, hid=*, midi=*, clipboard-read=*, clipboard-write=*, xr-spatial-tracking=*, gamepad=*'
    );
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Frame-Options');

    const contentType = response.headers.get('content-type') || '';

    // If HTML, clean ads and inject S Games / Cloudmoon InPlay scripts
    if (contentType.includes('text/html')) {
      let html = await response.text();
      html = blockAdsInHTML(html);
      if (html.includes('</head>')) {
        html = html.replace('</head>', INJECTION_CODE + '</head>');
      } else {
        html = INJECTION_CODE + html;
      }
      res.status(response.status);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // If JavaScript, check for ads
    if (contentType.includes('javascript')) {
      if (isAdRequest(targetURL)) {
        res.setHeader('Content-Type', 'application/javascript');
        return res.send('// Ad script blocked by S Games');
      }
    }

    // For all other static assets / JSON / media, add caching headers for high speed
    res.status(response.status);
    if (response.status === 200) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
    response.headers.forEach((val, key) => {
      const k = key.toLowerCase();
      if (
        k !== 'content-security-policy' &&
        k !== 'x-frame-options' &&
        k !== 'frame-options' &&
        k !== 'content-encoding' &&
        k !== 'cache-control'
      ) {
        res.setHeader(key, val);
      }
    });

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('Proxy fetch failed for', targetURL, error);
    return res.status(502).send(`Proxy Error: ${error?.message || 'Failed to fetch resource'}`);
  }
}

// Proxy encoded URLs or explicit proxy path
app.use('/proxy/*', async (req: Request, res: Response) => {
  const fullPath = req.originalUrl;
  const prefix = '/proxy/';
  const encoded = fullPath.substring(fullPath.indexOf(prefix) + prefix.length);
  try {
    let targetURL = decodeURIComponent(encoded);
    if (!targetURL.startsWith('http://') && !targetURL.startsWith('https://')) {
      targetURL = 'https://' + targetURL;
    }
    return proxyToCloudmoon(targetURL, req, res);
  } catch (e) {
    return res.status(400).send('Invalid proxy URL');
  }
});

// Proxy for 2608moon.firebaseapp.com (Japanese version)
app.use('/cm-ja/*', async (req: Request, res: Response) => {
  const relPath = req.params[0] || '';
  const search = req.originalUrl.includes('?') ? req.originalUrl.substring(req.originalUrl.indexOf('?')) : '';
  const targetURL = `https://2608moon.firebaseapp.com/${relPath}${search}`;
  return proxyToCloudmoon(targetURL, req, res);
});

// Proxy for direct Cloudmoon web app paths
app.use('/cm-proxy/*', async (req: Request, res: Response) => {
  const relPath = req.params[0] || '';
  const search = req.originalUrl.includes('?') ? req.originalUrl.substring(req.originalUrl.indexOf('?')) : '';
  const targetURL = `https://web.cloudmoonapp.com/${relPath}${search}`;
  return proxyToCloudmoon(targetURL, req, res);
});

// Also handle the Cloudmoon-InPlay path: /web.cloudmoonapp.com/*
app.use('/web.cloudmoonapp.com/*', async (req: Request, res: Response) => {
  const relPath = req.params[0] || '';
  const search = req.originalUrl.includes('?') ? req.originalUrl.substring(req.originalUrl.indexOf('?')) : '';
  const targetURL = `https://web.cloudmoonapp.com/${relPath}${search}`;
  return proxyToCloudmoon(targetURL, req, res);
});

// Cloudmoon asset fallbacks when running inside the iframe
app.use('/_app/*', async (req: Request, res: Response, next: NextFunction) => {
  const targetURL = `https://2608moon.firebaseapp.com${req.originalUrl}`;
  return proxyToCloudmoon(targetURL, req, res);
});

app.use('/run-site/*', async (req: Request, res: Response) => {
  const targetURL = `https://web.cloudmoonapp.com${req.originalUrl}`;
  return proxyToCloudmoon(targetURL, req, res);
});

// Standalone Pure Cloudmoon InPlay Player route (matching sriail/Cloudmoon-InPlay 100%)
app.get('/inplay', (req: Request, res: Response) => {
  const target = (req.query.url as string) || 'https://2608moon.firebaseapp.com/ja/';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=*, gyroscope=*, camera=*, microphone=*, geolocation=*, hid=*, midi=*, clipboard-read=*, clipboard-write=*, xr-spatial-tracking=*, gamepad=*'
  );
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home - Classroom</title>
  <meta name="description" content="S games - Cloudmoon InPlay player">
  <link rel="icon" type="image/png" href="https://ssl.gstatic.com/classroom/favicon.png">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #0d1117; color: #c9d1d9; overflow: hidden; width: 100vw; height: 100vh; }
    #container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
    #frame-container { flex: 1; width: 100%; height: 100%; background: #000; position: relative; }
    iframe { width: 100%; height: 100%; border: none; background: #000; outline: none; }
    #btn-dock { position: fixed; bottom: 16px; left: 16px; display: flex; gap: 10px; z-index: 9999; }
    .dock-btn {
      width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15);
      background: rgba(30, 30, 40, 0.85); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      color: #f0f0f0; cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5); transition: all 0.2s;
    }
    .dock-btn:hover { background: rgba(70, 70, 90, 0.95); transform: scale(1.05); }
    .dock-btn:active { transform: scale(0.95); }
  </style>
</head>
<body>
  <div id="container">
    <div id="frame-container"></div>
  </div>
  <div id="btn-dock">
    <button class="dock-btn" id="home-btn" onclick="goHome()" title="Home / S Games">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/></svg>
    </button>
    <button class="dock-btn" id="fullscreen-btn" onclick="toggleFullscreen()" title="Fullscreen">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
    </button>
    <button class="dock-btn" id="reload-btn" onclick="reloadFrame()" title="Reload Game">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
    </button>
  </div>
  <script>
    const frameContainer = document.getElementById('frame-container');
    let currentIframe = null;
    let currentURL = ${JSON.stringify(target)};
    const SHADOW_LAYERS = 4;
    const PERMISSIONS = 'accelerometer; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; clipboard-read; clipboard-write; xr-spatial-tracking; gamepad';
    const SANDBOX = 'allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-downloads allow-pointer-lock allow-top-navigation-by-user-activation';

    function createMultiLayerShadowFrame(url) {
      frameContainer.innerHTML = '';
      let currentHost = document.createElement('div');
      currentHost.style.width = '100%';
      currentHost.style.height = '100%';
      currentHost.style.display = 'block';
      frameContainer.appendChild(currentHost);

      for (let i = 0; i < SHADOW_LAYERS; i++) {
        const shadowRoot = currentHost.attachShadow({ mode: 'closed' });
        if (i < SHADOW_LAYERS - 1) {
          const nextHost = document.createElement('div');
          nextHost.style.width = '100%';
          nextHost.style.height = '100%';
          shadowRoot.appendChild(nextHost);
          currentHost = nextHost;
        } else {
          const iframe = document.createElement('iframe');
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          iframe.setAttribute('sandbox', SANDBOX);
          iframe.setAttribute('allow', PERMISSIONS);
          iframe.setAttribute('allowfullscreen', '');
          iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
          iframe.src = url;
          shadowRoot.appendChild(iframe);
          currentIframe = iframe;
        }
      }
    }

    function goHome() {
      if (window.opener) {
        window.close();
      } else {
        window.location.href = '/';
      }
    }

    function toggleFullscreen() {
      if (currentIframe && currentIframe.contentWindow) {
        currentIframe.contentWindow.postMessage({ type: 'REQUEST_FULLSCREEN' }, '*');
      }
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    function reloadFrame() {
      if (currentIframe) {
        createMultiLayerShadowFrame(currentURL);
      }
    }

    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'LOAD_GAME') {
        const gameUrl = event.data.url;
        let fixedURL = gameUrl;
        if (gameUrl.startsWith('/')) {
          fixedURL = window.location.origin + gameUrl;
        } else if (gameUrl.includes('://') && !gameUrl.includes(window.location.origin)) {
          fixedURL = window.location.origin + '/proxy/' + encodeURIComponent(gameUrl);
        }
        currentURL = fixedURL;
        createMultiLayerShadowFrame(fixedURL);
      }
    });

    createMultiLayerShadowFrame(currentURL);
  </script>
</body>
</html>`);
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`S games - Cloudmoon InPlay Server running on http://0.0.0.0:${PORT}`);
    warmCloudmoonCache();
  });
}

startServer();
