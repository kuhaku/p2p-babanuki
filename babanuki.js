// --- 0. グローバル変数と定数 ---
let supabase;
let myName = '';
let userId = '';
let peerConnection;
let dataChannel;
let lobbyChannel; // Presence用
let signalChannel; // Broadcast用 (招待/SDP/ICE交換)
let opponentUserId = '';
let opponentName = '';
let isHost = false; // 招待した側 (ゲームのホスト)
let userStatus = 'init';  // {init | free | busy | gaming}
const SYSTEM_USER_NAME = '通知';
const SYSTEM_USER_ID = 'system';

// ゲーム共通
let currentGameType = null; // 'babanuki' or 'quoridor'
let myPlayerNum = 0; // 1 (ホスト) or 2 (ゲスト)

// ボイスレスモード
let voiceLess = false;

// ロビーチャット
let chatChannel;
let chatMessagesEl, chatInputEl, chatSendBtn;
let previousLobbyChatMsgId = '';
let previousLocalLobbyChatMsgId = '';
let onlinePlayers = new Set();
const LOBBY_NAME = 'babakatsu-lobby';
const LOBBY_CHAT_NAME = 'babakatsu-lobby-chat'
const SYGNAL_NAME = 'babakatsu-signals'

// 対戦者チャット
let gameChatChannel, gameChatMessages, gameChatInput, gameChatSend;
let roomId = null;
let previousGameChatMsgId = '';

// 再戦用フラグ
let rematchRequested = false;
let opponentRematchRequested = false;

// ゲーム終了タイマー
let gameExitTimer = null;

// ゲーム結果送信フラグ
let gameResultSent = false;

// 餃子の王将
let ohshoCounter = 0;

// 暇つぶし用画像
const GIF_ANIMES = ["misao003452.gif", "misao012134.gif", "misao056051.gif", "tanosi.gif", "tanosi2.gif"]

// 顔文字リアクション描画用
const START_FONT_SIZE = 20; // 開始時のフォントサイズ (px)
const MAX_FONT_SIZE = 250;  // 最大のフォントサイズ (px)
const GROWTH_TATE = 2; // 1フレーム（更新ごと）に大きくなる量 (px)
const ANIMATION_INTERVAL_TIME = 16; // アニメーションの更新間隔 (ms) - 約60fps相当

// 顔文字生成用
const FACELINES = [["彡", "ミ"], ["[", "]"], ["<", ">"], ["ξ", "ξ"], ["(●", "●)"], ["【", "】"], ["((", "))"], ["(Ｕ", ")"], ["(Ｕ", "U)"], ["(;´Д`)(", ")"], ["(", ")(ﾟДﾟ;)"], ["(;ﾟДﾟ)(", ")"], ["(", ")(ﾟДﾟ;)"]]
const LEFT_HANDS = ["ヽ", "Σ", "ъ", "ノ", "ヾ", "ε≡三ヽ", "<", "v", "o", "c", "σ", "┌", "┐", "🪓", "へ", "ﾍ", "∠", "💴ヽ", "💿ヽ", "🍢ヽ", "ʅ"]
const MANPU = [";", ";", ";", ";", ";", "*", "#"]
const LEFT_HANDS_IN_FACE = ["ﾉ", "ノ", "ρ"]
const LEFT_EYES = ["´", "´", "´", "ﾟ", " ﾟ", "^", "'", "`", "T", ";", "⌒", "≧", "†", "｡"]
const MOUTHS = ["Д", "ｰ", "ー", "￢", "_", "〜", "x", "ｑ", "π", "ρ", "〇", "血", "皿", "山", "口", "州", "犬", "死", "災", "Ｈ", "∇", "Ω", ")Д(", "ε", "＊", "♡", "Дﾟ;三;ﾟД", "Д^)(^Д", "Дﾟ)(ﾟД", "Д`)(ﾟД", "Д`)(;`Д", "Д`)人(´Д", "Д`)人(;`Д", "ー`)ʃ💴ヽ(´ー", "Д^)ʃ💴ヽ(;`Д", "Д^)ʃ💊ヽ(;`Д", "Д^)ﾉ⌒㊙️ヽ(;`Д", "Д^)ﾉ⌒💩(;`Д"]
const RIGHT_EYES = ["`", "`", "`", "｀", "`､", "､`", "ﾟ", "､ﾟ", "^", "^､", "'", "T", "´", "Ｔ", "T", ";", "⌒", "⌒ゞ", "≦", "†", "｡"]
const RIGHT_HANDS = ["ノ", "ﾉ", "/", "へ", "ﾍ", "v", ">", "σ", "y-~~", "o", "c", "｢", "┘", "┌", "ʃ", "＿ﾋﾟｻﾞおまちっ！", "-☆", "ﾉ⌒💊", "ﾉ⌒㊙️", "ﾉ⌒♡", "ﾉ⌒💴", "ﾉ💴", "ﾉ🍺", "ﾉ🍣", "ﾉ🍖", "ﾉ👙", "ﾉ💩", "💕", "💦"]

// HTML要素
let setupScreen, lobbyScreen, gameScreen, joinLobbyBtn, leaveGameBtn,
    nameInput, userNameEl, playerList, noPlayersMessage, noPlayersImage,
    myNameEl, opponentNameEl, statusMessage, drawnCardMessageEl, myHandContainer, opponentHandContainer,
    modalOverlay, modalContent, modalTitle, modalBody, modalButtons,
    voiceLessBtn1, voiceLessBtn2;

// ファイル送信用
let fileDataChannel, fileInputEl, fileSendBtnEl, fileStatusEl;
const CHUNK_SIZE = 16384; // 16KB
let receiveBuffer = [];
let receivedFileInfo = {};

// 接続用
const SUPABASE_URL = 'https://odkdeivaqnznhmnsewmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka2RlaXZhcW56bmhtbnNld214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjE4ODgsImV4cCI6MjA3NzM5Nzg4OH0.THFIq1oTLsYmHbdNomZQ9kA7n2gFvIfCFGGFWvxlj_s';

// WebRTC STUNサーバー設定
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// --- ババ抜き用ゲーム変数 ---
let myHand = [];
let opponentHandSize = 0;
let myTurn = false; // ババ抜き専用のターンフラグ
const SUITS = ['♥', '♦', '♠', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const JOKER = { suit: 'JOKER', rank: 'JOKER', display: 'JOKER', color: 'black' };

// --- コリドール用ゲーム変数 ---
const Q_BOARD_SIZE = 9; // 9x9 グリッド
const Q_WALL_COUNT = 10; // 各プレイヤーの壁の数
let TILE_SIZE, WALL_THICKNESS, PAWN_RADIUS, boardPixels;
let player1Pos, player2Pos;
let player1Walls, player2Walls;
let q_currentPlayer; // 1 or 2
let horizontalWalls, verticalWalls; // 8x8のboolean配列
let currentAction; // 'move', 'h_wall', 'v_wall'
let potentialWall; // { col, row, orientation }
let gameOver;


function escapeChar(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&#60;').replace(/>/g, '&#62;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\//g, '&#x2F;')
        .replace(/=/g, '&#x3D;').replace(/\+/g, '&#x2B;').replace(/\?/g, '&#x3F;');
}

// --- サウンドエンジン ---
let synth; // シンセサイザー (Tone.js)
let buzzerSynth; // ブザー音

/**
 * Tone.jsの初期化 (ユーザー操作時に呼び出す)
 */
async function initializeAudio() {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }
    // シンセサイザーを初期化
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    buzzerSynth = new Tone.FMSynth({
        oscillator: { type: "triangle" },
        envelope: {
            attack: 0.1,
            decay: 0.5,
            sustain: 1,
            release: 0.4
        },
        modulation: { type: "sine" },
        modulationEnvelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 1,
            release: 0.1
        },
        harmonicity: 1.1,
        modulationIndex: 0.5
    }).toDestination();
}

/**
 * 待合室に入ってきたときの音
 */
function playJoinSound() {
    if (!synth) return;
    try {
        const now = Tone.now();
        synth.triggerAttackRelease("E5", "8n", now);
        synth.triggerAttackRelease("C5", "4n", now + 0.3);
    } catch (e) {
        console.error("playJoinSound error:", e);
    }
}

/**
 * 新着チャット受信音
 */
function playChatNotificationSound() {
    if (!synth) return;
    try {
        const now = Tone.now();
        synth.triggerAttackRelease("D4", "8n", now);
    } catch (e) {
        console.error("playChatNotificationSound error:", e);
    }
}

/**
 * カードクリック音
 */
function playClickSound() {
    if (!synth) return;
    try {
        const now = Tone.now();
        synth.triggerAttackRelease("C4", "8n", now);
        synth.triggerAttackRelease("E4", "8n", now + 0.1);
    } catch (e) {
        console.error("playClickSound error:", e);
    }
}

/**
 * ブザー音
 */
function playBuzzerSound() {
    if (!buzzerSynth) return;
    try {
        const now = Tone.now();
        buzzerSynth.triggerAttackRelease("A2", "8n", now);;
        buzzerSynth.triggerAttackRelease("G#2", "8n", now + 0.1);
    } catch (e) {
        console.error("playBuzzerSound error:", e);
    }
}

/**
 * カード配布音 (ゲーム開始時)
 */
function playDealSound() {
    if (!synth) return;
    try {
        const now = Tone.now();
        synth.triggerAttackRelease("E5", "16n", now);
        synth.triggerAttackRelease("G5", "16n", now + 0.1);
        synth.triggerAttackRelease("C6", "16n", now + 0.2);
    } catch (e) {
        console.error("playDealSound error:", e);
    }
}

/**
 * ペア成立音
 */
function playPairSound() {
    if (!synth) return;
    try {
        const now = Tone.now();
        synth.triggerAttackRelease("C5", "8n", now);
        synth.triggerAttackRelease("G5", "8n", now + 0.1);
    } catch (e) {
        console.error("playPairSound error:", e);
    }
}

/**
 * 勝利音
 */
function playWinSound() {
    if (!synth) return;
    try {
        const now = Tone.now();
        synth.triggerAttackRelease("C5", "8n", now);
        synth.triggerAttackRelease("E5", "8n", now + 0.2);
        synth.triggerAttackRelease("G5", "8n", now + 0.4);
        synth.triggerAttackRelease("C6", "4n", now + 0.6);
    } catch (e) {
        console.error("playWinSound error:", e);
    }
}

/**
 * 敗北音
 */
function playLoseSound() {
    if (!synth) return;
    try {
        const now = Tone.now();
        synth.triggerAttackRelease("G4", "8n", now);
        synth.triggerAttackRelease("E4", "8n", now + 0.2);
        synth.triggerAttackRelease("C4", "4n", now + 0.4);
    } catch (e) {
        console.error("playLoseSound error:", e);
    }
}

/**
 * 招待受信音
 */
function playInviteSound() {
    if (!synth) return;
    try {
        const now = Tone.now();
        synth.triggerAttackRelease("A4", "8n", now);
        synth.triggerAttackRelease("C5", "8n", now + 0.2);
        synth.triggerAttackRelease("E5", "8n", now + 0.4);
        synth.triggerAttackRelease("A4", "8n", now + 0.6);
        synth.triggerAttackRelease("C5", "8n", now + 0.8);
        synth.triggerAttackRelease("E5", "8n", now + 1.0);
    } catch (e) {
        console.error("playInviteSound error:", e);
    }
}

/**
 * 招待受信音
 */
function playChatTransmissionSound() {
    if (!synth) return;
    try {
        const now = Tone.now();
        synth.triggerAttackRelease("A2", "8n", now);
    } catch (e) {
        console.error("playInviteSound error:", e);
    }
}

/**
 * リアクションボタンクリック音
 */
function playReactionClickSound(emoticon) {
    if (!synth) return;
    try {
        const now = Tone.now();
        switch (emoticon) {
            case 'ヽ(;`Д´)ﾉ':
                note = "C3";
                break;
            case '(;´Д`)':
                note = "D3";
                break;
            case 'ヽ(´ー｀)ノ':
                note = "E3";
                break;
            case '(^Д^)':
                note = "F3";
                break;
            default:
                note = "G3";
                break;
        }
        synth.triggerAttackRelease(note, "8n", now);
    } catch (e) {
        console.error("playReactionClickSound error:", e);
    }
}

function speakEmoticonReaction(emoticon) {
    switch (emoticon) {
        case 'ヽ(;`Д´)ﾉ':
            speakText("ぐぬぬっ！ぐぬぬっ！", 0.9, 0.3);
            break;
        case '(;´Д`)':
            speakText("ちょっ、待てよ！", 0.9, 0.3);
            break;
        case 'ヽ(´ー｀)ノ':
            speakText("ふふんふーん！フーン！", 1.2, 1.0);
            break;
        case '(^Д^)':
            speakText("ぎゃはぎゃはーっ！プーックス！", 1.2, 1.0);
            break;
        default:
            note = "G3";
            break;
    };
}

// 音声合成
const speechMsg = new SpeechSynthesisUtterance();
const voiceSelect = document.getElementById('voice-select');
const messageBox = document.getElementById('message-box');
let voices = [];

