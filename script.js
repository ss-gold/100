
const CONFIG = {
  room2Visible: "https://i.imgur.com/P58Ey38.png",
  room2Mask: "https://i.imgur.com/U8BGGap.png",
  studyMask: "images/study-mask.png",
  audioTop: "audio/1.mp3",
  audioBottom: "audio/2.mp3",
  noteIcon: "https://i.imgur.com/uCdRAbl.png",
  chairIcon: "https://i.imgur.com/LusdrYD.png",
  uniforms: {
    ganghak: "https://i.imgur.com/cNkbT1s.png",
    byeoksan: "https://i.imgur.com/755qF5Q.png",
    yeoil: "https://i.imgur.com/eTxoLYh.png",
    eunjang: "https://i.imgur.com/Zmxad9Y.png",
    jiseong: "https://i.imgur.com/45hLNMb.png"
  }
};

const STORAGE_KEY = "ysi_escape_final_v2_inventory";

const ITEMS = {
  byeoksan: { type: "uniform", name: "벽산 교복", img: CONFIG.uniforms.byeoksan },
  eunjang: { type: "uniform", name: "은장 교복", img: CONFIG.uniforms.eunjang },
  ganghak: { type: "uniform", name: "강학 교복", img: CONFIG.uniforms.ganghak },
  yeoil: { type: "uniform", name: "여일 교복", img: CONFIG.uniforms.yeoil },
  jiseong: { type: "uniform", name: "지성 교복", img: CONFIG.uniforms.jiseong },
  chair: { type: "tool", name: "의자", img: CONFIG.chairIcon },
  memoCat: { type: "memo", name: "숫자야구 메모", code: "27831", result: "1S 2B", img: CONFIG.noteIcon },
  memoTop: { type: "memo", name: "숫자야구 메모", code: "97083", result: "0S 4B", img: CONFIG.noteIcon },
  memoBottom: { type: "memo", name: "숫자야구 메모", code: "79436", result: "0S 2B", img: CONFIG.noteIcon },
  memoPiano: { type: "memo", name: "숫자야구 메모", code: "54930", result: "1S 2B", img: CONFIG.noteIcon },
  memoMirror: { type: "memo", name: "숫자야구 메모", code: "23509", result: "0S 3B", img: CONFIG.noteIcon },
  memoWindow: { type: "memo", name: "숫자야구 메모", code: "65249", result: "0S 1B", img: CONFIG.noteIcon }
};

const state = { inventory: loadInventory(), currentAudio: null };
const $ = (q) => document.querySelector(q);

const screens = { intro: $("#intro"), letter: $("#letter"), study: $("#study"), room2: $("#room2"), final: $("#final") };
const modal = { backdrop: $("#modalBackdrop"), title: $("#modalTitle"), text: $("#modalText"), extra: $("#modalExtra"), message: $("#modalMessage"), actions: $("#modalActions") };
const maskStore = {};

$("#room2Visible").src = CONFIG.room2Visible;

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
  $("#inventoryButton").classList.toggle("active", ["study", "room2"].includes(name));
  $("#backButton").classList.toggle("active", name === "room2");
  window.scrollTo(0, 0);
}

function loadInventory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveInventory() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.inventory)); }
function hasItem(id) { return state.inventory.includes(id); }
function addItem(id) {
  if (!hasItem(id)) {
    state.inventory.push(id);
    saveInventory();
    return true;
  }
  return false;
}
function normalizeAnswer(value) { return (value || "").trim().replace(/\s+/g, "").toLowerCase(); }
function formatText(text) {
  return String(text || "").replaceAll("…….", "……").replace(/\n{3,}/g, "\n\n").trim();
}

function openModal({ title = "", text = "", extra = null, choices = [] }) {
  modal.title.textContent = title;
  modal.text.textContent = formatText(text);
  modal.extra.innerHTML = "";
  modal.message.textContent = "";
  modal.actions.innerHTML = "";
  if (extra) modal.extra.append(extra);
  if (choices.length) modal.extra.append(makeChoiceList(choices));
  const closeButton = document.createElement("button");
  closeButton.textContent = "닫기";
  closeButton.addEventListener("click", closeModal);
  modal.actions.append(closeButton);
  modal.backdrop.classList.add("active");
}
function closeModal() { modal.backdrop.classList.remove("active"); }
modal.backdrop.addEventListener("click", (event) => { if (event.target === modal.backdrop) closeModal(); });

