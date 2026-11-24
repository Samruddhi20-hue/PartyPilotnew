(() => {
  const input = document.getElementById("exploreLocation");
  const box = document.getElementById("exploreSuggestions");
  const gps = document.getElementById("useCurrentLocation");
  if (!input || !box) return;

  let timer = null;
  let controller = null;
  window.PARTYPILOT_LOCATION = null;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));

  function renderSuggestions(suggestions) {
    box._suggestions = suggestions || [];
    if (!suggestions?.length) {
      box.innerHTML = "";
      box.classList.remove("active");
      return;
    }

    const geo = suggestions.filter(item => item.source !== "partypilot");
    const localities = suggestions.filter(item => item.source === "partypilot");
    let html = "";

    if (geo.length) {
      html += '<div class="suggestion-group-label">Places</div>';
      html += geo.map((item, index) => `
        <button type="button" class="location-suggestion" data-index="${suggestions.indexOf(item)}" role="option">
          <span class="suggestion-pin">⌖</span>
          <span><strong>${escapeHtml(item.description)}</strong><small>${escapeHtml(item.result_type || "Location")}</small></span>
        </button>`).join("");
    }

    if (localities.length) {
      html += '<div class="suggestion-group-label">Popular Pune localities</div>';
      html += localities.map(item => `
        <button type="button" class="location-suggestion" data-index="${suggestions.indexOf(item)}" role="option">
          <span class="suggestion-pin">⌖</span>
          <span><strong>${escapeHtml(item.description.split(",")[0])}</strong><small>Pune, Maharashtra</small></span>
        </button>`).join("");
    }

    box.innerHTML = html;
    box.classList.add("active");
  }

  input.addEventListener("input", () => {
    clearTimeout(timer);
    controller?.abort();
    window.PARTYPILOT_LOCATION = null;

    const query = input.value.trim();
    if (query.length < 2) {
      renderSuggestions([]);
      return;
    }

    timer = setTimeout(async () => {
      controller = new AbortController();
      try {
        const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Location search failed");
        renderSuggestions(data.suggestions || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Location suggestions failed:", error);
          renderSuggestions([]);
        }
      }
    }, 280);
  });

  box.addEventListener("click", event => {
    const button = event.target.closest("[data-index]");
    if (!button) return;

    const item = box._suggestions?.[Number(button.dataset.index)];
    if (!item) return;

    input.value = item.description || "";
    if (item.latitude != null && item.longitude != null) {
      window.PARTYPILOT_LOCATION = {
        lat: Number(item.latitude),
        lon: Number(item.longitude),
        description: input.value
      };
    } else {
      // Curated locality suggestions are resolved by the backend geocoder
      // when the user submits the venue search.
      window.PARTYPILOT_LOCATION = null;
    }
    renderSuggestions([]);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".location-field")) renderSuggestions([]);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Escape") renderSuggestions([]);
    if (event.key === "Enter" && box.classList.contains("active")) {
      const first = box.querySelector("[data-index]");
      if (first) {
        event.preventDefault();
        first.click();
      }
    }
  });

  gps?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Location access is not supported by this browser.");
      return;
    }

    gps.disabled = true;
    gps.textContent = "Finding location…";

    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      window.PARTYPILOT_LOCATION = {
        lat: latitude,
        lon: longitude,
        description: "Current location"
      };
      input.value = "Current location";
      renderSuggestions([]);
      gps.disabled = false;
      gps.innerHTML = "<span>✓</span> Location found";
    }, () => {
      alert("Unable to access your location. Allow location permission or type a place.");
      gps.disabled = false;
      gps.innerHTML = "<span>◎</span> Use my location";
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  });
})();