// 利用可能な音声の読み込み
function loadJapVoice() {
    voices = window.speechSynthesis.getVoices();

    let preferredVoice = null;

    // 日本語の音声を探す
    const japaneseVoices = voices.filter(v => v.lang.startsWith('ja-'));

    if (japaneseVoices.length > 0) {
        // 優先する日本語の音声を探す (例えば 'Kyoko', 'Mei' など、ブラウザ依存)
        preferredVoice = japaneseVoices.find(v => v.name.includes('Google') || v.name.includes('Mei') || v.name.includes('Kyoko')) || japaneseVoices[0];
    } else {
        // 日本語音声がない場合は、デフォルトか英語音声を使用
        console.log('日本語の音声が見つからなかったので英語音声にします。');
        preferredVoice = voices[0];
    }

    // 選択された音声を msg オブジェクトに設定
    if (preferredVoice) {
        speechMsg.voice = preferredVoice[0];
    }
}

// 発話する
function speakText(text, rate = 1.0, pitch = 1.0) {
    if ('speechSynthesis' in window) {
        // 既に発声中の場合はキャンセル
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }

        speechMsg.text = text;
        speechMsg.lang = 'ja-JP';
        speechMsg.rate = rate; // 速度 (感情に応じて調整)
        speechMsg.pitch = pitch; // ピッチ (デフォルト)

        speechMsg.onend = () => {
            console.log('音声合成:', text);
        };

        if (!voiceLess) speechSynthesis.speak(speechMsg);

    } else {
        console.log('エラー: お使いのブラウザはWeb Speech APIをサポートしていません。');
    }
}

// 無声モード切り替え
function toggleVoiceLess() {
    voiceLess = !voiceLess;
    let message = voiceLess ? '声有する' : '無声する';
    voiceLessBtn1.textContent = message;
    voiceLessBtn2.textContent = message;
}

// 日時フォーマッタ（%Y-%m-%d %H:%M:%S）
function formatTimestamp(ts) {
    // 0埋め
    const pad2 = (n) => String(n).padStart(2, '0');

    // ts が false/undefined/'' の場合でも現在時刻を使う
    let d;
    if (ts === undefined || ts === null || ts === '' || ts === false) {
        d = new Date();
    } else if (typeof ts === 'number') {
        d = new Date(ts);
    } else if (typeof ts === 'string') {
        const num = Number(ts);
        if (!Number.isNaN(num) && ts.trim() !== '') {
            d = new Date(num);
        } else {
            // ISO 文字列など
            d = new Date(ts);
        }
    } else {
        d = new Date();
    }
    const Y = d.getFullYear();
    const M = pad2(d.getMonth() + 1);
    const D = pad2(d.getDate());
    const h = pad2(d.getHours());
    const m = pad2(d.getMinutes());
    const s = pad2(d.getSeconds());
    return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

// --- 1. Supabase 初期化 ---
/**
 * Supabaseクライアントを初期化
 */
async function initializeSupabase() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        showModal('エラー', 'SupabaseのURLとAnonキーを両方入力してください。', [
            { text: 'はい', class: 'bg-red-500', action: hideModal }
        ]);
        return false;
    }

    try {
        // window.supabaseからcreateClientを取得
        const { createClient } = window.supabase;
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 接続テスト (簡単なクエリ)
        if (supabase) {
            return true;
        } else {
            throw new Error("クライアントの作成に失敗しました。");
        }

    } catch (error) {
        console.error("Supabase 初期化エラー:", error);
        showModal('エラー', `Supabaseの接続に失敗しました: ${error.message}`, [
            { text: 'はい', class: 'bg-red-500', action: hideModal }
        ]);
        return false;
    }
}


// --- 2. 画面制御とUIヘルパー ---

// ロビーチャットチャンネルを初期化
async function setupLobbyChat() {
    if (!supabase) return;
    // if (chatChannel) {
    //     await chatChannel.unsubscribe();
    //     chatChannel = null;
    // }

    chatChannel = supabase.channel(LOBBY_CHAT_NAME);

    // 多重登録防止
    if (!chatChannel.__listenerAdded) {
        chatChannel.__listenerAdded = true;

        chatChannel.on('broadcast', { event: 'message' }, ({ payload }) => {
            if (previousLobbyChatMsgId === payload.id) return;
            previousLobbyChatMsgId = payload.id;
            appendLobbyChatMessage(payload.name, payload.message, payload.timestamp, payload.userId === userId);
        });
    }

    chatChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('ロビーチャット接続完了');
    });
}

/**
 * 指定した画面を表示
 * @param {'setup' | 'lobby' | 'game'} screenName 
 */
function showScreen(screenName) {
    setupScreen.classList.add('hidden');
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');

    if (screenName === 'setup') {
        setupScreen.classList.remove('hidden');
        joinLobbyBtn.onclick = async () => checkUserName();
    } else if (screenName === 'lobby') {
        lobbyScreen.classList.remove('hidden');
        // ロビーチャットメッセージ送信ボタン設定
        chatSendBtn.onclick = () => sendChatMessage();
        setupLobbyChat(); // ロビーチャットを開始
    } else if (screenName === 'game') {
        gameScreen.classList.remove('hidden');
        leaveGameBtn.onclick = () => leaveGame();
    }
}

/**
 * モーダルを表示
 * @param {string} title - モーダルのタイトル
 * @param {string} body - モーダルの本文
 * @param {Array<{text: string, class: string, action: function}>} buttons - ボタン設定
 */
function showModal(title, body, buttons = []) {
    modalTitle.textContent = title;
    modalBody.textContent = body;
    modalButtons.innerHTML = ''; // ボタンをクリア

    buttons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        button.className = `text-white font-bold py-2 px-4 rounded shadow hover:opacity-80 transition duration-300 items-center ${btnInfo.class}`;
        button.onclick = btnInfo.action;
        modalButtons.appendChild(button);
    });

    modalOverlay.classList.remove('hidden');
}

/**
 * モーダルを非表示にする
 */
function hideModal() {
    modalOverlay.classList.add('hidden');
}

/**
 * ゲーム選択モーダルを表示
 */
function showGameChoiceModal(targetUserId, targetName) {
    gameChoiceModalTitle.textContent = `${targetName} を招待`;
    gameChoiceModalOverlay.classList.remove('hidden');

    gameChoiceBabanukiBtn.onclick = () => sendInvite(targetUserId, targetName, 'babanuki');
    gameChoiceQuoridorBtn.onclick = () => sendInvite(targetUserId, targetName, 'quoridor');
    gameChoiceCancelBtn.onclick = hideGameChoiceModal;
}

/**
 * ゲーム選択モーダルを非表示
 */
function hideGameChoiceModal() {
    gameChoiceModalOverlay.classList.add('hidden');
}

// --- 3. ユーザー名関連の処理 ---
/**
 * ユーザー名をランダムに生成する
 */
function generateUserName() {
    let name = '';
    let facelinePair = [];
    let parts = '';
    if (Math.random() > 0.8) {  // 20%の確率で左側の手をつける
        name += LEFT_HANDS[Math.floor(Math.random() * LEFT_HANDS.length)];
    }
    if (Math.random() > 0.9) {  // 10%の確率で輪郭を変える
        facelinePair = FACELINES[Math.floor(Math.random() * FACELINES.length)];
    } else {
        facelinePair = ["(", ")"];
    }
    name += facelinePair[0];
    if (Math.random() > 0.5) {  // 50%の確率で漫符をつける
        name += MANPU[Math.floor(Math.random() * MANPU.length)];
    }
    if (name.length > 1) {  // 左手がある場合
        parts = LEFT_EYES[Math.floor(Math.random() * LEFT_EYES.length)];
        while (name.endsWith(parts)) {
            parts = LEFT_EYES[Math.floor(Math.random() * LEFT_EYES.length)];
        }
    } else {
        let left = LEFT_EYES.concat(LEFT_HANDS_IN_FACE);
        parts = left[Math.floor(Math.random() * left.length)];
        while (name.endsWith(parts)) {
            parts = LEFT_EYES[Math.floor(Math.random() * LEFT_EYES.length)];
        }
    }
    name += parts;

    if (Math.random() > 0.6) {  // 40%の確率で口をДにする
        name += "Д";
    } else {
        name += MOUTHS[Math.floor(Math.random() * MOUTHS.length)];
    }
    name += RIGHT_EYES[Math.floor(Math.random() * RIGHT_EYES.length)]

    if (Math.random() > 0.9) {  // 10%の確率で右側に漫符をつける
        parts = MANPU[Math.floor(Math.random() * MANPU.length)];
        while (name.endsWith(parts)) {
            let rightManpu = MANPU.concat(["ヽ"]);
            parts = rightManpu[Math.floor(Math.random() * rightManpu.length)];
        }
        name += parts;
    }
    name += facelinePair[1];
    if (Math.random() > 0.8) {  // 20%の確率で右側の手をつける
        name += RIGHT_HANDS[Math.floor(Math.random() * RIGHT_HANDS.length)];
    }

    return name;
}

/**
 * ユーザー名の確認
 */
function checkUserName() {
    myName = nameInput.value.trim();

    if (!myName) {
        candidateName = generateUserName();
        showModal('⚠️ 名前が未入力です', `名前を ${candidateName} にしますか？`, [
            { text: 'いいえ', class: 'bg-gray-500', action: hideModal },
            { text: 'はい', class: 'bg-green-500', action: () => { nameInput.value = candidateName; hideModal(); } },
        ]);
    } else if (myName === SYSTEM_USER_NAME) {
        myName += '（騙り）';
    } else {
        hideModal();
    }

    if (myName) {
        initLobby(myName);
    }
}

// --- 4. ロビー機能 (Supabase Presence) ---

/**
 * 自分のPresence状態を更新するヘルパー関数
 */
function updateMyPresence() {
    if (lobbyChannel && lobbyChannel.state === 'joined') {
        // 常に完全な状態を送信する
        lobbyChannel.track({
            name: myName,
            user_id: userId,
            user_status: userStatus,
        });
    }
}

// 一意なメッセージIDを生成
function djb2Hash(str) {
    if (typeof str !== 'string' || str.length === 0) {
        return 0;
    }

    let hash = 5381; // ハッシュの初期値

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        // hash * 33 + char と等価な処理をビット演算で行う
        // (hash << 5) は hash * 32
        hash = ((hash << 5) + hash) + char;

        // 結果を32ビット整数に強制する
        hash = hash | 0;
    }

    return hash;
}

/**
 * ロビーチャットにシステム通知を送信
 * @param {string} message - 送信するメッセージ
 */
function sendLobbyNotification(message) {
    const ts = Date.now();
    const msgId = djb2Hash(SYSTEM_USER_NAME + message + SYSTEM_USER_ID);
    const notificationMessage = message;

    chatChannel.send({
        type: 'broadcast',
        event: 'message',
        payload: {
            id: msgId,
            name: SYSTEM_USER_NAME,
            message: notificationMessage,
            timestamp: ts,
            userId: SYSTEM_USER_ID
        }
    });
}

// ロビーチャット送信
function sendChatMessage(msg = '', sound = true, voice = '') {
    input = chatInputEl
    if (!msg) {
        msg = input.value.trim();
    }
    if (!msg || !chatChannel) return;

    const ts = Date.now();
    const msgId = djb2Hash(myName + msg);

    // 自分の投稿を即時表示
    appendLobbyChatMessage(myName, msg, ts, true);

    chatChannel.send({
        type: 'broadcast',
        event: 'message',
        payload: { id: msgId, name: myName, message: msg, timestamp: ts, userId }
    });

    if (sound) playChatNotificationSound();  // チャット送信音を鳴らす

    if (voice) speakText(voice);  // 音声合成で読み上げる

    input.value = '';
}

/**
 * ロビーチャットメッセージを画面に表示
 */
function appendLobbyChatMessage(sender, message, timestamp, isSelf = false) {

    // 重複メッセージ対策
    hash = djb2Hash(sender + message);
    if (hash === previousLocalLobbyChatMsgId) return;
    previousLocalLobbyChatMsgId = hash;

    // 常にロビーチャットコンテナには追記する
    const lobbyContainer = document.getElementById('chat-messages');

    // ロビーコンテナがなければ早期リターン
    if (!lobbyContainer) return;

    const msgEl = document.createElement('div');
    msgEl.className = 'text-left mb-1 text-white';

    const tsText = formatTimestamp(timestamp);
    const timeHTML = `<span class='text-xs text-gray-300 ml-2'>${tsText}</span>`;

    const escapedSender = escapeChar(sender);
    const escapedMessage = escapeChar(message);

    if (sender === SYSTEM_USER_NAME) {
        msgEl.innerHTML = `<span class='font-semibold text-green-100'>${escapedSender}</span>: ${escapedMessage}${timeHTML}`;
    } else {
        msgEl.innerHTML = isSelf
            ? `<span class='font-semibold text-yellow-300'>${escapedSender}</span>: ${escapedMessage}${timeHTML}`
            : `<span class='font-semibold text-white'>${escapedSender}</span>: ${escapedMessage}${timeHTML}`;
    }
    if (!isSelf) {
        playChatNotificationSound();  // 自分の投稿でなければ通知を鳴らす
    }

    lobbyContainer.insertBefore(msgEl, lobbyContainer.firstChild);
}

/**
 * 餃子の王将
 */