function makeChoiceList(choices) {
  const list = document.createElement("div");
  list.className = "choice-list";
  choices.forEach((choice) => {
    const item = document.createElement("a");
    item.className = "choice";
    item.textContent = "▶ " + choice.label;
    item.addEventListener("click", choice.onClick);
    list.append(item);
  });
  return list;
}

function makeAnswerBox(correct, onSuccess, placeholder = "정답 입력") {
  const wrap = document.createElement("div");
  const input = document.createElement("input");
  input.className = "text-answer";
  input.placeholder = placeholder;
  const check = () => {
    if (normalizeAnswer(input.value) === normalizeAnswer(correct)) onSuccess();
    else modal.message.textContent = "틀렸다.";
  };
  input.addEventListener("keydown", (event) => { if (event.key === "Enter") check(); });
  wrap.append(input);
  wrap.append(makeChoiceList([{ label: "확인", onClick: check }]));
  return wrap;
}

function memoChoice(id) {
  return {
    label: hasItem(id) ? "✓ 메모를 챙겼다" : "메모 챙기기",
    onClick: () => {
      if (addItem(id)) modal.message.textContent = "메모를 인벤토리에 넣었다.";
      else modal.message.textContent = "이미 챙겼다.";
    }
  };
}

function makeInventoryPicker(onPick) {
  const grid = document.createElement("div");
  grid.className = "inv-grid";
  if (state.inventory.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "아무것도 없다.";
    grid.append(empty);
    return grid;
  }
  state.inventory.forEach((id) => {
    const item = ITEMS[id];
    const row = document.createElement("div");
    row.className = "inv-item";
    const img = document.createElement("img");
    img.src = item.img;
    img.alt = item.name;
    row.append(img);
    const label = document.createElement("span");
    label.textContent = item.type === "memo" ? `${item.code} ${item.result}` : item.name;
    row.append(label);
    row.addEventListener("click", () => onPick(id, item));
    grid.append(row);
  });
  return grid;
}

function openInventory() {
  openModal({
    title: "인벤토리",
    text: "",
    extra: makeInventoryPicker((id, item) => {
      if (item.type === "memo") openModal({ title: "숫자야구 메모", text: `${item.code}\n${item.result}` });
    })
  });
}
$("#inventoryButton").addEventListener("click", openInventory);

function playAudio(src) {
  const audio = $("#bgm");
  if (state.currentAudio !== src) {
    audio.src = src;
    state.currentAudio = src;
  }
  audio.play().catch(() => {});
  $("#musicButton").classList.add("active");
  $("#musicButton").textContent = "일시정지";
}
$("#musicButton").addEventListener("click", () => {
  const audio = $("#bgm");
  if (audio.paused) {
    audio.play();
    $("#musicButton").textContent = "일시정지";
  } else {
    audio.pause();
    $("#musicButton").textContent = "재생";
  }
});

const ransomLines = [
  "연시은 보아라.",
  "네 남자 친구 금성제를 납치했다.",
  "금성제를 돌려받고 싶으면",
  "그 방에서 탈출해라.",
  "기간은 100일인 7월 2일까지.",
  "행운을 빈다."
];

function makeRansomText() {
  const box = $("#ransomText");
  box.innerHTML = "";
  const light = ["#fff", "#f2ead8", "#e4e4e4", "#f7f1c9", "#fff0f4", "#eef1ff"];
  const dark = ["#111", "#222", "#3a3a3a", "#000"];
  const fonts = ["Georgia,serif", "Times New Roman,serif", "Courier New,monospace", "Impact,fantasy", "Arial,sans-serif", "Verdana,sans-serif"];
  ransomLines.forEach((line) => {
    const lineEl = document.createElement("div");
    lineEl.className = "ransom-line";
    [...line].forEach((ch) => {
      if (ch === " ") {
        const space = document.createElement("span");
        space.className = "space";
        lineEl.append(space);
        return;
      }
      const span = document.createElement("span");
      span.className = "cut";
      span.textContent = ch;
      let bg, color;
      const mode = Math.random();
      if (mode < .26) { bg = dark[Math.floor(Math.random() * dark.length)]; color = "#fff"; }
      else if (mode < .44) { bg = light[Math.floor(Math.random() * light.length)]; color = "#8a0000"; }
      else { bg = light[Math.floor(Math.random() * light.length)]; color = "#111"; }
      span.style.setProperty("--bg", bg);
      span.style.setProperty("--color", color);
      span.style.setProperty("--font", fonts[Math.floor(Math.random() * fonts.length)]);
      span.style.setProperty("--size", `${18 + Math.floor(Math.random() * 11)}px`);
      span.style.setProperty("--weight", Math.random() > .42 ? "800" : "500");
      span.style.setProperty("--rot", `${Math.random() * 10 - 5}deg`);
      span.style.setProperty("--y", `${Math.random() * 5 - 2.5}px`);
      span.style.setProperty("--spacing", `${Math.random() * .08}em`);
      lineEl.append(span);
    });
    box.append(lineEl);
  });
}

