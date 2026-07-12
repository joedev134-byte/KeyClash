/**
 * KeyClash ads — visibility only.
 *
 * Ad codes are embedded statically in index.html (AdsTerra invoke.js often uses
 * document.write, which fails if injected after page load).
 *
 * This file only shows home slots on the home screen and hides them in
 * lobby / race / practice so typing UX stays clean.
 */
(function () {
  "use strict";

  var HOME_SLOT_IDS = ["home-ad-slot", "home-native-ad-slot"];

  function setHomeAdsVisible(visible) {
    HOME_SLOT_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.hidden = !visible;
    });
  }

  function isHomeActive() {
    var home = document.getElementById("screen-home");
    return !!(home && home.classList.contains("active"));
  }

  function init() {
    setHomeAdsVisible(isHomeActive());
  }

  window.KeyClashAds = {
    setHomeVisible: function (visible) {
      setHomeAdsVisible(!!visible);
    },
    /** Results slots: no live keys yet — no-op for API compat */
    load: function () {
      return Promise.resolve(false);
    },
    ensure: function () {
      return Promise.resolve(false);
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
