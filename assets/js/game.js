(() => {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestScoreEl = document.getElementById("best-score");
  const messageEl = document.getElementById("game-message");
  const restartBtn = document.getElementById("restart-btn");

  const world = {
    width: canvas.width,
    height: canvas.height,
    groundY: canvas.height - 34,
  };

  const player = {
    x: 78,
    y: 0,
    width: 38,
    height: 46,
    vy: 0,
    gravity: 0.58,
    jumpForce: -11.8,
    onGround: true,
  };

  let obstacles = [];
  let score = 0;
  let best = Number(localStorage.getItem("kevin_jump_best") || 0);
  let frameCount = 0;
  let spawnEvery = 95;
  let speed = 6;
  let running = false;
  let gameOver = false;

  bestScoreEl.textContent = String(best);

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function resetGame() {
    obstacles = [];
    score = 0;
    frameCount = 0;
    speed = 6;
    spawnEvery = 95;
    gameOver = false;

    player.y = world.groundY - player.height;
    player.vy = 0;
    player.onGround = true;

    scoreEl.textContent = "0";
    messageEl.textContent = "Press Space to jump.";
    render();
  }

  function startGame() {
    if (running) {
      return;
    }
    resetGame();
    running = true;
    messageEl.textContent = "";
    requestAnimationFrame(tick);
  }

  function jump() {
    if (!running) {
      startGame();
      return;
    }
    if (gameOver) {
      startGame();
      return;
    }
    if (!player.onGround) {
      return;
    }
    player.vy = player.jumpForce;
    player.onGround = false;
  }

  function spawnObstacle() {
    const height = randomInt(28, 62);
    const width = randomInt(18, 34);
    const obstacle = {
      x: world.width + randomInt(0, 18),
      y: world.groundY - height,
      width,
      height,
      passed: false,
    };
    obstacles.push(obstacle);

    if (score > 12 && Math.random() < 0.24) {
      const gap = randomInt(48, 80);
      const secondHeight = randomInt(22, 52);
      const secondWidth = randomInt(16, 30);
      obstacles.push({
        x: obstacle.x + gap,
        y: world.groundY - secondHeight,
        width: secondWidth,
        height: secondHeight,
        passed: false,
      });
    }
  }

  function intersects(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function update() {
    frameCount += 1;
    speed = Math.min(12, 6 + score * 0.045);

    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y >= world.groundY - player.height) {
      player.y = world.groundY - player.height;
      player.vy = 0;
      player.onGround = true;
    }

    if (frameCount % spawnEvery === 0) {
      spawnObstacle();
      spawnEvery = randomInt(72, 108);
    }

    const hitbox = {
      x: player.x + 5,
      y: player.y + 4,
      width: player.width - 9,
      height: player.height - 6,
    };

    for (let i = obstacles.length - 1; i >= 0; i -= 1) {
      const obs = obstacles[i];
      obs.x -= speed;

      if (!obs.passed && obs.x + obs.width < player.x) {
        obs.passed = true;
        score += 1;
        scoreEl.textContent = String(score);
      }

      if (obs.x + obs.width < -4) {
        obstacles.splice(i, 1);
        continue;
      }

      if (intersects(hitbox, obs)) {
        endGame();
      }
    }
  }

  function endGame() {
    gameOver = true;
    running = false;
    if (score > best) {
      best = score;
      localStorage.setItem("kevin_jump_best", String(best));
      bestScoreEl.textContent = String(best);
    }
    messageEl.textContent = `Game over. Score ${score}. Press Space or Restart.`;
  }

  function drawBackground() {
    ctx.clearRect(0, 0, world.width, world.height);

    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(0, 0, world.width, world.height);

    ctx.fillStyle = "rgba(15, 118, 110, 0.08)";
    for (let i = 0; i < 7; i += 1) {
      const hillX = ((i * 170) - (frameCount * (speed * 0.3))) % (world.width + 260);
      const x = hillX - 130;
      ctx.beginPath();
      ctx.arc(x, world.groundY + 20, 120, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(0, world.groundY, world.width, world.height - world.groundY);

    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(0, world.groundY - 2, world.width, 2);
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x, y + 10, player.width, player.height - 10);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(x + 7, y, player.width - 14, 16);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 9, y + 3, 6, 6);
    ctx.fillRect(x + 23, y + 3, 6, 6);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x + 11, y + 5, 2, 2);
    ctx.fillRect(x + 25, y + 5, 2, 2);
  }

  function drawObstacles() {
    for (const obs of obstacles) {
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

      ctx.fillStyle = "#9a3412";
      ctx.fillRect(obs.x + 2, obs.y + 2, obs.width - 4, 6);
    }
  }

  function render() {
    drawBackground();
    drawPlayer();
    drawObstacles();
  }

  function tick() {
    if (!running) {
      render();
      return;
    }

    update();
    render();

    if (!gameOver) {
      requestAnimationFrame(tick);
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space") {
      return;
    }
    event.preventDefault();
    jump();
  });

  canvas.addEventListener("pointerdown", () => {
    jump();
  });

  restartBtn.addEventListener("click", () => {
    startGame();
  });

  resetGame();
  messageEl.textContent = "Press Space to start. Press Space again to jump.";
})();