function gyouzaNoOhSho() {
    ohshoCounter += 1;
    switch (ohshoCounter) {
        case 1:
            sendChatMessage('将', sound = false, voice = 'しょう');
            button = document.getElementById("oh-button");
            button.classList.remove("hidden");
            break;
        case 2:
            sendChatMessage('王', sound = false, voice = '王');
            button = document.getElementById("no-button");
            button.classList.remove("hidden");
            break;
        case 3:
            sendChatMessage('の', sound = false, voice = 'の');
            button = document.getElementById("za-button");
            button.classList.remove("hidden");
            break;
        case 4:
            sendChatMessage('子', sound = false, voice = 'ざ');
            button = document.getElementById("gyou-button");
            button.classList.remove("hidden");
            break;
        case 5:
            sendChatMessage('餃', sound = false, voice = 'ぎょう');
            let idPrefixes = ['oh', 'no', 'za', 'gyou'];
            idPrefixes.forEach(idPrefix => {
                let button = document.getElementById(`${idPrefix}-button`);
                button.classList.add("hidden");
            });
            ohshoCounter = 0;
            break;
        default:
            ohshoCounter = 0;
            break;
    }
}

function soshi() {
    sendChatMessage('阻止(;`Д´)', sound = false, voice = '阻止！');
}

async function initLobby(myName) {
    // オーディオコンテキストの初期化
    await initializeAudio();

    // 音声合成リスト読み込み
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadJapVoice;
    } else {
        // Chromeなど、onvoiceschangedイベントをすぐに発火させないブラウザ対策
        setTimeout(loadJapVoice, 100);
    }

    userNameEl.textContent = `名前: ${myName}`;

    // Supabaseクライアントの初期化
    const success = await initializeSupabase();
    if (!success) {
        return;
    }

    // ユーザーIDを簡易的に生成
    if (!userId) {
        userId = `user_${Math.random().toString(36).substring(2, 11)}`;
    }

    // シグナルチャンネルのセットアップを試みる
    try {
        await setupSignalChannel();
    } catch (error) {
        console.error("シグナルチャンネルのセットアップに失敗:", error);
        showModal('エラー', `シグナルチャンネルへの接続に失敗しました: ${error.message}`, [
            { text: '拝承', class: 'bg-red-500', action: hideModal }
        ]);
        return; // 失敗したらロビー参加を中断
    }

    if (lobbyChannel) {
        if (lobbyChannel.state === 'joined') {
            showScreen('lobby'); // 画面だけ表示
            return;
        }
        await lobbyChannel.unsubscribe();
    }

    // ロビーチャンネルに参加
    lobbyChannel = supabase.channel(LOBBY_NAME, {
        config: {
            presence: {
                key: userId, // PresenceキーにUserIDを使用
            },
        },
    });

    // Presenceイベントの購読
    lobbyChannel.on('presence', { event: 'sync' }, () => {
        const newState = lobbyChannel.presenceState();
        showActiveLobbyUsersInGame(newState)  // 対戦中画面
        renderLobby(newState);  // ロビー画面
        notifyPlayerChanges(newState);
    });
    // 誰かが参加した時
    lobbyChannel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // ハンドリングが難しいのでここで処理しない
    });
    // 誰かが退出した時
    lobbyChannel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // ハンドリングが難しいのでここで処理しない
    });

    // チャンネルの購読を開始
    lobbyChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            // 購読成功したら、自分の情報をPresenceで送信
            updateMyPresence(); // ヘルパー関数を使用
            showScreen('lobby'); // ロビー画面を表示
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // ユーザーが意図的に退出した場合はエラーを表示しないようにする
            if (!lobbyChannel || lobbyChannel.state !== 'closed') {
                showModal('エラー', `ロビーへの参加に失敗しました: ${status}`, [
                    { text: '拝承', class: 'bg-red-500', action: hideModal }
                ]);
                showScreen('setup'); // セットアップ画面に戻す
            }
        }
    });
};

/**
 * 来る者去る者を告げる関数
 * @param {Object} presenceState - SupabaseのPresenceステート
 */
function notifyPlayerChanges(presenceState) {
    currentOnlinePlayers = new Set();
    for (const key in presenceState) {
        const presences = presenceState[key];

        if (presences && presences.length > 0) {
            const presence = presences[0];
            currentOnlinePlayers.add(`${presence.user_id}\t${presence.name}`);
        }
    }

    if (onlinePlayers.size > 0) {
        let nameOfChangedUser = '';

        currentOnlinePlayers.forEach(user => {
            if (!onlinePlayers.has(user)) {
                nameOfChangedUser = user.split("\t")[1];
                sendLobbyNotification(`${nameOfChangedUser} が入室しました`);
            }
        });

        onlinePlayers.forEach(user => {
            if (!currentOnlinePlayers.has(user)) {
                nameOfChangedUser = user.split("\t")[1];
                sendLobbyNotification(`${nameOfChangedUser} が退出しました`);
            }
        });
    }
    onlinePlayers = currentOnlinePlayers;
}

/**
 * ロビーのプレイヤー一覧を描画
 * @param {Object} presenceState - SupabaseのPresenceステート
 */
function renderLobby(presenceState) {
    // おもてなしの挨拶
    // speakText('Windowsを起動するわよ！', 1.1, 1.0);

    playerList.innerHTML = ''; // リストをクリア
    noPlayersMessage.classList.add('hidden');
    noPlayersImage.classList.add('hidden');

    let playerCount = 0;

    for (const key in presenceState) {
        const presences = presenceState[key];

        // プレイヤーがロビーにいることを確認し、配列の最初の要素を参照
        if (presences && presences.length > 0) {
            const presence = presences[0];

            if (presence.user_id === userId) {
                continue; // 自分は表示しない
            }

            if (!presence.name || !presence.user_id) {
                console.warn("不完全なPresenceデータが検出されました:", presence);
                continue; // 無効なデータはスキップ
            }

            playerCount++;
            const playerEl = document.createElement('div');
            playerEl.className = 'flex justify-between items-center p-3 bg-green-50 rounded-lg shadow-sm border border-green-200';

            const playerNameContainer = document.createElement('div');
            playerNameContainer.className = 'flex items-center space-x-2';

            const playerName = document.createElement('span');
            playerName.textContent = presence.name;
            playerName.className = 'font-semibold md:text-lg text-sm text-gray-700';
            playerNameContainer.appendChild(playerName);

            let button;

            if (presence.user_status === 'gaming') {
                // 対戦中の場合
                button = document.createElement('button');
                button.textContent = `対戦中`;
                button.className = 'bg-gray-400 text-white font-bold md:text-base text-xs py-1 md:px-4 px-2 rounded-md shadow transition duration-300';
                button.disabled = "disabled";
            } else {
                // 対戦可能の場合
                button = document.createElement('button');
                button.textContent = '果たし状';
                button.className = 'bg-green-600 text-white font-bold md:text-base text-xs py-1 md:px-4 px-2 rounded-md shadow hover:bg-green-700 transition duration-300';
                button.onclick = () => showGameChoiceModal(presence.user_id, presence.name); // ゲーム選択モーダルを表示
            }

            playerEl.appendChild(playerNameContainer);
            playerEl.appendChild(button);
            playerList.appendChild(playerEl);
        }
    }

    // プレイヤーリストが空の場合
    if (playerCount === 0) {
        noPlayersMessage.classList.remove('hidden');
        imageFileName = GIF_ANIMES[Math.floor(Math.random() * GIF_ANIMES.length)];
        noPlayersImage.innerHTML = `<img src="img/${imageFileName}">`;
        noPlayersImage.classList.remove('hidden');
    }
}

async function leaveLobby() {
    if (lobbyChannel) {
        // unsubscribeが完了するまで待機
        await lobbyChannel.unsubscribe();
        lobbyChannel = null; // 完了後に null に設定
    }
    if (signalChannel) {
        await signalChannel.unsubscribe();
        signalChannel = null;
    }
    showScreen('setup');
};

// --- 6. WebRTC シグナリング (Supabase Broadcast) ---

/**
 * シグナリング用チャンネルのセットアップ (Broadcast)
 */
async function setupSignalChannel() {
    if (signalChannel) {
        // 状態に関わらず購読解除
        await signalChannel.unsubscribe();
        signalChannel = null; // 一旦クリア
    }

    // チャンネル名は固定 (全ユーザ共通)
    signalChannel = supabase.channel(SYGNAL_NAME);

    // ブロードキャストイベントをリッスン
    // (チャンネルを新規作成したので多重登録の心配はない)
    signalChannel.on('broadcast', { event: 'webrtc' }, ({ payload }) => {
        // 自分宛てのメッセージか確認
        if (payload.targetUserId !== userId) {
            return; // 自分宛てでなければ無視
        }

        switch (payload.type) {
            case 'invite':
                handleInvite(payload);
                break;
            case 'accept':
                handleAccept(payload);
                break;
            case 'offer':
                handleOffer(payload);
                break;
            case 'answer':
                handleAnswer(payload);
                break;
            case 'ice-candidate':
                handleIceCandidate(payload);
                break;
            case 'reject':
                handleReject(payload);
                break;
            case 'invite-cancel':
                handleInviteCancel(payload);
                break;
            case 'hangup':
                handleHangup();
                break;
        }
    });

    // チャンネルの購読 (Promiseでラップ)
    return new Promise((resolve, reject) => {
        signalChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                reject(new Error(`シグナルチャンネルの購読に失敗: ${status}`));
            }
        });
    });
}

/**
 * ブロードキャスト送信ヘルパー
 * @param {Object} payload - 送信するデータ
 */
function sendSignal(payload) {
    if (!signalChannel || signalChannel.state !== 'joined') {
        return;
    }
    signalChannel.send({
        type: 'broadcast',
        event: 'webrtc',
        payload: payload
    });
}

/**
 * ゲーム終了時にロビーに戻る
 */
function exitToLobby() {
    hideModal();

    // 勝敗結果がまだ送信されていない場合（＝途中終了）に無効試合を通知
    if (!gameResultSent && opponentName) { // opponentName がいる＝対戦中だった
        sendLobbyNotification(`${myName} と ${opponentName} の対戦は無効試合となりました`);
    }

    // 相手に切断を通知 (相手がまだ接続している場合に備える)
    if (opponentUserId) {
        sendSignal({ type: 'hangup', targetUserId: opponentUserId });
    }

    if (userStatus !== 'free') {
        userStatus = "free";
        updateMyPresence();
    }

    // 接続をクリーンアップ
    cleanupConnection(true); // ロビーに戻る
}

// 6.1 招待 (ホスト -> ゲスト)
/**
 * 招待シグナルを送信（ゲーム選択モーダルから呼ばれる）
 */
function sendInvite(targetUserId, targetName, gameType) {
    hideGameChoiceModal(); // モーダルを閉じる

    opponentUserId = targetUserId;
    opponentName = targetName;
    isHost = true;
    currentGameType = gameType; // 選択されたゲームタイプをセット
    myPlayerNum = 1; // ホストはPlayer 1

    sendSignal({
        type: 'invite',
        targetUserId: opponentUserId, // ゲスト宛て
        senderUserId: userId,
        senderName: myName,
        gameType: currentGameType // ゲームタイプを追加
    });

    if (userStatus !== 'busy') {
        userStatus = 'busy';
        updateMyPresence();
    }
    const gameName = gameType === 'babanuki' ? 'ババ抜き' : 'コリドール';
    showModal('招待中', `${targetName} を ${gameName} に誘ってます……`, [
        { text: 'やっぱやめる', class: 'bg-gray-500', action: cancelInvite }
    ]);
}

/**
 * 招待したけどやっぱキャンセル
 * (ホストがゲストを誘っておきながらホスト側都合でキャンセル)
 */
function cancelInvite() {
    if (!opponentUserId) return;

    // ゲストにキャンセルシグナルを送信
    sendSignal({
        type: 'invite-cancel',
        targetUserId: opponentUserId, // ゲスト宛て
        senderUserId: userId
    });

    // 自分の状態をリセット
    if (userStatus !== 'free') {
        userStatus = "free";
        updateMyPresence();
    }
    hideModal();
    resetGameVariables();
}

// 6.2 招待受信 (ゲスト)
function handleInvite(payload) {
    // ゲーム中や招待中は無視
    if (peerConnection || !userStatus === 'free') {
        sendSignal({
            type: 'reject',
            targetUserId: payload.senderUserId, // ホスト宛て
            reason: 'busy'
        });
        return;
    }

    opponentUserId = payload.senderUserId;
    opponentName = payload.senderName;
    isHost = false;
    currentGameType = payload.gameType; // ゲームタイプをセット
    myPlayerNum = 2; // ゲストはPlayer 2

    if (userStatus !== 'busy') {
        userStatus = 'busy';
        updateMyPresence();
    }

    // 招待受信音を鳴らす
    playInviteSound();

    const gameName = currentGameType === 'babanuki' ? 'ババ抜き' : 'コリドール';
    showModal('挑戦者現る！', `${payload.senderName}から ${gameName} のお誘いがきました`, [
        { text: '拒否', class: 'bg-red-500', action: () => rejectInvite(payload.senderUserId) },
        { text: '許可', class: 'bg-green-600', action: acceptInvite },
    ]);
}

/**
 * 招待拒否 (ゲスト -> ホスト)
 * @param {string} targetUserId - ホストのユーザーID
 */
function rejectInvite(targetUserId) {
    // ホストに拒否シグナルを送信
    sendSignal({
        type: 'reject',
        targetUserId: targetUserId,
        reason: 'rejected'
    });

    // 自分の状態をリセット
    if (userStatus !== 'free') {
        userStatus = "free";
        updateMyPresence();
    }
    resetGameVariables();

    hideModal();
    // ロビー画面に戻る
    showScreen('lobby');
}