$("#closedEnvelope").addEventListener("click", () => {
  makeRansomText();
  $("#startButton").classList.remove("show");
  showScreen("letter");
  setTimeout(() => $("#startButton").classList.add("show"), 5000);
});
$("#startButton").addEventListener("click", () => showScreen("study"));
$("#backButton").addEventListener("click", () => {
  $("#studyMap").classList.remove("dimmed");
  showScreen("study");
});

const COLOR_MAPS = {
  study: [
    ["cabinet", 0, 0, 200],
    ["book1", 255, 230, 0],
    ["book2", 0, 190, 0],
    ["cat", 255, 110, 180],
    ["fireplace", 0, 200, 255],
    ["bag", 140, 60, 210],
    ["gramophone", 230, 0, 0],
    ["table", 255, 130, 0]
  ],
  room2: [
    ["bed", 230, 0, 0],
    ["piano", 255, 130, 0],
    ["rose", 255, 230, 0],
    ["chess", 0, 190, 0],
    ["closet", 0, 200, 255],
    ["chair2", 0, 0, 200],
    ["mirror", 140, 60, 210],
    ["window", 255, 110, 180]
  ]
};

function loadMask(room, src) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 401;
    canvas.height = 403;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, 401, 403);
    try { maskStore[room] = ctx.getImageData(0, 0, 401, 403); }
    catch { maskStore[room] = null; }
  };
  img.src = src;
}

function getNearestColor(room, r, g, b) {
  let best = null;
  let bestDistance = Infinity;
  for (const item of COLOR_MAPS[room]) {
    const distance = (r - item[1]) ** 2 + (g - item[2]) ** 2 + (b - item[3]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = item[0];
    }
  }
  return bestDistance < 12000 ? best : null;
}

function getStudyTargetByPosition(x, y) {
  // 서재는 좌표 우선 판정으로 고정한다.
  // 실제 방 이미지 401x403 기준.

  // 수납장: 왼쪽 유리 장식장. 위쪽 전등 제외.
  if (x >= 18 && x <= 72 && y >= 156 && y <= 286) return "cabinet";

  // 책장1: 수납장 옆 첫 번째 책장.
  if (x >= 70 && x <= 148 && y >= 94 && y <= 270) return "book1";

  // 책장2: 사슴 장식 쪽 두 번째 책장.
  if (x >= 146 && x <= 224 && y >= 70 && y <= 244) return "book2";

  // 고양이: 오른쪽 벽 선반 위.
  if (x >= 324 && x <= 370 && y >= 98 && y <= 164) return "cat";

  // 벽난로: 오른쪽 아래.
  if (x >= 306 && x <= 389 && y >= 203 && y <= 292) return "fireplace";

  // 가방: 책상 오른쪽 아래 작은 가방.
  if (x >= 246 && x <= 305 && y >= 250 && y <= 315) return "bag";

  // 축음기: 아래 중앙 축음기.
  if (x >= 160 && x <= 226 && y >= 292 && y <= 366) return "gramophone";

  // 협탁: 축음기 아래 받침/협탁.
  if (x >= 170 && x <= 226 && y >= 350 && y <= 402) return "table";

  return null;
}

function handleMapClick(room, event) {
  const data = maskStore[room];
  if (!data) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) * 401 / rect.width);
  const y = Math.floor((event.clientY - rect.top) * 403 / rect.height);
  const idx = (y * 401 + x) * 4;
  const r = data.data[idx];
  const g = data.data[idx + 1];
  const b = data.data[idx + 2];
  const a = data.data[idx + 3];
  if (a < 20) return;
  let id = null;

  if (room === "study") {
    id = getStudyTargetByPosition(x, y);
  } else {
    id = getNearestColor(room, r, g, b);
  }

  if (id && handlers[id]) handlers[id]();
}

document.querySelectorAll(".map-hit-layer").forEach((layer) => {
  layer.addEventListener("click", (event) => handleMapClick(layer.dataset.room, event));
});
loadMask("study", CONFIG.studyMask);
loadMask("room2", CONFIG.room2Mask);

