const POKE_API = "https://pokeapi.co/api/v2/pokemon";
const POKE_SPECIES_API = "https://pokeapi.co/api/v2/pokemon-species";
const MOCK_API = "https://6a1ce1e58858a003817c2346.mockapi.io/pokemon";
const FIRST_GENERATION_MIN_ID = 1;
const FIRST_GENERATION_MAX_ID = 151;
const STORAGE_KEY = "pokemon-quiz-player";

const typeLabels = {
  normal: "노말",
  fire: "불꽃",
  water: "물",
  electric: "전기",
  grass: "풀",
  ice: "얼음",
  fighting: "격투",
  poison: "독",
  ground: "땅",
  flying: "비행",
  psychic: "에스퍼",
  bug: "벌레",
  rock: "바위",
  ghost: "고스트",
  dragon: "드래곤",
  dark: "악",
  steel: "강철",
  fairy: "페어리",
};

const typeColors = {
  normal: "#3f3f46",
  fire: "#111111",
  water: "#2b2b2b",
  electric: "#4b4b4b",
  grass: "#202020",
  ice: "#525252",
  fighting: "#171717",
  poison: "#343434",
  ground: "#404040",
  flying: "#5a5a5a",
  psychic: "#262626",
  bug: "#383838",
  rock: "#1f1f1f",
  ghost: "#303030",
  dragon: "#121212",
  dark: "#000000",
  steel: "#474747",
  fairy: "#575757",
};

const rankBalls = [
  {
    min: 30,
    name: "마스터볼",
    item: "master-ball",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
  },
  {
    min: 20,
    name: "하이퍼볼",
    item: "ultra-ball",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
  },
  {
    min: 10,
    name: "슈퍼볼",
    item: "great-ball",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
  },
  {
    min: 0,
    name: "몬스터볼",
    item: "poke-ball",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
  },
];

const koreanNames = {
  bulbasaur: "이상해씨",
  ivysaur: "이상해풀",
  venusaur: "이상해꽃",
  charmander: "파이리",
  charmeleon: "리자드",
  charizard: "리자몽",
  squirtle: "꼬부기",
  wartortle: "어니부기",
  blastoise: "거북왕",
  caterpie: "캐터피",
  pikachu: "피카츄",
  raichu: "라이츄",
  sandshrew: "모래두지",
  nidoran: "니드런",
  clefairy: "삐삐",
  vulpix: "식스테일",
  jigglypuff: "푸린",
  zubat: "주뱃",
  oddish: "뚜벅쵸",
  psyduck: "고라파덕",
  growlithe: "가디",
  poliwag: "발챙이",
  abra: "캐이시",
  machop: "알통몬",
  geodude: "꼬마돌",
  slowpoke: "야돈",
  magnemite: "코일",
  gengar: "팬텀",
  onix: "롱스톤",
  cubone: "탕구리",
  chansey: "럭키",
  kangaskhan: "캥카",
  staryu: "별가사리",
  magikarp: "잉어킹",
  lapras: "라프라스",
  ditto: "메타몽",
  eevee: "이브이",
  vaporeon: "샤미드",
  jolteon: "쥬피썬더",
  flareon: "부스터",
  snorlax: "잠만보",
  dratini: "미뇽",
  dragonair: "신뇽",
  dragonite: "망나뇽",
  mewtwo: "뮤츠",
  mew: "뮤",
};

const defaultPlayer = {
  id: null,
  name: "",
  password: "",
  isAuthenticated: false,
  coins: 0,
  rankScore: 0,
  normalCorrect: 0,
  normalWrong: 0,
  updatedAt: "",
};

let player = loadPlayer();
let currentPokemon = null;
let answered = false;

document.addEventListener("DOMContentLoaded", () => {
  initFullscreenButton();
  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "normal") initGame("normal");
  if (page === "rank") initGame("rank");
});