// 6.4 ホストが招待拒否を受信したとき
function handleReject(payload) {
    resetGameVariables();
    if (userStatus !== 'free') {
        userStatus = "free";
        updateMyPresence();
    }

    const reasonText = payload.reason === 'busy' ? '相手は現在取り込み中です。' : '相手に拒否されました。';
    showModal('招待失敗', reasonText, [
        { text: '拝承', class: 'bg-gray-500', action: hideModal }
    ]);
}

/**
 * ゲストが招待キャンセルを受信したとき
 */
function handleInviteCancel(payload) {
    if (modalOverlay.classList.contains('hidden') === false) {
        hideModal();
    }
    // 自分が招待を受けて 'busy' 状態であり、まだゲームが始まっていない（peerConnectionがない）場合のみ処理
    if (userStatus === 'busy' && !peerConnection && opponentUserId === payload.senderUserId) {
        // 自分の状態をリセット
        resetGameVariables();
        if (userStatus !== 'free') {
            userStatus = "free";
            updateMyPresence();
        }

        // 招待モーダルを閉じて、キャンセル通知モーダルを表示
        showModal('招待キャンセル', `${opponentName} が招待をブッチしました`, [
            { text: '拝承', class: 'bg-gray-500', action: hideModal }
        ]);
    }
}

// 6.5 招待承認 (ゲスト -> ホスト)
function acceptInvite() {
    hideModal();
    setupPeerConnection(); // ゲスト側

    sendSignal({
        type: 'accept',
        targetUserId: opponentUserId, // ホスト宛て
        senderUserId: userId,
        senderName: myName,
        gameType: currentGameType // ゲームタイプを返信
    });

    if (userStatus !== 'gaming') {
        userStatus = 'gaming';
        updateMyPresence();
    }

    // ゲーム画面に遷移
    showScreen('game');
    setupGameUI();
}

// 6.6 招待承認の受信 (ホスト)
function handleAccept(payload) {
    hideModal(); // 「招待中」モーダルを閉じる

    // 招待を承認してきた相手の情報をペイロードから正しく設定する
    opponentUserId = payload.senderUserId;
    opponentName = payload.senderName;
    currentGameType = payload.gameType; // 相手が合意したゲームタイプをセット

    setupPeerConnection(); // ホスト側

    // ホストがOfferを作成
    createOffer();

    // ロビーチャットに通知
    const gameName = currentGameType === 'babanuki' ? 'ババ抜き' : 'コリドール';
    sendLobbyNotification(`${myName} と ${opponentName} の ${gameName} 対戦開始`);

    if (userStatus !== 'gaming') {
        userStatus = 'gaming';
        updateMyPresence();
    }

    // ゲーム画面に遷移
    showScreen('game');
    setupGameUI();
}

// 6.7 Offer作成 (ホスト)
async function createOffer() {
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        sendSignal({
            type: 'offer',
            targetUserId: opponentUserId, // ゲスト宛て
            sdp: peerConnection.localDescription
        });
    } catch (error) {
        console.error("Offerの作成に失敗:", error);
    }
}

// 6.8 Offer受信 (ゲスト)
async function handleOffer(payload) {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        sendSignal({
            type: 'answer',
            targetUserId: opponentUserId, // ホスト宛て
            sdp: peerConnection.localDescription
        });
    } catch (error) {
        console.error("Offerの処理またはAnswerの作成に失敗:", error);
    }
}

// 6.9 Answer受信 (ホスト)
async function handleAnswer(payload) {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    } catch (error) {
        console.error("Answerの処理に失敗:", error);
    }
}

// 6.10 ICE候補の交換 (両方)
function handleIceCandidate(payload) {
    try {
        if (payload.candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
    } catch (error) {
        console.error("ICE候補の追加に失敗:", error);
    }
}

// 6.11 ゲーム終了・切断 (どちらか)
function leaveGame() {
    // キュー破棄の確認
    showModal('確認', '本当にゲームを終了しますか？', [
        { text: 'キャンセル', class: 'bg-gray-500', action: hideModal },
        {
            text: '終了する', class: 'bg-red-600', action: () => {
                // 終了を選択した場合、即座にロビーに戻る
                exitToLobby();
            }
        },
    ]);
};

function handleHangup() {
    // 自分がすでにゲーム中でない状態なら何もしない
    if (userStatus !== 'gaming') {
        return;
    }

    // 接続終了時に即座にゲーム状態を更新
    if (userStatus !== 'free') {
        userStatus = "free";
        updateMyPresence();
    }

    // カウントダウンモーダルを表示
    startExitCountdown('接続終了', '相手がゲームから退出しました。');
}


// --- 7. WebRTC 接続セットアップ ---

/**
 * RTCPeerConnectionのセットアップ
 */
function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // ICE候補が見つかった時のリスナー
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sendSignal({
                type: 'ice-candidate',
                targetUserId: opponentUserId, // 相手宛て
                candidate: event.candidate
            });
        }
    };

    // 接続状態の監視
    peerConnection.onconnectionstatechange = (event) => {
        if (peerConnection.connectionState === 'connected') {
            statusMessage.textContent = "接続完了！ゲーム開始を待っています...";
        } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
            // 相手が予期せず切断した場合
            handleHangup();
        }
    };

    // ホスト側がDataChannelを作成
    if (isHost) {
        dataChannel = peerConnection.createDataChannel('gameData');
        setupDataChannelListeners();
        fileDataChannel = peerConnection.createDataChannel('fileTransfer');
        setupFileDataChannelListeners(); // ファイル送信用リスナー
    } else {
        // ゲスト側はDataChannelを待機
        peerConnection.ondatachannel = (event) => {
            const channel = event.channel;
            if (channel.label === 'gameData') {
                dataChannel = channel;
                setupDataChannelListeners();
            } else if (channel.label === 'fileTransfer') {
                fileDataChannel = channel;
                setupFileDataChannelListeners();
            }
        };
    }
}

/**
 * DataChannelのイベントリスナー設定 (共通)
 */
function setupDataChannelListeners() {
    dataChannel.onopen = () => {
        if (isHost) {
            // ホストがゲームを開始する
            if (currentGameType === 'babanuki') {
                initializeBabanukiGame();
            } else if (currentGameType === 'quoridor') {
                initQuoridorGame(); // ホストがコリドールを初期化
            }
            // ホスト側のみ roomId を生成・送信
            createRoomAndShare();
            // 自分側のチャットも初期化
            if (roomId) {
                setupGameChat(roomId);
            }
        };
    };

    dataChannel.onclose = () => {
        handleHangup(); // どちらかが切断したらゲーム終了
    };

    dataChannel.onerror = (error) => {
        console.error("Data Channel エラー:", error);
    };

    // メッセージ受信処理
    dataChannel.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        // gameTypeに基づいて処理を振り分け
        if (msg.gameType === 'babanuki') {
            handleBabanukiData(msg);
        } else if (msg.gameType === 'quoridor') {
            handleQuoridorData(msg);
        } else {
            // ゲームタイプが不明な共通メッセージ（チャットルームIDなど）
            switch (msg.type) {
                case 'roomId':
                    roomId = msg.roomId;
                    // ゲスト側も受信直後にチャット初期化
                    try {
                        if (roomId) {
                            setupGameChat(roomId);
                        }
                    } catch (err) {
                        console.error('setupGameChat呼び出しエラー:', err);
                    }
                    break;
                case 'emoticon-reaction':
                    emoticon = msg.emoticon;
                    renderEmoticonReaction(emoticon);
                    break;
                case 'voice-reaction':
                    text = msg.message;
                    pitch = msg.pitch;
                    rate = msg.rate;
                    speakText(text, pitch, rate);
                    break;
                // ババ抜きのリマッチリクエストはゲームタイプを付与していなかったので、
                // 互換性のためにここで処理する
                case 'rematch-request':
                    handleRematchRequest();
                    break;
                case 'rematch-decline':
                    handleRematchDecline();
                    break;
                default:
                    console.warn("未定義のメッセージタイプ（ゲームタイプ無し）:", msg);
                    break;
            }
        };
    }
}

// ファイル送信用リスナー
/**
 * File DataChannelのイベントリスナー設定 (共通)
 */
function setupFileDataChannelListeners() {
    fileDataChannel.binaryType = 'arraybuffer'; // バイナリタイプをArrayBufferに設定

    fileDataChannel.onopen = () => {
        console.log("File Data Channel OPEN");
        // ファイル送受信UIを有効化
        if (fileInputEl && fileSendBtnEl) {
            fileInputEl.disabled = false;
            fileSendBtnEl.disabled = false;
            fileSendBtnEl.onclick = sendFile; // 送信ボタンのクリックイベントを設定
            fileStatusEl.textContent = 'ファイル送信の準備ができました。';
        }
    };

    fileDataChannel.onclose = () => {
        console.log("File Data Channel CLOSE");
        // UIを無効化
        if (fileInputEl && fileSendBtnEl) {
            fileInputEl.disabled = true;
            fileSendBtnEl.disabled = true;
            fileStatusEl.textContent = 'ファイル接続が切れました。';
        }
    };

    fileDataChannel.onerror = (error) => {
        console.error("File Data Channel エラー:", error);
    };

    // メッセージ受信処理
    fileDataChannel.onmessage = (event) => {
        handleFileMessage(event.data);
    };
}

/**
 * ファイル送信ボタンが押されたときの処理
 */
function sendFile() {
    const file = fileInputEl.files[0];
    if (!file) {
        fileStatusEl.textContent = 'ファイルが選択されていません。';
        return;
    }

    fileStatusEl.textContent = `送信中: ${file.name} (0%)`;

    // 1. ファイル情報 (メタデータ) を送信
    fileDataChannel.send(JSON.stringify({
        type: 'start',
        name: file.name,
        size: file.size,
        fileType: file.type
    }));

    // 2. ファイル本体をチャンクで送信
    const reader = new FileReader();
    let offset = 0;

    reader.onload = (e) => {
        const buffer = e.target.result;
        try {
            fileDataChannel.send(buffer); // ArrayBufferを送信
            offset += buffer.byteLength;

            const progress = Math.round((offset / file.size) * 100);
            fileStatusEl.textContent = `送信中: ${file.name} (${progress}%)`;

            if (offset < file.size) {
                readSlice(offset); // 次のチャンクを読み込む
            } else {
                // 3. 送信完了を通知
                fileDataChannel.send(JSON.stringify({ type: 'end' }));
                fileStatusEl.textContent = `送信完了: ${file.name}`;
                fileInputEl.value = ''; // 入力をクリア
            }
        } catch (error) {
            console.error("File send error:", error);
            fileStatusEl.textContent = `送信エラー: ${error.message}`;
        }
    };

    reader.onerror = (err) => {
        console.error("File reading error:", err);
        fileStatusEl.textContent = `ファイル読み込みエラー: ${err}`;
    }

    const readSlice = (o) => {
        const slice = file.slice(o, o + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
    };

    readSlice(0); // 最初のチャンクを読み込む
}

/**
 * ファイルデータ受信時の処理
 * @param {ArrayBuffer | string} data
 */
function handleFileMessage(data) {
    // メッセージが文字列かバイナリかで処理を分岐
    if (typeof data === 'string') {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'start') {
                // 受信バッファをリセット
                receiveBuffer = [];
                receivedFileInfo = msg;
                fileStatusEl.textContent = `受信中: ${msg.name}`;
            } else if (msg.type === 'end') {
                // ファイル受信完了
                const receivedBlob = new Blob(receiveBuffer, { type: receivedFileInfo.fileType });

                // ダウンロードリンクを作成
                const url = URL.createObjectURL(receivedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = receivedFileInfo.name;
                a.textContent = `ダウンロード: ${receivedFileInfo.name}`;
                a.className = "text-green-400 hover:text-green-300 underline";

                // 既存のリンクがあれば置き換え、なければ追加
                const existingLink = fileStatusEl.querySelector('a');
                if (existingLink) {
                    fileStatusEl.replaceChild(a, existingLink);
                } else {
                    fileStatusEl.textContent = ''; // 「受信中」のテキストをクリア
                    fileStatusEl.appendChild(a);
                }

                // メモリ解放
                receiveBuffer = [];
                receivedFileInfo = {};
            }
        } catch (e) {
            console.error("Failed to parse JSON message:", e, data);
        }
    } else if (data instanceof ArrayBuffer) {
        // ファイルチャンクを受信
        receiveBuffer.push(data);

        // 進捗表示 (簡易版)
        if (receivedFileInfo.size) {
            const receivedSize = receiveBuffer.reduce((acc, chunk) => acc + chunk.byteLength, 0);
            const progress = Math.round((receivedSize / receivedFileInfo.size) * 100);
            fileStatusEl.textContent = `受信中: ${receivedFileInfo.name} (${progress}%)`;
        }
    } else {
        console.warn("Unknown data type received:", data);
    }
}

/**
 * 接続とゲーム変数をリセット
 * @param {boolean} [shouldShowLobby=true] - 実行後にロビー画面を表示するか
 */
