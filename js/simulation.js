/* ===== Maybe Box simulation logic =====
   Payout logic is separated from canvas drawing so the simulation stays
   understandable and easy to debug. Odds settings change the actual
   probability of a reward, not just a label. */

(function () {
  "use strict";

  var DEFAULTS = {
    rows: 8,
    cols: 9,
    colStep: 50,
    rowStep: 52,
    originX: 0,
    originY: 0,
    centerCol: 4
  };

  var state = {
    rows: DEFAULTS.rows,
    cols: DEFAULTS.cols,
    colStep: DEFAULTS.colStep,
    rowStep: DEFAULTS.rowStep,
    originX: DEFAULTS.originX,
    originY: DEFAULTS.originY,
    centerCol: DEFAULTS.centerCol,
    odds: 0.5,
    pushes: 0,
    rewards: 0,
    returns: 0,
    running: false
  };

  var ODDS_PRESETS = {
    learn: 0.80,
    play: 0.50,
    hunt: 0.20
  };

  function pegX(col, row) {
    return state.originX + (col - state.centerCol) * state.colStep + (row % 2 === 1 ? state.colStep / 2 : 0);
  }

  function pegY(row) {
    return state.originY + row * state.rowStep;
  }

  // Simulate one ball falling through staggered peg rows.
  // Returns the row-by-row path plus the payout result.
  function simulateDrop() {
    var path = [];
    var col = state.centerCol;
    var x = pegX(col, 0);
    var y = pegY(0);
    path.push({ x: x, y: y, row: 0, col: col });

    for (var r = 0; r < state.rows; r++) {
      var goRight = Math.random() < 0.5;
      col = goRight ? Math.min(col + 1, state.cols - 1) : Math.max(col - 1, 0);
      x = pegX(col, r + 1);
      y = pegY(r + 1);
      path.push({ x: x, y: y, row: r + 1, col: col });
    }

    // Payout logic: separate from the visual path. The odds setting
    // directly controls the probability of a reward.
    var reward = Math.random() < state.odds;

    return { path: path, reward: reward, finalCol: col };
  }

  function push() {
    if (state.running) return null;
    var result = simulateDrop();
    state.pushes += 1;
    if (result.reward) { state.rewards += 1; } else { state.returns += 1; }
    return result;
  }

  function setOdds(name) {
    if (ODDS_PRESETS[name] !== undefined) {
      state.odds = ODDS_PRESETS[name];
    }
    return state.odds;
  }

  function reset() {
    state.pushes = 0;
    state.rewards = 0;
    state.returns = 0;
  }

  function getStats() {
    var pct = state.pushes === 0 ? 0 : (state.rewards / state.pushes) * 100;
    return {
      pushes: state.pushes,
      rewards: state.rewards,
      returns: state.returns,
      payout: pct,
      odds: state.odds
    };
  }

  function configure(cfg) {
    if (cfg.originX !== undefined) state.originX = cfg.originX;
    if (cfg.originY !== undefined) state.originY = cfg.originY;
    if (cfg.rows !== undefined) state.rows = cfg.rows;
    if (cfg.cols !== undefined) state.cols = cfg.cols;
    if (cfg.colStep !== undefined) state.colStep = cfg.colStep;
    if (cfg.rowStep !== undefined) state.rowStep = cfg.rowStep;
    if (cfg.centerCol !== undefined) state.centerCol = cfg.centerCol;
  }

  window.maybeBoxSim = {
    configure: configure,
    config: function () {
      return {
        rows: state.rows,
        cols: state.cols,
        colStep: state.colStep,
        rowStep: state.rowStep,
        originX: state.originX,
        originY: state.originY,
        centerCol: state.centerCol,
        odds: state.odds
      };
    },
    pegX: pegX,
    pegY: pegY,
    simulateDrop: simulateDrop,
    push: push,
    setOdds: setOdds,
    reset: reset,
    getStats: getStats,
    ODDS_PRESETS: ODDS_PRESETS
  };
})();