function initFullscreenButton() {
  const button = document.querySelector("#fullscreenButton");
  if (!button) return;

  button.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen toggle failed", error);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    button.textContent = document.fullscreenElement ? "×" : "⛶";
    button.setAttribute("aria-label", document.fullscreenElement ? "전체화면 종료" : "전체화면 전환");
  });
}

function loadPlayer() {
  try {
    return { ...defaultPlayer, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ...defaultPlayer };
  }
}

function saveLocalPlayer() {
  player.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}

async function syncPlayer() {
  saveLocalPlayer();
  if (!player.name.trim()) return;

  const payload = {
    name: player.name,
    password: player.password,
    coins: player.coins,
    rankScore: player.rankScore,
    normalCorrect: player.normalCorrect,
    normalWrong: player.normalWrong,
    updatedAt: player.updatedAt,
  };

  try {
    if (player.id) {
      await fetch(`${MOCK_API}/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return;
    }

    const existing = await findMockPlayer(player.name);
    if (existing) {
      player.id = existing.id;
      await fetch(`${MOCK_API}/${existing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      const res = await fetch(MOCK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      player.id = data.id;
    }
    saveLocalPlayer();
  } catch (error) {
    console.warn("MockAPI sync failed. Local progress is preserved.", error);
  }
}

async function findMockPlayer(name) {
  const res = await fetch(`${MOCK_API}?name=${encodeURIComponent(name)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data.find((item) => item.name === name) : null;
}

function initHome() {
  const input = document.querySelector("#playerName");
  const passwordInput = document.querySelector("#playerPassword");
  const button = document.querySelector("#savePlayer");
  const status = document.querySelector("#playerStatus");

  input.value = player.name;
  passwordInput.value = "";
  updateAuthUi();
  bindModeGuards();
  renderHomeStats();
  renderLiveRanking();
  setInterval(renderLiveRanking, 15000);

  button.addEventListener("click", async () => {
    const name = input.value.trim();
    const password = passwordInput.value.trim();
    if (!name) {
      status.textContent = "플레이어 이름을 먼저 입력해주세요.";
      return;
    }
    if (!password) {
      status.textContent = "비밀번호를 입력해야 플레이할 수 있습니다.";
      return;
    }

    button.disabled = true;
    status.textContent = "로그인 확인 중...";
    const result = await loginPlayer(name, password);
    button.disabled = false;
    status.textContent = result.message;
    updateAuthUi();
    renderHomeStats();
  });
}

function updateAuthUi() {
  const status = document.querySelector("#playerStatus");
  const modeCards = document.querySelectorAll(".mode-card");
  const loggedIn = player.isAuthenticated && player.name && player.password;

  modeCards.forEach((card) => card.classList.toggle("is-locked", !loggedIn));
  if (status && loggedIn) status.textContent = `${player.name}님으로 로그인 중입니다.`;
}

function bindModeGuards() {
  document.querySelectorAll(".mode-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (player.isAuthenticated && player.name && player.password) return;
      event.preventDefault();
      setText("#playerStatus", "먼저 이름과 비밀번호로 로그인해주세요.");
      document.querySelector("#playerName")?.focus();
    });
  });
}

async function loginPlayer(name, password) {
  try {
    const existing = await findMockPlayer(name);
    if (existing && existing.password && existing.password !== password) {
      return { ok: false, message: "비밀번호가 일치하지 않습니다." };
    }

    player = {
      ...defaultPlayer,
      ...existing,
      id: existing?.id || null,
      name,
      password,
      isAuthenticated: true,
      coins: Number(existing?.coins || 0),
      rankScore: Number(existing?.rankScore || 0),
      normalCorrect: Number(existing?.normalCorrect || 0),
      normalWrong: Number(existing?.normalWrong || 0),
    };

    await syncPlayer();
    return {
      ok: true,
      message: existing ? `${name}님, 다시 오신 걸 환영합니다.` : `${name}님의 계정을 만들었습니다.`,
    };
  } catch (error) {
    console.warn("Login failed", error);
    return { ok: false, message: "로그인을 처리하지 못했습니다. 잠시 후 다시 시도해주세요." };
  }
}

function renderHomeStats() {
  setText("#homeCoins", player.coins);
  setText("#homeRankScore", player.rankScore);
  setRankDisplay("#homeRankName", player.rankScore);
}

async function renderLiveRanking() {
  const list = document.querySelector("#rankingList");
  const updated = document.querySelector("#rankingUpdated");
  if (!list) return;

  try {
    const res = await fetch(MOCK_API);
    if (!res.ok) throw new Error("Ranking fetch failed");
    const players = await res.json();
    const ranking = Array.isArray(players)
      ? players
          .filter((item) => item.name)
          .sort((a, b) => {
            const scoreDiff = Number(b.rankScore || 0) - Number(a.rankScore || 0);
            if (scoreDiff) return scoreDiff;
            return Number(b.coins || 0) - Number(a.coins || 0);
          })
          .slice(0, 10)
      : [];

    if (!ranking.length) {
      list.innerHTML = `<p class="ranking-empty">아직 랭킹에 등록된 플레이어가 없습니다.</p>`;
    } else {
      list.innerHTML = ranking.map((item, index) => createRankingRow(item, index)).join("");
    }

    if (updated) updated.textContent = `최근 갱신 ${new Date().toLocaleTimeString("ko-KR")}`;
  } catch (error) {
    console.warn("Ranking load failed", error);
    list.innerHTML = `<p class="ranking-empty">랭킹을 불러오지 못했습니다.</p>`;
    if (updated) updated.textContent = "갱신 실패";
  }
}

function createRankingRow(item, index) {
  const score = Number(item.rankScore || 0);
  const coins = Number(item.coins || 0);
  const rank = getRank(score);
  return `
    <div class="ranking-row">
      <strong>${index + 1}</strong>
      <span>${escapeHtml(item.name)}</span>
      <span>${score}</span>
      <span class="rank-display">
        <img src="${rank.image}" alt="${rank.name} 이미지" />
        <span>${rank.name}</span>
      </span>
      <span>${coins}</span>
    </div>
  `;
}

function initGame(mode) {
  renderStats(mode);
  if (!requireLogin()) return;
  bindGameForm(mode);
  if (mode === "rank" && !canPlayRank()) {
    lockRankMode();
    return;
  }
  loadQuestion();
}

function requireLogin() {
  if (player.isAuthenticated && player.name && player.password) return true;
  const input = document.querySelector("#guessInput");
  const loading = document.querySelector("#loading");
  const nextButton = document.querySelector("#nextButton");
  const image = document.querySelector("#pokemonImage");

  currentPokemon = null;
  answered = true;
  if (input) input.disabled = true;
  if (nextButton) nextButton.disabled = true;
  if (loading) loading.classList.add("is-hidden");
  if (image) {
    image.removeAttribute("src");
    image.classList.remove("is-visible");
  }
  resetPokemonDetails();
  setResult("로그인한 플레이어만 플레이할 수 있습니다. 메인 페이지에서 이름과 비밀번호로 로그인해주세요.", "fail");
  return false;
}

function bindGameForm(mode) {
  const form = document.querySelector("#guessForm");
  const nextButton = document.querySelector("#nextButton");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentPokemon || answered) return;
    await submitAnswer(mode);
  });

  nextButton.addEventListener("click", loadQuestion);
}

async function loadQuestion() {
  answered = false;
  currentPokemon = null;
  const input = document.querySelector("#guessInput");
  const image = document.querySelector("#pokemonImage");
  const loading = document.querySelector("#loading");
  const nextButton = document.querySelector("#nextButton");

  if (document.body.dataset.page === "rank" && !canPlayRank()) {
    lockRankMode();
    return;
  }

  input.value = "";
  input.disabled = true;
  nextButton.disabled = true;
  image.classList.remove("is-visible");
  loading.classList.remove("is-hidden");
  resetPokemonDetails();
  setResult("이미지를 보고 포켓몬 이름을 맞춰보세요.", "");

  try {
    currentPokemon = await fetchRandomPokemon();
    image.src = currentPokemon.image;
    image.alt = `${currentPokemon.name} 이미지`;
    applyPokemonTheme(currentPokemon);
    renderPokemonPreview(currentPokemon);
    image.onload = () => {
      loading.classList.add("is-hidden");
      image.classList.add("is-visible");
    };
    input.disabled = false;
    input.focus();
  } catch (error) {
    console.error(error);
    loading.classList.add("is-hidden");
    setResult("포켓몬을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.", "fail");
    nextButton.disabled = false;
  }
}

async function fetchRandomPokemon() {
  const id =
    Math.floor(Math.random() * (FIRST_GENERATION_MAX_ID - FIRST_GENERATION_MIN_ID + 1)) +
    FIRST_GENERATION_MIN_ID;
  const [pokemonRes, speciesRes] = await Promise.all([
    fetch(`${POKE_API}/${id}`),
    fetch(`${POKE_SPECIES_API}/${id}`),
  ]);
  if (!pokemonRes.ok) throw new Error("Pokemon fetch failed");
  const data = await pokemonRes.json();
  const species = speciesRes.ok ? await speciesRes.json() : null;
  const koreanName =
    species?.names?.find((item) => item.language.name === "ko")?.name || koreanNames[data.name] || "";
  const genus = species?.genera?.find((item) => item.language.name === "ko")?.genus || "";
  const flavor =
    species?.flavor_text_entries?.find((item) => item.language.name === "ko")?.flavor_text ||
    species?.flavor_text_entries?.find((item) => item.language.name === "en")?.flavor_text ||
    "";
  const sprite = getPixelSprite(data.sprites);

  return {
    id: data.id,
    name: data.name,
    koreanName,
    genus,
    flavor: cleanFlavorText(flavor),
    height: data.height / 10,
    weight: data.weight / 10,
    baseExperience: data.base_experience || 0,
    types: data.types.map((item) => item.type.name),
    image: sprite,
  };
}

function getPixelSprite(sprites) {
  return (
    sprites?.versions?.["generation-i"]?.yellow?.front_default ||
    sprites?.versions?.["generation-i"]?.["red-blue"]?.front_default ||
    sprites?.versions?.["generation-ii"]?.crystal?.front_default ||
    sprites?.front_default
  );
}

async function submitAnswer(mode) {
  if (mode === "rank" && !canPlayRank()) {
    lockRankMode();
    return;
  }

  const input = document.querySelector("#guessInput");
  const guess = normalizeName(input.value);
  const english = normalizeName(currentPokemon.name);
  const korean = normalizeName(currentPokemon.koreanName);
  const isCorrect = guess && (guess === english || guess === korean);

  answered = true;
  input.disabled = true;
  document.querySelector("#nextButton").disabled = false;

  if (mode === "normal") {
    if (isCorrect) {
      player.coins += 1;
      player.normalCorrect += 1;
      setResult(`정답입니다! ${displayPokemonName()} 맞아요. 코인 +1`, "success");
    } else {
      player.normalWrong += 1;
      setResult(`아쉽습니다. 정답은 ${displayPokemonName()}입니다.`, "fail");
    }
  }

  if (mode === "rank") {
    if (isCorrect) {
      player.rankScore = Math.min(30, player.rankScore + 1);
      setResult(`정답입니다! 랭크 점수 +1, 현재 ${getRankName(player.rankScore)}입니다.`, "success");
    } else {
      player.coins = Math.max(0, player.coins - 1);
      setResult(`오답입니다. 정답은 ${displayPokemonName()}입니다. 코인 -1`, "fail");
    }
  }

  revealPokemonDetails();
  renderStats(mode);
  if (mode === "rank" && !canPlayRank()) lockRankMode();
  await syncPlayer();
}

function renderStats(mode) {
  setText("#coins", player.coins);

  if (mode === "normal") {
    setText("#correctCount", player.normalCorrect);
    setText("#wrongCount", player.normalWrong);
  }

  if (mode === "rank") {
    const rank = getRank(player.rankScore);
    setText("#rankScore", player.rankScore);
    setRankDisplay("#rankName", player.rankScore);
    setText("#rankBallLabel", rank.name);
    const ballImage = document.querySelector("#rankBallImage");
    if (ballImage) {
      ballImage.src = rank.image;
      ballImage.alt = `${rank.name} 이미지`;
    }
    const progress = document.querySelector("#rankProgress");
    if (progress) progress.style.width = `${Math.min(100, (player.rankScore / 30) * 100)}%`;
  }
}

function getRankName(score) {
  return getRank(score).name;
}

function getRank(score) {
  return rankBalls.find((rank) => score >= rank.min) || rankBalls[rankBalls.length - 1];
}

function setRankDisplay(selector, score) {
  const element = document.querySelector(selector);
  if (!element) return;
  const rank = getRank(score);
  element.classList.add("rank-display");
  element.innerHTML = `<img src="${rank.image}" alt="${rank.name} 이미지" /><span>${rank.name}</span>`;
}

function canPlayRank() {
  return player.coins > 0;
}

function lockRankMode() {
  const input = document.querySelector("#guessInput");
  const image = document.querySelector("#pokemonImage");
  const loading = document.querySelector("#loading");
  const nextButton = document.querySelector("#nextButton");

  currentPokemon = null;
  answered = true;
  if (input) input.disabled = true;
  if (nextButton) nextButton.disabled = true;
  if (image) {
    image.removeAttribute("src");
    image.classList.remove("is-visible");
  }
  if (loading) loading.classList.add("is-hidden");
  resetPokemonDetails();
  setResult("코인이 없어서 랭크 모드에 도전할 수 없습니다. 일반 모드에서 코인을 먼저 모아주세요.", "fail");
}

function resetPokemonDetails() {
  setText("#dexNumber", "No.---");
  setText("#dexName", "Who's that Pokemon?");
  setText("#pokemonHeight", "--");
  setText("#pokemonWeight", "--");
  setText("#pokemonExp", "--");
  setText("#dexFlavor", "정답을 제출하면 도감 설명이 공개됩니다.");
  const badges = document.querySelector("#typeBadges");
  if (badges) badges.innerHTML = "";
}

function renderPokemonPreview(pokemon) {
  setText("#dexNumber", `No.${String(pokemon.id).padStart(3, "0")}`);
  setText("#dexName", "");
  setText("#pokemonHeight", `${formatNumber(pokemon.height)} m`);
  setText("#pokemonWeight", `${formatNumber(pokemon.weight)} kg`);
  setText("#pokemonExp", pokemon.baseExperience || "--");
  setText("#dexFlavor", "이름은 아직 비공개입니다. 타입과 신체 데이터를 힌트로 활용하세요.");

  const badges = document.querySelector("#typeBadges");
  if (!badges) return;
  badges.innerHTML = pokemon.types
    .map((type) => {
      const label = typeLabels[type] || type;
      const color = typeColors[type] || "#667085";
      return `<span style="--badge-color: ${color}">${label}</span>`;
    })
    .join("");
}

function revealPokemonDetails() {
  if (!currentPokemon) return;
  setText("#dexName", displayPokemonName());
  setText("#dexFlavor", currentPokemon.flavor || "도감 설명이 아직 준비되지 않았습니다.");
}

function applyPokemonTheme(pokemon) {
  const primaryType = pokemon.types[0] || "normal";
  const color = typeColors[primaryType] || typeColors.normal;
  document.documentElement.style.setProperty("--type-color", color);
}

function cleanFlavorText(text) {
  return String(text || "").replace(/\s+/g, " ").replace(/\f/g, " ").trim();
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("-", "");
}

function displayPokemonName() {
  return currentPokemon.koreanName
    ? `${currentPokemon.koreanName} (${currentPokemon.name})`
    : currentPokemon.name;
}

function setResult(message, type) {
  const result = document.querySelector("#resultText");
  result.textContent = message;
  result.className = `result-text ${type}`.trim();
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}