function cleanupConnection(shouldShowLobby = true) {
    // ゲーム終了タイマーを停止
    if (gameExitTimer) {
        clearInterval(gameExitTimer);
        gameExitTimer = null;
    }

    if (dataChannel) {
        dataChannel.close();
        dataChannel = null;
    }

    if (fileDataChannel) {
        fileDataChannel.close();
        fileDataChannel = null;
    }

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    resetGameVariables();
    hideModal();

    if (shouldShowLobby) {
        showScreen('lobby'); // ロビーに戻る
    }

    statusMessage.textContent = "接続待機中...";
    statusMessage.classList.add('animate-pulse');

    // UIを隠す
    if (babanukiUI) babanukiUI.classList.add('hidden');
    if (quoridorUI) quoridorUI.classList.add('hidden');

    // ファイルUIをリセット
    if (fileInputEl) fileInputEl.disabled = true;
    if (fileSendBtnEl) fileSendBtnEl.disabled = true;
    if (fileStatusEl) fileStatusEl.textContent = '';
    if (fileInputEl) fileInputEl.value = '';
    receiveBuffer = [];
    receivedFileInfo = {};
}

/**
 * ゲーム関連の変数をリセット
 */
function resetGameVariables() {
    opponentUserId = '';
    opponentName = '';
    // 共通
    currentGameType = null;
    myPlayerNum = 0;

    // ババ抜き
    myTurn = false;
    myHand = [];
    opponentHandSize = 0;

    // コリドール
    player1Pos = null;
    player2Pos = null;
    q_currentPlayer = 0;
    horizontalWalls = null;
    verticalWalls = null;
    gameOver = false;
    currentAction = 'move';

    // 再戦フラグをリセット
    rematchRequested = false;
    opponentRematchRequested = false;

    gameResultSent = false; // 結果送信フラグをリセット
}

// ホストがroomIdを生成し、相手に送信する
async function createRoomAndShare() {
    roomId = crypto.randomUUID(); // 一意なルームID生成

    // 相手（ゲスト）にシグナリングを通じてroomIdを送る
    if (dataChannel && dataChannel.readyState === 'open') {
        sendData({
            type: 'roomId',
            roomId: roomId, // 対戦部屋チャットID
        }, false); // gameTypeを付与しない共通メッセージ
    }
}

// 対戦部屋チャット初期化
function initGameChatElements() {
    gameChatMessages = document.getElementById('game-chat-messages');
    gameChatInput = document.getElementById('game-chat-input');
    gameChatMessages.innerHTML = '';

    if (gameChatSend && !gameChatSend.__listenerAdded) {
        gameChatSend.__listenerAdded = true;
    }
}

// 対戦部屋チャットメッセージを画面に表示
function appendGameChatMessage(sender, message, timestamp, isSelf = false) {
    if (typeof message === 'string') {
        message = escapeChar(message);
    } else {
        message = JSON.stringify(message);
    }
    const escapedSender = escapeChar(sender);

    const el = document.createElement('div');
    el.className = 'text-left text-white mb-1';
    t = formatTimestamp(new Date(timestamp || Date.now()));
    const timeHTML = `<span class='text-xs text-gray-500 ml-2'>${t}</span>`;
    el.innerHTML = isSelf
        ? `<span class='font-semibold text-yellow-300'>${escapedSender}</span>: ${message}${timeHTML}`
        : `<span class='font-semibold text-white'>${escapedSender}</span>: ${message}${timeHTML}`;
    gameChatMessages.insertBefore(el, gameChatMessages.firstChild);
}

// 対戦部屋チャットチャンネル初期化
async function setupGameChat(roomId) {
    if (!supabase || !roomId) return;

    if (gameChatChannel) {
        await gameChatChannel.unsubscribe();
        gameChatChannel = null;
    }

    gameChatChannel = supabase.channel(`game-${roomId}-chat`);
    initGameChatElements();

    gameChatChannel.on('broadcast', { event: 'message' }, ({ payload }) => {
        if (previousGameChatMsgId === payload.id) return;
        previousGameChatMsgId = payload.id;
        if (payload.userId === userId) return;
        appendGameChatMessage(payload.name, payload.message, payload.timestamp, false);
    });

    gameChatChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('対戦チャット接続完了');
    });
}

// 対戦部屋チャットにメッセージ送信
function sendGameChatMessage(msg = null) {
    if (msg === null) {
        gameChatInput = document.getElementById('game-chat-input');
        msg = gameChatInput.value.trim();
        if (msg) {
            // チャット送信音を鳴らす
            playChatTransmissionSound();
        }
    }
    if (!msg || !gameChatChannel) return;

    const ts = Date.now();
    const msgId = djb2Hash(userId + msg)

    appendGameChatMessage(myName, msg, ts, true);

    gameChatChannel.send({
        type: 'broadcast',
        event: 'message',
        payload: { id: msgId, name: myName, message: msg, timestamp: ts, userId }
    });

    gameChatInput.value = '';
}

// ロビーにいる対戦中でないユーザー一覧と人数を表示
async function showActiveLobbyUsersInGame(presenceState) {
    let playerNames = [];
    try {
        for (const key in presenceState) {
            const presences = presenceState[key];

            // 配列の最初の要素を参照
            if (presences.length > 0) {
                const presence = presences[0];

                if (presence.user_id === userId) {
                    continue; // 自分は表示しない
                }

                if (!presence.name || !presence.user_id) {
                    console.warn("不完全なPresenceデータが検出されました:", presence);
                    continue; // 無効なデータはスキップ
                }

                if (presence.user_status !== 'gaming') {
                    // プレイ中のユーザーでなければユーザー一覧に加える
                    playerNames.push(presence.name);
                }
            }
        }
        const listEl = document.getElementById('lobby-user-list');
        const countEl = document.getElementById('lobby-user-count');

        listEl.innerHTML = '';
        playerNames.forEach(playerName => {
            const li = document.createElement('li');
            li.textContent = playerName;
            li.className = "inline-block text-white m-1 before:content-['・']";
            listEl.appendChild(li);
        });

        countEl.textContent = `人数: ${playerNames.length}名`;
    } catch (e) {
        console.error('ロビー情報取得エラー:', e);
        document.getElementById('lobby-user-count').textContent = '取得に失敗しました';
    }
}

/**
 * 顔文字リアクションの描画
 */
function renderEmoticonReaction(emoticon) {
    let emoticonReactionField = document.getElementById('emoticon-reaction-field');
    let animationInterval = null; // アニメーションのIDを管理する変数
    let currentSize = START_FONT_SIZE; // 現在のフォントサイズ (px)

    // アニメーションが実行中なら新しいアニメーションを開始せず処理を終了
    if (animationInterval) {
        return;
    }

    // テキストのサイズを初期値に戻す
    emoticonReactionField.innerHTML = emoticon;
    emoticonReactionField.style.fontSize = `${currentSize}px`;

    // テキストを表示状態にする
    emoticonReactionField.classList.remove('hidden');

    // 拡大アニメーションを開始
    // setIntervalは、指定した時間(intervalTime)ごとに関数を繰り返し実行
    animationInterval = setInterval(() => {

        // フォントサイズを大きくする
        currentSize += GROWTH_TATE;
        emoticonReactionField.style.fontSize = `${currentSize}px`;

        // 最大サイズに達した場合
        if (currentSize >= MAX_FONT_SIZE) {

            // アニメーションを停止
            clearInterval(animationInterval);
            animationInterval = null; // IDをリセットして、次のクリックに備える

            // テキストを非表示にする
            emoticonReactionField.classList.add('hidden');
        }
    }, ANIMATION_INTERVAL_TIME);
}

/**
 * 顔文字リアクションボタン押したら通知する
 */
function sendReaction(text, writingToChat = true) {
    if (dataChannel && dataChannel.readyState === 'open') {
        playReactionClickSound(text);
        sendData({
            type: 'emoticon-reaction',
            emoticon: text
        }, false); // gameTypeを付与しない共通メッセージ
        if (writingToChat) {
            sendGameChatMessage(text);
        }
    }
}

/**
 * 音声リアクションボタン押したら送信する
 */
function sendVoiceReaction(text, pitch = 1.0, rate = 1.0) {
    if (dataChannel && dataChannel.readyState === 'open') {
        sendData({
            type: 'voice-reaction',
            message: text,
            pitch: pitch,
            rate: rate
        }, false); // gameTypeを付与しない共通メッセージ
    }
}

function printTurnStatus(myTurn = true) {
    if (myTurn) {
        statusMessage.textContent = "貴殿のターン！";
        statusMessage.classList.remove('animate-pulse', 'text-white');
        statusMessage.classList.add('text-yellow-400', 'animate-bounce');
    } else {
        statusMessage.textContent = "相手のターン…";
        statusMessage.classList.remove('text-yellow-400', 'animate-bounce');
        statusMessage.classList.add('animate-pulse', 'text-white');
    }
}

/**
* ゲーム画面の初期UI設定
*/
function setupGameUI() {
    // 共通チャットUIを初期化
    setupGameChat(roomId);
    // ロビーにいる他プレイヤー情報を表示
    showActiveLobbyUsersInGame(lobbyChannel.presenceState());

    if (currentGameType === 'babanuki') {
        // ババ抜きUI表示
        babanukiUI.classList.remove('hidden');
        quoridorUI.classList.add('hidden');

        // ババ抜き用UI要素のセットアップ
        myNameEl.innerText = `${myName} (貴殿)`;
        opponentNameEl.innerText = `${opponentName} (敵)`;
        myHandContainer.innerHTML = '';
        opponentHandContainer.innerHTML = '';
        drawnCardMessageEl.textContent = ''; // メッセージクリア

    } else if (currentGameType === 'quoridor') {
        // コリドールUI表示
        babanukiUI.classList.add('hidden');
        quoridorUI.classList.remove('hidden');

        // コリドール用UI要素のセットアップ
        // P1 (ホスト) が青、 P2 (ゲスト) が赤
        if (isHost) {
            qPlayer1Name.textContent = `貴殿: ${myName}`;
            qPlayer2Name.textContent = `敵: ${opponentName}`;
        } else {
            qPlayer1Name.textContent = `敵: ${opponentName}`;
            qPlayer2Name.textContent = `貴殿: ${myName}`;
        }

        // イベントリスナー設定
        canvas.addEventListener('click', handleQuoridorBoardClick);
        canvas.addEventListener('mousemove', handleQuoridorMouseMove);
        canvas.addEventListener('mouseleave', () => {
            potentialWall = null;
            drawQuoridorGame();
        });
        qMoveBtn.addEventListener('click', () => setQuoridorAction('move'));
        qHWallBtn.addEventListener('click', () => setQuoridorAction('h_wall'));
        qVWallBtn.addEventListener('click', () => setQuoridorAction('v_wall'));

        // リサイズ処理（初回描画も兼ねる）
        resizeQuoridorCanvas();
    }
}

// 8. DataChannel メッセージ振り分け

/**
 * DataChannelでメッセージを送信するヘルパー
 * @param {Object} data - 送信するJSONオブジェクト
 * @param {boolean} [addGameType=true] - gameTypeを自動付与するか
 */
function sendData(data, addGameType = true) {
    if (dataChannel && dataChannel.readyState === 'open') {
        // gameTypeを自動的に付与
        if (addGameType && currentGameType) {
            data.gameType = currentGameType;
        }
        dataChannel.send(JSON.stringify(data));
    } else {
        console.error("Data Channelがオープンしていません。送信失敗:", data);
    }
}
/**
 * ババ抜き用のデータ処理
 * @param {Object} msg 
 */
function handleBabanukiData(msg) {
    switch (msg.type) {
        // (ゲストが) ホストから手札を受け取る
        case 'deal':
            myHand = discardPairsFromHand(msg.hand, true); // 初期ペアを捨てる

            // 手札が0枚なら自分の勝ち
            if (myHand.length === 0) {
                // UIは更新せず、すぐにホストが負けたことを伝える
                sendData({ type: 'you-lost' });
                showRematchPrompt(true); // ゲストは勝ち
                break;
            }

            printTurnStatus(myTurn = true);
            drawnCardMessageEl.textContent = ''; // メッセージクリア
            myTurn = msg.myTurn;

            // ゲーム開始音 (ゲスト側)
            playDealSound();

            renderMyHand();
            sendHandSizeUpdate();
            updateTurnStatus();
            break;

        // 相手の手札の枚数更新
        case 'hand-size-update':
            opponentHandSize = msg.size;
            renderOpponentHand();
            // 相手の手札が0枚になったか確認 ---
            if (opponentHandSize === 0) {
                // 相手の手札が0枚になった = 自分の負け
                // 相手からも 'you-lost' が送られてくるはずだが
                // 念のためこちらでも敗北処理をトリガーする
                showRematchPrompt(false);
            }
            break;

        // (ホストが) ゲストからカードを引くリクエストを受ける
        case 'draw-request':
            handleCardDrawRequest(msg.index);
            break;

        // (ゲストが) ホストから引いたカード情報を受け取る
        case 'card-drawn':
            handleCardDrawn(msg.card);
            break;

        // ターン交代の通知
        case 'turn-update':
            // 相手のmyTurn状態の逆が、現在の自分のmyTurn状態になる
            myTurn = !msg.myTurn;
            // UIを更新するが、シグナルは再送しない
            updateTurnStatus(false);
            break;

        // 相手が「貴殿の勝ち」と通知してきた時
        case 'you-won':
            showRematchPrompt(true);
            break;

        // 相手が「貴殿の負け」と通知してきた時
        case 'you-lost':
            showRematchPrompt(false);
            break;

        // (フォールバック)
        case 'rematch-request':
            handleRematchRequest();
            break;
        case 'rematch-decline':
            handleRematchDecline();
            break;

        default:
            console.warn("未定義のババ抜きメッセージタイプ:", msg);
            break;
    }
}