function goRoom2() {
  closeModal();
  $("#studyMap").classList.remove("dimmed");
  showScreen("room2");
}

function makeLock(correct, onSuccess) {
  const wrap = document.createElement("div");
  const lock = document.createElement("div");
  lock.className = "lock";
  const values = [0, 0, 0, 0, 0];
  values.forEach((_, i) => {
    const dial = document.createElement("div");
    dial.className = "dial";
    const up = document.createElement("button");
    up.textContent = "▲";
    const num = document.createElement("div");
    num.className = "num";
    num.textContent = "0";
    const down = document.createElement("button");
    down.textContent = "▼";
    up.addEventListener("click", () => { values[i] = (values[i] + 1) % 10; num.textContent = values[i]; });
    down.addEventListener("click", () => { values[i] = (values[i] + 9) % 10; num.textContent = values[i]; });
    dial.append(up, num, down);
    lock.append(dial);
  });
  wrap.append(lock);
  wrap.append(makeChoiceList([{
    label: "열기",
    onClick: () => {
      if (values.join("") === correct) onSuccess();
      else modal.message.textContent = "열리지 않는다.";
    }
  }]));
  return wrap;
}

function showFinalLetter() {
  $("#letterContent").textContent = `To. 연시은
야, 졸라 신기하긴 하다. 어떻게 벌써 100일이지?
처음 네가 누가 봐도 구라인 것처럼 고백했을 땐 상상도 못했는데.
동해물과 백두산이 마르고 닳도록
하느님이 보우하사 우리나라 만세
무궁화 삼천리 화려강산
대한사람 대한으로 길이 보전하세
남산위에 저 소나무 철갑을 두른 듯
바람서리 불변함은 우리 기상일세
무궁화 삼천리 화려강산
대한사람 대한으로 길이 보전하세
가을하늘 공활한데 높고 구름 없이
밝은 달은 우리 가슴 일편단심일세
무궁화 삼천리 화려강산
대한사람 대한으로 길이 보전하세
이 기상과 이맘으로 충성을 다하여
괴로우나 즐거우나 나라 사랑하세
무궁화 삼천리 화려강산
대한사람 대한으로 길이 보전하세

From. 금성제`;
  closeModal();
  showScreen("final");
}