/**
 * コリドール用のデータ処理
 * @param {Object} msg 
 */
function handleQuoridorData(msg) {
    switch (msg.type) {
        // (ゲストが) ホストからゲーム初期状態を受信
        case 'quoridor-init':
            // グローバル変数に状態をセット
            player1Pos = msg.player1Pos;
            player2Pos = msg.player2Pos;
            player1Walls = msg.player1Walls;
            player2Walls = msg.player2Walls;
            horizontalWalls = msg.horizontalWalls;
            verticalWalls = msg.verticalWalls;
            q_currentPlayer = msg.q_currentPlayer;
            gameOver = msg.gameOver;
            currentAction = 'move'; // デフォルト

            resizeQuoridorCanvas(); // 描画
            updateQuoridorUI();
            break;

        // (相手側が) ポーン移動を受信
        case 'quoridor-move':
            { // ブロックスコープ
                const player = (msg.playerNum === 1) ? player1Pos : player2Pos;
                player.x = msg.toCol;
                player.y = msg.toRow;

                if (checkQuoridorWin(msg.playerNum)) {
                    gameOver = true;
                    q_currentPlayer = msg.playerNum; // 勝者をセット
                } else {
                    switchQuoridorTurn();
                }
                updateQuoridorUI();
                drawQuoridorGame();
            }
            break;

        // (相手側が) 壁設置を受信
        case 'quoridor-wall':
            { // ブロックスコープ
                if (msg.orientation === 'horizontal') {
                    horizontalWalls[msg.row][msg.col] = true;
                } else {
                    verticalWalls[msg.row][msg.col] = true;
                }

                if (msg.playerNum === 1) {
                    player1Walls--;
                } else {
                    player2Walls--;
                }

                switchQuoridorTurn();
                updateQuoridorUI();
                drawQuoridorGame();
            }
            break;

        // (フォールバック)
        case 'rematch-request':
            handleRematchRequest();
            break;
        case 'rematch-decline':
            handleRematchDecline();
            break;

        default:
            console.warn("未定義のコリドールメッセージタイプ:", msg);
            break;
    }
}

// --- 9. ババ抜きゲームロジック ---
/**
 * デッキを作成しシャッフルする
 */
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                suit: suit,
                rank: rank,
                display: `${suit}${rank}`,
                color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
            });
        }
    }
    deck.push(JOKER);

    // シャッフル (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

/**
 * 初期手札からペアのカードを除外する
 * @param {Array<Object>} hand - 対象の手札
 * @param {boolean} isInitial - 初期処理かどうか (ログメッセージ用)
 * @returns {Array<Object>} ペアを除外した後の手札
 */
function discardPairsFromHand(hand, isInitial) {
    const originalLength = hand.length;
    // カードをランク順にソートして、隣接するペアを見つけやすくする
    const tempHand = [...hand].sort((a, b) => {
        // JOKERは最後に回す
        if (a.rank === 'JOKER') return 1;
        if (b.rank === 'JOKER') return -1;
        // ランク順でソート (RANKS配列のインデックスを使用)
        const rankA = RANKS.indexOf(a.rank);
        const rankB = RANKS.indexOf(b.rank);
        if (rankA !== rankB) return rankA - rankB;
        // ランクが同じならスートでソート
        return a.suit.localeCompare(b.suit);
    });

    const finalHand = [];

    let i = 0;
    while (i < tempHand.length) {
        const card = tempHand[i];

        if (card.rank === 'JOKER') {
            // JOKERはそのまま残す
            finalHand.push(card);
            i++;
            continue;
        }

        // 次のカードをチェックし、ペアかどうか確認
        const nextCard = tempHand[i + 1];

        if (nextCard && nextCard.rank === card.rank) {
            // ペアが見つかった場合、2枚スキップして捨てる
            i += 2;
        } else {
            // ペアが見つからなかった場合（奇数枚の1枚、または単独のカード）、そのカードを残す
            finalHand.push(card);
            i++;
        }
    }

    if (isInitial && originalLength !== finalHand.length) {
        console.log(`初期手札から ${originalLength - finalHand.length} 枚のペア (${(originalLength - finalHand.length) / 2} 組) を捨てました。`);
    }

    return finalHand;
}


/**
 * ゲーム初期化 (ホストのみ実行)
 */
function initializeBabanukiGame() {
    const deck = createDeck();

    // カードを配る (2人用)
    const hostHand = [];
    const guestHand = [];
    deck.forEach((card, index) => {
        if (index % 2 === 0) {
            hostHand.push(card);
        } else {
            guestHand.push(card);
        }
    });

    // 初期ペアを捨てる
    myHand = discardPairsFromHand(hostHand, true); // ホストの自分の手札
    const guestInitialHand = discardPairsFromHand(guestHand, true); // ゲストの初期手札

    // 相手(ゲスト)の手札が0枚なら相手の勝ち
    if (guestInitialHand.length === 0) {
        // dealメッセージはゲストがゲーム開始を認識するために必要
        sendData({ type: 'deal', hand: guestInitialHand, myTurn: false });
        // すぐに勝利を伝える
        sendData({ type: 'you-won' });
        showRematchPrompt(false); // 自分(ホスト)は負け
        return; // ゲームセットアップを終了
    }

    // 先行後攻をランダムに決定
    const guestStarts = Math.random() < 0.5;

    // ゲストに手札を送信
    sendData({
        type: 'deal',
        hand: guestInitialHand, // ペアを除いた手札を送信
        myTurn: guestStarts // ゲストのターン状態
    });

    myTurn = !guestStarts; // ホストはゲストの逆

    // ゲーム開始音
    playDealSound();

    // ホストの手札が0枚だった場合の処理を即座にチェック
    if (myHand.length === 0) {
        sendData({ type: 'you-lost' }); // ゲストの負けであることを通知
        showRematchPrompt(true); // ホストが勝ち
        return;
    }

    renderMyHand();
    sendHandSizeUpdate();
    if (guestStarts) {
        updateTurnStatus(false);
        printTurnStatus(myTurn = false);
    } else {
        updateTurnStatus(true);
        printTurnStatus(myTurn = true);
    }
    drawnCardMessageEl.textContent = ''; // メッセージクリア
}

/**
 * ゲーム終了時に再戦の意思を確認するプロンプトを表示
 * @param {boolean} isWinner - 自分が勝者かどうか
 */
function showRematchPrompt(isWinner) {
    // 既に結果送信済みなら何もしない (重複防止)
    if (gameResultSent) return;
    gameResultSent = true; // 結果送信フラグを立てる

    let resultMessage = '';
    if (isWinner) {
        playWinSound(); // 勝利音
        if (currentGameType === 'babanuki') {
            resultMessage = `${myName} が ${opponentName} にババ抜きで勝利しました！`;
        } else if (currentGameType === 'quoridor') {
            resultMessage = `${myName} が ${opponentName} にコリドールで勝利しました！`;
        }
        sendLobbyNotification(resultMessage);  // ロビーチャットに結果を通知
    } else {
        playLoseSound(); // 敗北音
    }

    const title = isWinner ? '貴殿の勝ちヽ(´ー｀)ノ' : '貴殿の負け(^Д^)';
    const body = 'もう一度対戦しますか？';
    const buttonEmoticon = isWinner ? '(^Д^)' : '(;`Д´)';
    const voiceMessage = isWinner ? 'ぎゃははは！プーックス！' : 'ぐぬぬっ！悔しいっ！';
    const rate = isWinner ? 1.2 : 0.8;
    const pitch = isWinner ? 1.2 : 0.8;

    // 既にモーダルが開いている場合は更新しない（重複呼び出し防止）
    if (modalOverlay.classList.contains('hidden') === false && modalTitle.textContent.startsWith('ゲーム終了')) {
        return;
    }

    showModal(title, body, [
        {
            text: '終了する',
            class: 'bg-gray-500',
            action: () => {
                // 相手に再戦拒否を通知
                sendData({ type: 'rematch-decline' }, false); // 共通メッセージ
                // カウントダウン処理へ
                startExitCountdown('ゲーム終了', '再戦は不成立となりました。待合室に戻ります。');
            }
        },
        {
            text: '再戦する',
            class: 'bg-green-600',
            action: () => {
                sendRematchRequest();
            }
        },
        {
            text: buttonEmoticon,
            class: 'bg-yellow-500',
            action: () => {
                sendVoiceReaction(voiceMessage, pitch, rate);
            }
        }
    ]);
}

/**
 * 再戦要求を送信する
 */
function sendRematchRequest() {
    rematchRequested = true;
    sendData({ type: 'rematch-request' }, false); // 共通メッセージ

    if (opponentRematchRequested) {
        // 相手も既に同意済みの場合、ゲームを再開
        restartGame();
    } else {
        // 相手の応答待ち
        showModal(modalTitle.textContent,
            '再戦の意思を相手に伝えました。相手の返答を待っています...', [
            {
                text: 'キャンセル',
                class: 'bg-gray-500',
                action: exitToLobby
            }
        ]);
    }
}

/**
 * 相手からの再戦要求を処理
 */
function handleRematchRequest() {
    opponentRematchRequested = true;

    if (rematchRequested) {
        // 自分も既に同意済みの場合、ゲームを再開
        restartGame();
    } else {
        // 自分がまだ選択していない場合 (モーダルが表示されているはず)
        // モーダルの本文を更新して、相手が同意したことを伝える
        if (modalOverlay.classList.contains('hidden') === false) {
            modalBody.textContent = '相手は再戦を希望しています。どうする？';
        }
    }
}

/**
 * 相手からの再戦拒否を処理
 */
function handleRematchDecline() {
    // 相手が再戦を拒否した
    opponentRematchRequested = false;
    // カウントダウン処理へ
    startExitCountdown('ゲーム終了', '再戦は不成立となりました。ロビーに戻ります。');
}

/**
 * ゲーム終了後、カウントダウンしてロビーに戻るモーダルを表示
 * @param {string} title - モーダルのタイトル
 * @param {string} body - モーダルの本文 (カウントダウン前の説明)
 */
function startExitCountdown(title, body) {
    // モーダルが既に表示されている場合でも、内容を更新しタイマーをリセット
    // 既存のタイマーをクリア
    if (gameExitTimer) {
        clearInterval(gameExitTimer);
        gameExitTimer = null;
    }

    let countdown = 5;
    const defaultAction = () => exitToLobby(); // タイムアウト時はロビーに戻る
    const bodyText = body;
    const modalTitleText = title;

    const buttons = [
        {
            text: 'ロビーに戻る',
            class: 'bg-green-500',
            action: () => {
                clearInterval(gameExitTimer); // タイマー停止
                gameExitTimer = null;
                exitToLobby(); // 単にロビーに戻る
            }
        }
    ];

    // 最初のモーダル表示
    const initialBody = `${bodyText} (${countdown}秒後に自動でロビーに戻ります)`;
    showModal(modalTitleText, initialBody, buttons);

    // カウントダウンタイマーを開始
    const modalBodyEl = document.getElementById('modal-body'); // モーダルの本文要素を直接取得

    gameExitTimer = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            // モーダルがまだ表示されているか確認
            if (!modalOverlay.classList.contains('hidden')) {
                modalBodyEl.textContent = `${bodyText} (${countdown}秒後に自動でロビーに戻ります)`;
            }
        } else {
            // タイムアウト
            clearInterval(gameExitTimer);
            gameExitTimer = null;
            // モーダルがまだ表示されている場合のみアクション実行
            if (!modalOverlay.classList.contains('hidden')) {
                defaultAction(); // デフォルトアクションを実行
            }
        }
    }, 1000);
}

/**
 * ゲームをリスタートする
 */
function restartGame() {
    hideModal();

    // 再戦フラグをリセット
    rematchRequested = false;
    opponentRematchRequested = false;
    gameResultSent = false;

    // ゲームUIをリセット
    if (currentGameType === 'babanuki') {
        myHand = [];
        opponentHandSize = 0;
        renderMyHand();
        renderOpponentHand();
        drawnCardMessageEl.textContent = ''; // メッセージクリア

        if (isHost) {
            // ホストがゲームを再初期化
            statusMessage.textContent = "再戦開始...カードを配っています...";
            initializeBabanukiGame();
        } else {
            // ゲストはホストからの 'deal' メッセージを待つ
            statusMessage.textContent = "再戦開始...ホストを待っています...";
        }
    } else if (currentGameType === 'quoridor') {
        if (isHost) {
            statusMessage.textContent = "再戦開始...盤面を準備しています...";
            initQuoridorGame(); // ホストがコリドールを再初期化
        } else {
            statusMessage.textContent = "再戦開始...ホストを待っています...";
            // ゲストは 'quoridor-init' を待つ
        }
    }
}

/**
 * (相手から) カードを引くリクエストを受けた時
 * @param {number} index - 相手がクリックしたカードのインデックス
 */
function handleCardDrawRequest(index) {
    if (index < 0 || index >= myHand.length) {
        console.error("無効なドローリクエスト:", index, myHand.length);
        showModal("エラー", "無効なドローリクエストです。", [
            { text: '拝承', class: 'bg-red-500', action: () => { hideModal(); exitToLobby(); } }
        ]);
        return;
    }

    const drawnCard = myHand.splice(index, 1)[0]; // 自分の手札からカードを抜く

    // 相手に引いたカード情報を送る
    sendData({
        type: 'card-drawn',
        card: drawnCard
    });

    if (opponentHandSize === 0) {
        sendData({ type: 'you-win' }); // 相手が勝利したことを通知
        showRematchPrompt(false); // 相手が勝ち
        return;
    }

    // 相手がドローしたので、自分のターンが始まる
    myTurn = true;

    renderMyHand(); // 自分の手札を再描画
    sendHandSizeUpdate(); // 自分の手札サイズを相手に通知

    // 自分の手札が0枚になったかチェック
    if (myHand.length === 0) {
        sendData({ type: 'you-lost' }); // 相手が敗北したことを通知
        showRematchPrompt(true); // 自分が勝ち
    } else {
        // ターン更新
        updateTurnStatus();
    }
}

/**
 * (自分が) 相手からカードを引いた時
 * @param {Object} card - 引いたカード
 */
function handleCardDrawn(card) {
    myHand.push(card);

    // ペアを探す
    let pairFound = false;
    let matchingCardDisplay = ''; // ペアになったカードの表示名

    // JOKER以外のカードが引かれた場合のみペアをチェック
    if (card.rank !== 'JOKER') {
        // 引いたカード（card）以外で、同じランクのカードを探す
        const matchingCardIndex = myHand.findIndex(c => c.rank === card.rank && c !== card);

        if (matchingCardIndex > -1) {
            // ペアが見つかった
            const card1 = card;
            const card2 = myHand[matchingCardIndex];

            matchingCardDisplay = card2.display; // ペアの表示名を記録

            // 手札からペアを削除 (引いたカードと、見つけたペアを削除)
            myHand = myHand.filter(c => c !== card1 && c !== card2);

            pairFound = true;
            // ペア成立音
            playPairSound();
        }
    }

    // メッセージをdrawnCardMessageElに設定
    if (pairFound) {
        drawnCardMessageEl.textContent = `「${card.display}」を引きました。「${matchingCardDisplay}」とペアになり、捨てました！`;
    } else if (card.display === 'JOKER') {
        drawnCardMessageEl.textContent = 'ババを引きました(^Д^)残念！';
        playBuzzerSound();
    } else {
        drawnCardMessageEl.textContent = `「${card.display}」を引きました。ペアはありませんでした。`;
    }

    // ターンを交代
    myTurn = false; // 自分のターン終了

    renderMyHand(); // 自分の手札を再描画
    sendHandSizeUpdate(); // 自分の手札サイズを相手に通知

    // 自分の手札が0枚になったかチェック
    if (myHand.length === 0) {
        sendData({ type: 'you-lost' }); // 相手が敗北したことを通知
        showRematchPrompt(true); // 自分が勝ち
    } else {
        // ターン終了を相手に通知 (相手のmyTurnがtrueになる)
        updateTurnStatus();
    }
}

/**
 * 自分の手札を描画
 */