const handlers = {
  cabinet() {
    openModal({
      title: "수납장",
      text: "수납장을 열었다.\n안쪽에는 책 몇 권과 스크랩북이 들어 있었다.\n스크랩북에는 영화 티켓이 들어 있다.\n영화 제목은…… '♠♠♤●●●○◇◇◇.'\n같이 봤던 영화 티켓인데.\n금성제가 스크랩을 해둔 건가?"
    });
  },

  book1() {
    openModal({
      title: "책장",
      text: "영화 대본집, 추리 소설, 모모, 그리고 문제집, 참고서들이 가득하다.\n가장 밑 칸에 들어있는 건…… 미스터리 잡지인 '■■ □□□□'.\n금성제가 가지고 있다고 말했던 책인 것 같다."
    });
  },

  book2() {
    openModal({
      title: "책장",
      text: "갖가지 책들이 엉망진창으로 꽂혀 있다.\n표지도 제각각, 장르도 제각각.\n이래서는 원하는 책을 한 번에 찾기 힘들지 않나?\n심지어는 뒤집힌 책들도 있다.\n…… 어?\n잠깐, 자세히 보니 책장 한 구역이 붉게 표시되어 있다.\n'책을 올바른 순서로 꽂아 책 제목의 첫 글자만 읽었을 때 ■■♠♠□□□□(이)가 되도록 맞춰라.' 라고 적혀 있다.",
      extra: makeAnswerBox("계간악마미스터리", () => {
        $("#studyMap").classList.add("shake");
        setTimeout(() => $("#studyMap").classList.remove("shake"), 500);
        setTimeout(() => $("#studyMap").classList.add("dimmed"), 300);
        openModal({
          title: "책장",
          text: "올바른 책을 찾아 꽂으니 책장이 덜컹 움직인다.\n…… 아무래도 이 책장은 문이었던 모양이다.\n책장이 끼이익 소리를 내며 묵직하게 열린다.",
          choices: [{ label: "다음 방으로 이동", onClick: goRoom2 }]
        });
      })
    });
  },

  cat() {
    openModal({
      title: "고양이 인형",
      text: "금성제에게 줬던 고양이 인형……인 줄 알았는데 약간 다르다.\n이 고양이 인형은 턱시도지만, 금성제에게 줬던 인형은, 그냥 검은 고양이였으니까.\n그러니까, 그게, 어디에서 샀던 거더라.\n가게 이름이 뭐였지?",
      extra: makeAnswerBox("말랑필로우", () => {
        openModal({
          title: "고양이 인형",
          text: "맞아. 그런 이름이었지.\n아슬아슬한 높이 탓에 손을 겨우 뻗어 고양이 인형을 집었다.\n고양이 인형의 배에는 '27831 1S 2B' 라고 적혀 있다.\n숫자 야구 같네.",
          choices: [memoChoice("memoCat")]
        });
      })
    });
  },

  fireplace() {
    openModal({ title: "벽난로", text: "장작 타는 소리가 기분 좋게 들린다." });
  },

  bag() {
    const extra = document.createElement("div");
    const postit = document.createElement("div");
    postit.className = "postit";
    postit.textContent = "이 가방을 열면 금성제를 만날 수 있다.";
    extra.append(postit);
    extra.append(makeLock("31890", () => {
      openModal({
        title: "가방",
        text: "가방이 열렸다!\n안에는……",
        choices: [{ label: "편지 읽기", onClick: showFinalLetter }]
      });
    }));
    openModal({ title: "가방", text: "가방에는 포스트잇이 붙어 있다.", extra });
  },

  gramophone() {
    openModal({
      title: "축음기",
      text: "축음기처럼 생겼지만 자세히 보니 블루투스 스피커다.\n유튜브와 연결된 듯한데…….\n귀에 익은 노래가 흘러나온다.\n이 노래는 분명, 그때 금성제한테 좋다고 했던 극아타의……"
    });
  },

  table() {
    openModal({
      title: "협탁",
      text: "축음기 아래의 협탁은 위, 아래 둘로 나뉘어 있다.\n둘 다 잠겨 있는 것 같고…….\n어느 쪽부터 풀어볼까?",
      choices: [
        {
          label: "위쪽 칸",
          onClick: () => openModal({
            title: "위쪽 칸",
            text: "위쪽 칸에는 암호가 걸려 있다.",
            extra: makeAnswerBox("면목중학교", () => {
              playAudio(CONFIG.audioTop);
              openModal({
                title: "협탁",
                text: "서랍이 열렸다.\n신기하게 노래가 흘러나온다.\n서랍 안에는 '97083 0S 4B'라고 적힌 메모가 들어 있었다.\n숫자 야구 같네.",
                choices: [memoChoice("memoTop")]
              });
            })
          })
        },
        {
          label: "아래쪽 칸",
          onClick: () => openModal({
            title: "아래쪽 칸",
            text: "아래쪽 칸에는 암호가 걸려 있다.",
            extra: makeAnswerBox("다시다시만나", () => {
              playAudio(CONFIG.audioBottom);
              openModal({
                title: "협탁",
                text: "서랍이 열렸다.\n신기하게 노래가 흘러나온다.\n서랍 안에는 '79436 0S 2B'라고 적힌 메모가 들어 있었다.\n숫자 야구 같네.",
                choices: [memoChoice("memoBottom")]
              });
            })
          })
        }
      ]
    });
  },

  bed() {
    openModal({ title: "침대", text: "푹신한 침대다.\n매트리스가 좋은 건지 앉아 보아도 끼익거리는 소리 없이 부드럽다." });
  },

  piano() {
    openModal({
      title: "그랜드 피아노",
      text: "건반을 아무거나 눌러 보면 좋은 소리가 울린다.\n제법 고급스러운 피아노인 것 같다.",
      choices: [{
        label: "연주하기",
        onClick: () => openModal({
          title: "그랜드 피아노",
          text: "어떤 곡을 연주할까?",
          extra: makeAnswerBox("코끼리", () => {
            openModal({
              title: "그랜드 피아노",
              text: "코끼리를 전부 연주하자 앉아 있던 피아노 의자에서 달칵 소리가 난다.\n일어나서 열어 보면, 안에는 작은 종이 쪽지가 들어 있었다.\n'54930 1S 2B'.\n숫자 야구 같네.",
              choices: [memoChoice("memoPiano")]
            });
          })
        })
      }]
    });
  },

  rose() {
    openModal({ title: "장미 화병", text: "파란색 장미가 꽂혀 있다.\n조화일까?" });
  },

  chess() {
    openModal({
      title: "체스 판",
      text: "체스다.\n금성제는 체스를 둘 줄 알까?\n\n그런데 자세히 보니…….\n체스판에 글자가 적혀 있다.\n'세 번째 찍어준 도장이 제목인 노래도 있대.'"
    });
  },

  closet() {
    openModal({
      title: "옷장",
      text: "옷장을 열었다.\n안에는 교복이 여러 벌 들어있다.\n벽산, 은장, 강학, 여일, 지성……?\n뒤에 두 개는 왜 들어있는 거지?",
      choices: [
        ["byeoksan", "벽산 교복 챙기기"],
        ["eunjang", "은장 교복 챙기기"],
        ["ganghak", "강학 교복 챙기기"],
        ["yeoil", "여일 교복 챙기기"],
        ["jiseong", "지성 교복 챙기기"]
      ].map(([id, label]) => ({
        label: hasItem(id) ? "✓ " + ITEMS[id].name : label,
        onClick: () => {
          if (addItem(id)) modal.message.textContent = ITEMS[id].name + "을 챙겼다.";
          else modal.message.textContent = "이미 챙겼다.";
        }
      }))
    });
  },

  chair2() {
    openModal({
      title: "의자",
      text: "의자다.\n조금 무겁지만 이 방 안에서라면 옮길 수 있을 것 같다.",
      choices: [{
        label: hasItem("chair") ? "✓ 의자를 챙겼다" : "의자 챙기기",
        onClick: () => {
          if (addItem("chair")) modal.message.textContent = "의자를 챙겼다.";
          else modal.message.textContent = "이미 챙겼다.";
        }
      }]
    });
  },

  mirror() {
    openModal({
      title: "거울",
      text: "거울에 모습이 비친다.\n금성제가 좋아하는……",
      choices: [{
        label: "옷을 갈아입는다",
        onClick: () => openModal({
          title: "인벤토리",
          text: "어떤 옷을 입어 볼까?",
          extra: makeInventoryPicker((id, item) => wearUniform(id, item))
        })
      }]
    });
  },

  window() {
    openModal({
      title: "창문",
      text: "걷힌 커튼 사이로 햇빛이 들어온다.\n납치범이 가둔 방치고는 제법 따스하고 평화롭다.\n어라?\n창틀 위쪽에 뭔가가 있는 것 같은데…….\n손이 안 닿아.",
      choices: [{
        label: "도구 사용하기",
        onClick: () => openModal({
          title: "인벤토리",
          text: "무엇을 사용할까?",
          extra: makeInventoryPicker((id) => {
            if (id === "chair") {
              openModal({
                title: "창문",
                text: "의자를 밟고 올라가 창틀 위에 있는 것을 집었다.\n새콤달콤 울트라 키위 맛?\n아래에 작은 쪽지가 깔려 있다.\n'65249 0S 1B' 숫자 야구처럼 보인다.",
                choices: [memoChoice("memoWindow")]
              });
            } else {
              modal.message.textContent = "이걸로는 닿지 않을 것 같다.";
            }
          })
        })
      }]
    });
  }
};