function renderMyHand() {
    myHandContainer.innerHTML = '';
    // 描画用の手札コピーを作成
    const displayHand = [...myHand];

    // 描画用の手札をシャッフル (Fisher-Yates)
    // (myHand 本体の順序は変更しない)
    for (let i = displayHand.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [displayHand[i], displayHand[j]] = [displayHand[j], displayHand[i]];
    }

    // シャッフルした displayHand を描画
    displayHand.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.color} ${card.rank === 'JOKER' ? 'joker' : ''}`;
        cardEl.textContent = card.display;
        // 自分のカードはクリック不可
        cardEl.style.cursor = 'not-allowed';
        myHandContainer.appendChild(cardEl);
    });
}

/**
 * 相手の手札（裏側）を描画
 */
function renderOpponentHand() {
    opponentHandContainer.innerHTML = '';
    for (let i = 0; i < opponentHandSize; i++) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card card-back';
        cardEl.dataset.index = i; // インデックス

        // 自分のターンならクリック可能にする
        if (myTurn) {
            cardEl.onclick = () => {
                if (myTurn) {
                    // カードクリック音
                    playClickSound();

                    // 相手のカードを引く
                    myTurn = false; // すぐにターン終了 (連続クリック防止)
                    statusMessage.textContent = '相手のカードを引いています...';
                    opponentHandContainer.classList.remove('cursor-pointer');
                    drawnCardMessageEl.textContent = ''; // カードを引く際にメッセージをクリア
                    sendData({ type: 'draw-request', index: i });
                }
            };
        } else {
            cardEl.style.cursor = 'not-allowed';
        }
        opponentHandContainer.appendChild(cardEl);
    }
}

/**
 * ターン状態を更新 (UIとオプションで相手への通知)
 * @param {boolean} [shouldSendUpdate=true] - 相手にturn-updateシグナルを送信するか
 */
function updateTurnStatus(shouldSendUpdate = true) {
    if (myTurn) {
        printTurnStatus(myTurn = true);
        opponentHandContainer.classList.add('cursor-pointer');
    } else {
        printTurnStatus(myTurn = false);
        opponentHandContainer.classList.remove('cursor-pointer');
    }
    // 相手の手札を再描画 (クリック可/不可を反映)
    renderOpponentHand();

    // 相手に現在の自分のターン状態を通知
    if (shouldSendUpdate) {
        sendData({ type: 'turn-update', myTurn: myTurn });
    }
}

/**
 * 自分の手札の枚数を相手に通知
 */
function sendHandSizeUpdate() {
    sendData({ type: 'hand-size-update', size: myHand.length });
}


// --- 10. コリドールゲームロジック ---
/**
 * コリドールゲーム初期化 (ホストのみ実行)
 */
function initQuoridorGame() {
    // グローバル変数にゲーム状態をセット
    player1Pos = { x: 4, y: 8 }; // プレイヤー1 (青, 下側)
    player2Pos = { x: 4, y: 0 }; // プレイヤー2 (赤, 上側)
    player1Walls = Q_WALL_COUNT;
    player2Walls = Q_WALL_COUNT;
    q_currentPlayer = (Math.random() < 0.5) ? 1 : 2;  // 先攻後攻はランダムで決める (1が先攻)
    horizontalWalls = Array(Q_BOARD_SIZE - 1).fill(null).map(() => Array(Q_BOARD_SIZE - 1).fill(false));
    verticalWalls = Array(Q_BOARD_SIZE - 1).fill(null).map(() => Array(Q_BOARD_SIZE - 1).fill(false));
    currentAction = 'move';
    potentialWall = null;
    gameOver = false;

    // ゲストに初期状態を送信
    sendData({
        type: 'quoridor-init',
        player1Pos,
        player2Pos,
        player1Walls,
        player2Walls,
        horizontalWalls,
        verticalWalls,
        q_currentPlayer,
        gameOver
    });

    // 自分のUIも更新
    updateQuoridorUI();
    resizeQuoridorCanvas(); // 描画
}

/**
 * コリドール キャンバスのサイズ調整
 */
function resizeQuoridorCanvas() {
    if (!canvas) return;
    const parent = canvas.parentElement;
    const size = Math.min(parent.clientWidth, parent.clientHeight);
    canvas.width = size;
    canvas.height = size;
    boardPixels = size;

    WALL_THICKNESS = boardPixels / (Q_BOARD_SIZE * 4 + (Q_BOARD_SIZE - 1)); // 9*4 + 8 = 44
    TILE_SIZE = WALL_THICKNESS * 4;
    PAWN_RADIUS = TILE_SIZE * 0.35;

    drawQuoridorGame();
}

/**
 * コリドール 盤面描画 (全体)
 */
function drawQuoridorGame() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawQuoridorBoard();
    drawQuoridorWalls();
    drawQuoridorPawns();
    drawQuoridorPotentialWall();
}

function drawQuoridorBoard() {
    ctx.fillStyle = '#f0d9b5'; // 盤の色
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#c7a77b'; // 溝の色
    for (let i = 0; i < Q_BOARD_SIZE - 1; i++) {
        // 横溝
        const y = (i + 1) * TILE_SIZE + i * WALL_THICKNESS;
        ctx.fillRect(0, y, boardPixels, WALL_THICKNESS);
        // 縦溝
        const x = (i + 1) * TILE_SIZE + i * WALL_THICKNESS;
        ctx.fillRect(x, 0, WALL_THICKNESS, boardPixels);
    }
}

function drawQuoridorWalls() {
    if (!horizontalWalls || !verticalWalls) return;
    ctx.fillStyle = '#8b4513'; // 壁の色

    // 横壁
    for (let r = 0; r < Q_BOARD_SIZE - 1; r++) {
        for (let c = 0; c < Q_BOARD_SIZE - 1; c++) {
            if (horizontalWalls[r][c]) {
                const x = c * (TILE_SIZE + WALL_THICKNESS);
                const y = (r + 1) * TILE_SIZE + r * WALL_THICKNESS;
                const width = 2 * TILE_SIZE + WALL_THICKNESS;
                ctx.fillRect(x, y, width, WALL_THICKNESS);
            }
        }
    }
    // 縦壁
    for (let r = 0; r < Q_BOARD_SIZE - 1; r++) {
        for (let c = 0; c < Q_BOARD_SIZE - 1; c++) {
            if (verticalWalls[r][c]) {
                const x = (c + 1) * TILE_SIZE + c * WALL_THICKNESS;
                const y = r * (TILE_SIZE + WALL_THICKNESS);
                const height = 2 * TILE_SIZE + WALL_THICKNESS;
                ctx.fillRect(x, y, WALL_THICKNESS, height);
            }
        }
    }
}

function drawQuoridorPawns() {
    if (!player1Pos || !player2Pos) return;
    // プレイヤー1 (青)
    drawQuoridorPawn(player1Pos.x, player1Pos.y, '#3b82f6');
    // プレイヤー2 (赤)
    drawQuoridorPawn(player2Pos.x, player2Pos.y, '#ef4444');
}

function drawQuoridorPawn(col, row, color) {
    const { x, y } = getQuoridorPixelCoords(col, row);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, PAWN_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}

function drawQuoridorPotentialWall() {
    if (!potentialWall || gameOver) return;

    const { col, row, orientation } = potentialWall;
    const isValid = isWallPlacementValid(col, row, orientation, true); // true = 簡易チェック

    ctx.fillStyle = isValid ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';

    if (orientation === 'horizontal') {
        const x = col * (TILE_SIZE + WALL_THICKNESS);
        const y = (row + 1) * TILE_SIZE + row * WALL_THICKNESS;
        const width = 2 * TILE_SIZE + WALL_THICKNESS;
        ctx.fillRect(x, y, width, WALL_THICKNESS);
    } else { // vertical
        const x = (col + 1) * TILE_SIZE + col * WALL_THICKNESS;
        const y = row * (TILE_SIZE + WALL_THICKNESS);
        const height = 2 * TILE_SIZE + WALL_THICKNESS;
        ctx.fillRect(x, y, WALL_THICKNESS, height);
    }
}

/**
 * コリドール UI更新
 */
function updateQuoridorUI() {
    if (!qP1WallsEl) return; // UIがまだない場合は終了

    qP1WallsEl.textContent = player1Walls;
    qP2WallsEl.textContent = player2Walls;

    // ターン表示 (共通ステータスメッセージ)
    if (!gameOver) {
        if (q_currentPlayer === myPlayerNum) {
            printTurnStatus(myTurn = true);
            if (myPlayerNum === 1) {
                qP1Ping.classList.remove('hidden');
            } else {
                qP2Ping.classList.remove('hidden');
            }
        } else {
            printTurnStatus(myTurn = false);
            if (myPlayerNum === 1) {
                qP1Ping.classList.add('hidden');
            } else {
                qP2Ping.classList.add('hidden');
            }
        }
    }

    if (gameOver) {
        statusMessage.textContent = "ゲーム終了！";
        statusMessage.classList.remove('animate-pulse');
        qPlayer1Info.classList.remove('border-4', 'border-blue-500', 'border-dotted');
        qPlayer2Info.classList.remove('border-4', 'border-red-500', 'border-dotted');
        qPlayer1Info.classList.add('border-2', 'border-gray-500');
        qPlayer2Info.classList.add('border-2', 'border-gray-500');

        // 勝敗が決定したらリマッチプロンプトを表示
        showRematchPrompt(q_currentPlayer === myPlayerNum);

    } else {
        if (q_currentPlayer === 1) {
            qPlayer1Info.classList.remove('border-2', 'border-gray-500', 'border-dotted');
            qPlayer1Info.classList.add('border-4', 'border-blue-500', 'border-solid');
            qPlayer2Info.classList.remove('border-4', 'border-gray-500', 'border-solid');
            qPlayer2Info.classList.add('border-2', 'border-red-500', 'border-dotted');
        } else {
            qPlayer2Info.classList.remove('border-2', 'border-gray-500', 'border-dotted');
            qPlayer2Info.classList.add('border-4', 'border-red-500', 'border-solid');
            qPlayer1Info.classList.remove('border-4', 'border-gray-500', 'border-solid');
            qPlayer1Info.classList.add('border-2', 'border-blue-500', 'border-dotted');
        }
    }

    // ボタンのアクティブ状態
    qMoveBtn.classList.toggle('btn-active', currentAction === 'move');
    qHWallBtn.classList.toggle('btn-active', currentAction === 'h_wall');
    qVWallBtn.classList.toggle('btn-active', currentAction === 'v_wall');
    qMoveBtn.classList.toggle('bg-green-500', currentAction === 'move');
    qHWallBtn.classList.toggle('bg-gray-500', currentAction !== 'h_wall');
    qVWallBtn.classList.toggle('bg-gray-500', currentAction !== 'v_wall');
    qMoveBtn.classList.toggle('bg-gray-500', currentAction !== 'move');
    qHWallBtn.classList.toggle('bg-green-500', currentAction === 'h_wall');
    qVWallBtn.classList.toggle('bg-green-500', currentAction === 'v_wall');
}

// === コリドール 座標ユーティリティ ===
function getQuoridorPixelCoords(col, row) {
    const x = col * (TILE_SIZE + WALL_THICKNESS) + TILE_SIZE / 2;
    const y = row * (TILE_SIZE + WALL_THICKNESS) + TILE_SIZE / 2;
    return { x, y };
}

function getQuoridorSquareCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / (TILE_SIZE + WALL_THICKNESS));
    const row = Math.floor(y / (TILE_SIZE + WALL_THICKNESS));

    return { col, row };
}

function getQuoridorWallGridCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const unit = TILE_SIZE + WALL_THICKNESS;
    const col = Math.floor(x / unit);
    const row = Math.floor(y / unit);

    return { col, row };
}

// === コリドール イベントリスナー ===
function setQuoridorAction(action) {
    currentAction = action;
    potentialWall = null; // アクション変更でプレビューをクリア
    updateQuoridorUI();
    drawQuoridorGame();
}

function handleQuoridorBoardClick(e) {
    if (gameOver || q_currentPlayer !== myPlayerNum) return; // 自分のターンでなければ操作不可

    if (currentAction === 'move') {
        const { col, row } = getQuoridorSquareCoords(e);
        tryMovePawn(col, row);
    } else {
        const { col, row } = getQuoridorWallGridCoords(e);
        tryPlaceWall(col, row, currentAction === 'h_wall' ? 'horizontal' : 'vertical');
    }
}

function handleQuoridorMouseMove(e) {
    if (gameOver || q_currentPlayer !== myPlayerNum || currentAction === 'move') {
        potentialWall = null;
        if (ctx) drawQuoridorGame(); // ホバーが消えたことを反映
        return;
    }

    const { col, row } = getQuoridorWallGridCoords(e);
    if (col > Q_BOARD_SIZE - 2 || row > Q_BOARD_SIZE - 2) { // 8x8 グリッド外
        potentialWall = null;
    } else {
        potentialWall = {
            col: col,
            row: row,
            orientation: currentAction === 'h_wall' ? 'horizontal' : 'vertical'
        };
    }
    drawQuoridorGame();
}

// === コリドール ゲームロジック ===

function tryMovePawn(toCol, toRow) {
    const player = (q_currentPlayer === 1) ? player1Pos : player2Pos;
    const opponent = (q_currentPlayer === 1) ? player2Pos : player1Pos;

    if (isValidPawnMove(player, { x: toCol, y: toRow }, opponent)) {
        // P2P送信
        sendData({
            type: 'quoridor-move',
            playerNum: q_currentPlayer,
            toCol: toCol,
            toRow: toRow
        });

        // ローカルのポーンを動かす
        player.x = toCol;
        player.y = toRow;

        // 勝利判定
        if (checkQuoridorWin(q_currentPlayer)) {
            gameOver = true;
            // q_currentPlayer は勝者のまま
        } else {
            switchQuoridorTurn();
        }
        updateQuoridorUI();
        drawQuoridorGame();
    } else {
        playBuzzerSound();
    }
}

function isValidPawnMove(from, to, opp) {
    if (to.x < 0 || to.x >= Q_BOARD_SIZE || to.y < 0 || to.y >= Q_BOARD_SIZE) return false;
    if (to.x === opp.x && to.y === opp.y) return false;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // 1. 通常の1マス移動
    if (adx + ady === 1) {
        return !isWallBlocking(from, to);
    }

    // 2. 相手を飛び越える
    if ((adx === 2 && ady === 0) || (adx === 0 && ady === 2)) {
        const mid = { x: from.x + dx / 2, y: from.y + dy / 2 };
        if (mid.x !== opp.x || mid.y !== opp.y) return false;
        return !isWallBlocking(from, mid) && !isWallBlocking(mid, to);
    }

    // 3. 斜め移動
    if (adx === 1 && ady === 1) {
        const oppAdjX = (Math.abs(from.x - opp.x) === 1 && from.y === opp.y);
        const oppAdjY = (Math.abs(from.y - opp.y) === 1 && from.x === opp.x);
        if (!oppAdjX && !oppAdjY) return false;

        if (isWallBlocking(opp, to)) return false;

        if (oppAdjX) {
            const oppBack = { x: opp.x + (opp.x - from.x), y: opp.y };
            if (!isWallBlocking(opp, oppBack)) return false;
        } else {
            const oppBack = { x: opp.x, y: opp.y + (opp.y - from.y) };
            if (!isWallBlocking(opp, oppBack)) return false;
        }

        return !isWallBlocking(from, opp);
    }

    return false;
}

function isWallBlocking(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;

    try {
        if (dy === -1) { // 上
            const r = pos2.y; // 0..7
            return (horizontalWalls[r][pos1.x] || (pos1.x > 0 && horizontalWalls[r][pos1.x - 1]));
        }
        if (dy === 1) { // 下
            const r = pos1.y; // 0..7
            return (horizontalWalls[r][pos1.x] || (pos1.x > 0 && horizontalWalls[r][pos1.x - 1]));
        }
        if (dx === -1) { // 左
            const c = pos2.x; // 0..7
            return (verticalWalls[pos1.y][c] || (pos1.y > 0 && verticalWalls[pos1.y - 1][c]));
        }
        if (dx === 1) { // 右
            const c = pos1.x; // 0..7
            return (verticalWalls[pos1.y][c] || (pos1.y > 0 && verticalWalls[pos1.y - 1][c]));
        }
    } catch (e) {
        return false;
    }
    return false;
}


function tryPlaceWall(col, row, orientation) {
    if (!isWallPlacementValid(col, row, orientation, false)) {
        return;
    }

    // P2P送信
    sendData({
        type: 'quoridor-wall',
        playerNum: q_currentPlayer,
        col,
        row,
        orientation
    });

    // ローカルの壁を配置
    if (orientation === 'horizontal') {
        horizontalWalls[row][col] = true;
    } else {
        verticalWalls[row][col] = true;
    }

    if (q_currentPlayer === 1) {
        player1Walls--;
    } else {
        player2Walls--;
    }

    switchQuoridorTurn();
    updateQuoridorUI();
    drawQuoridorGame();
}

function isWallPlacementValid(col, row, orientation, isQuickCheck = false) {
    const wallsLeft = (q_currentPlayer === 1) ? player1Walls : player2Walls;
    if (wallsLeft <= 0) return false;
    if (col < 0 || col >= Q_BOARD_SIZE - 1 || row < 0 || row >= Q_BOARD_SIZE - 1) return false;

    if (orientation === 'horizontal') {
        if (horizontalWalls[row][col]) return false;
        if (verticalWalls[row][col]) return false;
        if (col > 0 && horizontalWalls[row][col - 1]) return false; // 重複
        if (col < Q_BOARD_SIZE - 2 && horizontalWalls[row][col + 1]) return false; // 重複
    } else { // vertical
        if (verticalWalls[row][col]) return false;
        if (horizontalWalls[row][col]) return false;
        if (row > 0 && verticalWalls[row - 1][col]) return false; // 重複
        if (row < Q_BOARD_SIZE - 2 && verticalWalls[row + 1][col]) return false; // 重複
    }

    if (isQuickCheck) return true;

    // 経路探索
    if (orientation === 'horizontal') horizontalWalls[row][col] = true;
    else verticalWalls[row][col] = true;

    const p1HasPath = hasPathToGoal(player1Pos, 1);
    const p2HasPath = hasPathToGoal(player2Pos, 2);

    if (orientation === 'horizontal') horizontalWalls[row][col] = false;
    else verticalWalls[row][col] = false;

    return p1HasPath && p2HasPath;
}

function hasPathToGoal(startPos, playerNum) {
    const goalRow = (playerNum === 1) ? 0 : Q_BOARD_SIZE - 1;
    const q = [startPos];
    const visited = new Set();
    visited.add(`${startPos.x},${startPos.y}`);

    while (q.length > 0) {
        const pos = q.shift();
        if (pos.y === goalRow) return true;

        const neighbors = [
            { x: pos.x, y: pos.y - 1 }, // 上
            { x: pos.x, y: pos.y + 1 }, // 下
            { x: pos.x - 1, y: pos.y }, // 左
            { x: pos.x + 1, y: pos.y }  // 右
        ];

        for (const n of neighbors) {
            if (n.x < 0 || n.x >= Q_BOARD_SIZE || n.y < 0 || n.y >= Q_BOARD_SIZE) continue;
            const nKey = `${n.x},${n.y}`;
            if (visited.has(nKey)) continue;

            if (!isWallBlocking(pos, n)) {
                visited.add(nKey);
                q.push(n);
            }
        }
    }
    return false;
}

function checkQuoridorWin(playerNum) {
    if (playerNum === 1 && player1Pos.y === 0) {
        return true;
    }
    if (playerNum === 2 && player2Pos.y === 8) {
        return true;
    }
    return false;
}

function switchQuoridorTurn() {
    q_currentPlayer = (q_currentPlayer === 1) ? 2 : 1;
    setQuoridorAction('move'); // ターンが切り替わったら「ポーン移動」をデフォルトに
    playClickSound();
}

// --- 11. DOM初期化 ---
function initializeDOMElements() {
    // 共通
    chatMessagesEl = document.getElementById('chat-messages');
    chatInputEl = document.getElementById('chat-input');
    chatSendBtn = document.getElementById('chat-send-btn');
    setupScreen = document.getElementById('setup-screen');
    lobbyScreen = document.getElementById('lobby-screen');
    gameScreen = document.getElementById('game-screen');
    joinLobbyBtn = document.getElementById('join-lobby-btn');
    leaveGameBtn = document.getElementById('leave-game-btn');
    nameInput = document.getElementById('name-input');
    playerList = document.getElementById('player-list');
    userNameEl = document.getElementById('user-name');
    noPlayersMessage = document.getElementById('no-players-message');
    noPlayersImage = document.getElementById('no-players-image');
    statusMessage = document.getElementById('status-message'); // 共通ステータス

    // 共通モーダル
    modalOverlay = document.getElementById('modal-overlay');
    modalContent = document.getElementById('modal-content');
    modalTitle = document.getElementById('modal-title');
    modalBody = document.getElementById('modal-body');
    modalButtons = document.getElementById('modal-buttons');

    // ゲーム選択モーダル
    gameChoiceModalOverlay = document.getElementById('game-choice-modal-overlay');
    gameChoiceModalTitle = document.getElementById('game-choice-modal-title');
    gameChoiceModalBody = document.getElementById('game-choice-modal-body');
    gameChoiceModalButtons = document.getElementById('game-choice-modal-buttons');
    gameChoiceBabanukiBtn = document.getElementById('game-choice-babanuki');
    gameChoiceQuoridorBtn = document.getElementById('game-choice-quoridor');
    gameChoiceCancelBtn = document.getElementById('game-choice-cancel');

    // ゲームUIコンテナ
    babanukiUI = document.getElementById('babanuki-ui');
    quoridorUI = document.getElementById('quoridor-ui');

    // ババ抜き用
    myNameEl = document.getElementById('my-name');
    opponentNameEl = document.getElementById('opponent-name');
    drawnCardMessageEl = document.getElementById('drawn-card-message');
    myHandContainer = document.getElementById('my-hand-container');
    opponentHandContainer = document.getElementById('opponent-hand-container');

    // コリドール用
    qPlayer1Info = document.getElementById('q-player1-info');
    qPlayer1Name = document.getElementById('q-player1-name');
    qP1Ping = document.getElementById('q-p1-ping');
    qP1WallsEl = document.getElementById('q-p1-walls');
    qPlayer2Info = document.getElementById('q-player2-info');
    qPlayer2Name = document.getElementById('q-player2-name');
    qP2Ping = document.getElementById('q-p2-ping');
    qP2WallsEl = document.getElementById('q-p2-walls');
    qMoveBtn = document.getElementById('q-move-btn');
    qHWallBtn = document.getElementById('q-h-wall-btn');
    qVWallBtn = document.getElementById('q-v-wall-btn');
    canvas = document.getElementById('game-board');
    if (canvas) { // canvasがnullでないことを確認
        ctx = canvas.getContext('2d');
    }

    // 共通 (ゲーム画面)
    gameChatMessages = document.getElementById('game-chat-messages');
    gameChatInput = document.getElementById('game-chat-input');
    gameChatSend = document.getElementById('game-chat-send');
    fileInputEl = document.getElementById('file-input');
    fileSendBtnEl = document.getElementById('file-send-btn');
    fileStatusEl = document.getElementById('file-status');
    voiceLessBtn1 = document.getElementById('voiceless-mode-button1');
    voiceLessBtn1.onclick = () => toggleVoiceLess();
    voiceLessBtn2 = document.getElementById('voiceless-mode-button2');
    voiceLessBtn2.onclick = () => toggleVoiceLess();

    // コリドール用キャンバスのリサイズイベント
    window.addEventListener('resize', resizeQuoridorCanvas);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    showScreen('setup');
});