function wearUniform(id, item) {
  if (item.type !== "uniform") {
    modal.message.textContent = "이건 입을 수 없어…….";
    return;
  }

  const texts = {
    yeoil: "여일고 교복을 입은 모습이 거울에 비친다.\n나백진이 입었을 땐 좀 더 차가워 보이는 이미지였는데…….\n팔을 내리면 소매에 손이 가려지는 게, 사이즈도 조금 큰 것 같다.\n누구 교복인 거지?",
    jiseong: "지성고 교복을 입은 모습이 거울에 비친다.\n이런 교복이었던가?\n사실 잘 기억은 안 난다.\n조금 어색하네……",
    byeoksan: "벽산고 교복을 입은 모습이 거울에 비친다.\n……\n금성제가 보면 어떤 반응일까?",
    ganghak: "강학고 교복을 입은 모습이 거울에 비친다.\n금성제가 자주 입던 호랑이 그림 티셔츠까지 입고 나니 뭔가, 굉장히 오묘한 느낌이 든다.\n금성제는 어디 있는 거지?",
    eunjang: "은장고 교복을 입은 모습이 거울에 비친다.\n익숙한 모습, 익숙한 냄새.\n혹시 내 교복인가?\n어라, 주머니에 뭔가가 들어있다.\n'23509 0S 3B' 라고 적힌 쪽지.\n숫자 야구 같네."
  };

  openModal({
    title: "거울",
    text: texts[id],
    choices: id === "eunjang" ? [memoChoice("memoMirror")] : []
  });
}
