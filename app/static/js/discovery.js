
document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------
    // 1. ELEMENTS
    // --------------------------------------------------

    const grid = document.getElementById("venueGrid");
    if (!grid) return;

    const form = document.getElementById("exploreSearchForm");

    const locationInput = document.getElementById("exploreLocation");
    const businessInput = document.getElementById("exploreBusiness");
    const businessCity = document.getElementById("businessCity");
    const guestsInput = document.getElementById("exploreGuests");

    const count = document.getElementById("resultsCount");
    const subtitle = document.getElementById("resultsSubtitle");
    const empty = document.getElementById("noResults");

    const listBtn = document.getElementById("listViewBtn");
    const mapBtn = document.getElementById("mapViewBtn");
    const mapWrap = document.getElementById("mapViewContainer");

    const nearbyModeBtn = document.getElementById("nearbyModeBtn");
    const businessModeBtn = document.getElementById("businessModeBtn");

    const nearbyFields = document.getElementById("nearbySearchFields");
    const businessFields = document.getElementById("businessSearchFields");

    const locationLabel = document.getElementById("searchLocationLabel");

    // --------------------------------------------------
    // 2. STATE
    // --------------------------------------------------

    let venues = [];
    let map = null;
    let markers = null;

    let category = "all";
    let coordinates = null;
    let searchMode = "nearby";
    let currentView = "list";
    let activeRequest = null;

    const storageKey = "partyPilotVenues";

    // --------------------------------------------------
    // 3. HELPERS
    // --------------------------------------------------

    const esc = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    const getItems = key => {
        try {
            const items = JSON.parse(
                localStorage.getItem(key) || "[]"
            );

            return Array.isArray(items) ? items : [];
        } catch {
            return [];
        }
    };

    const setItems = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("Local storage error:", error);
        }
    };

    function getVenueId(item) {
        return String(
            typeof item === "string" ? item : item?.id ?? ""
        );
    }

    function getVenueSource(item) {
        return (
            typeof item === "object" && item?.source
                ? String(item.source).toLowerCase()
                : "google_places"
        );
    }

    function isSameVenue(item, venue) {
        return (
            getVenueId(item) === String(venue.id) &&
            (
                typeof item === "string" ||
                getVenueSource(item) === getVenueSource(venue)
            )
        );
    }

    function saveVenue(venue) {
        if (!venue || !venue.id) return;

        const items = getItems(storageKey);

        const index = items.findIndex(item =>
            isSameVenue(item, venue)
        );

        if (index >= 0) {
            items[index] = {
                ...items[index],
                ...venue
            };
        } else {
            items.push(venue);
        }

        setItems(storageKey, items);
    }

    function isSaved(venue) {
        return getItems("partyPilotShortlist").some(
            item => isSameVenue(item, venue)
        );
    }

    function isCompared(venue) {
        return getItems("partyPilotCompare").some(
            item => isSameVenue(item, venue)
        );
    }

    function showMessage(message) {
        grid.innerHTML = `
            <div class="explore-empty-start">
                <h3>${esc(message)}</h3>
            </div>
        `;
    }

    function setLoading(message) {
        grid.innerHTML = `
            <div class="explore-empty-start">
                <h3>${esc(message)}</h3>
                <p>Please wait...</p>
            </div>
        `;

        if (empty) empty.hidden = true;
    }

    function updateCount() {
        if (count) {
            count.textContent = `${venues.length} places`;
        }

        if (empty) {
            empty.hidden = venues.length !== 0;
        }
    }

    // --------------------------------------------------
    // 4. VENUE DETAILS URL
    // --------------------------------------------------

    function getDetailUrl(venue) {
        const source = (
            venue.source || "google_places"
        ).toLowerCase();

        return (
            `/venue/${encodeURIComponent(venue.id)}` +
            `?source=${encodeURIComponent(source)}`
        );
    }

    // --------------------------------------------------
    // 5. VENUE CARD
    // --------------------------------------------------

    function card(venue) {
        const saved = isSaved(venue);
        const compared = isCompared(venue);

        const price = venue.price_per_person == null
            ? "Not listed"
            : `₹${Number(
                venue.price_per_person
            ).toLocaleString("en-IN")}/person`;

        const rating = venue.rating == null
            ? "Not available"
            : `${esc(venue.rating)} ★`;

        const categoryName = venue.category
            ? String(venue.category).split(".").pop()
            : "Place";

        const sourceLabel = "Google Places listing";

        const detailUrl = getDetailUrl(venue);

        const distanceText = venue.distance != null
            ? `
                <p class="venue-distance">
                    ${(
                        Number(venue.distance) / 1000
                    ).toFixed(1)} km from search point
                </p>
            `
            : "";

        const phoneText = venue.phone
            ? `
                <p class="venue-phone">
                    Phone: ${esc(venue.phone)}
                </p>
            `
            : "";

        const websiteUrl = getSafeWebsite(venue.website);

        const websiteText = websiteUrl
            ? `
                <p>
                    <a href="${esc(websiteUrl)}"
                       target="_blank"
                       rel="noopener noreferrer">
                        Visit website ↗
                    </a>
                </p>
            `
            : "";

        return `
            <article class="venue-card" data-venue-card="${esc(venue.id)}">

                <div class="venue-content">

                    <span class="venue-type">
                        ${esc(categoryName)}
                    </span>

                    <h3 class="venue-card-title">
                        <a
                            class="venue-title-link"
                            href="${detailUrl}"
                            aria-label="View details for ${esc(venue.name)}"
                        >
                            ${esc(venue.name || "Unnamed venue")}
                        </a>
                    </h3>

                    <p class="venue-address">
                        ${esc(
                            venue.address ||
                            venue.location ||
                            "Address unavailable"
                        )}
                    </p>

                    <p class="venue-rating-price">
                        Rating: ${rating} · Price: ${esc(price)}
                    </p>

                    ${distanceText}
                    ${phoneText}
                    ${websiteText}

                    <p class="venue-data-note">
                        ${esc(sourceLabel)}. Ratings, prices and
                        capacity may not be provided by the listing source.
                    </p>

                    <div class="venue-card-actions">

                        <a
                            class="btn btn-primary venue-details-btn"
                            href="${detailUrl}"
                        >
                            View Details
                            <span aria-hidden="true">→</span>
                        </a>

                        <button
                            type="button"
                            class="venue-save-btn"
                            data-save="${esc(venue.id)}"
                            data-source="${esc(venue.source || "google_places")}"
                        >
                            ${saved ? "♥ Saved" : "♡ Save"}
                        </button>

                        <button
                            type="button"
                            class="venue-compare-btn"
                            data-compare="${esc(venue.id)}"
                            data-source="${esc(venue.source || "google_places")}"
                        >
                            ${compared ? "Added" : "Compare"}
                        </button>

                    </div>

                </div>
            </article>
        `;
    }

    function getSafeWebsite(value) {
        if (!value) return null;

        try {
            const url = new URL(value);

            if (
                url.protocol === "https:" ||
                url.protocol === "http:"
            ) {
                return url.href;
            }
        } catch {
            return null;
        }

        return null;
    }

    // --------------------------------------------------
    // 6. RENDER VENUES
    // --------------------------------------------------

    function render() {
        if (!venues.length) {
            grid.innerHTML = "";
            updateCount();
            renderMap();
            return;
        }

        grid.innerHTML = venues.map(card).join("");

        updateCount();

        if (window.lucide) {
            window.lucide.createIcons();
        }

        renderMap();
    }

    // --------------------------------------------------
    // 7. MAP
    // --------------------------------------------------

    function renderMap() {
        if (!mapWrap || !window.L) return;

        const valid = venues.filter(venue =>
            venue.latitude != null &&
            venue.longitude != null &&
            Number.isFinite(Number(venue.latitude)) &&
            Number.isFinite(Number(venue.longitude))
        );

        if (!valid.length) {
            if (markers) markers.clearLayers();
            return;
        }

        if (!map) {
            const mapElement = document.getElementById("venueMap");

            if (!mapElement) return;

            map = L.map("venueMap");

            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    maxZoom: 19,
                    attribution: "&copy; OpenStreetMap contributors"
                }
            ).addTo(map);

            markers = L.featureGroup().addTo(map);
        }

        markers.clearLayers();

        valid.forEach(venue => {
            const marker = L.marker([
                Number(venue.latitude),
                Number(venue.longitude)
            ]);

            marker.bindPopup(`
                <div class="map-popup">
                    <strong>${esc(venue.name)}</strong>
                    <p>${esc(venue.address || "")}</p>
                    <a href="${getDetailUrl(venue)}">
                        View details →
                    </a>
                </div>
            `);

            marker.addTo(markers);
        });

        if (markers.getLayers().length) {
            map.fitBounds(markers.getBounds().pad(0.15));
        }

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 150);
    }

    // --------------------------------------------------
    // 8. LIST / MAP VIEW
    // --------------------------------------------------

    function setView(view) {
        currentView = view;

        if (view === "map") {
            grid.hidden = true;

            if (mapWrap) {
                mapWrap.hidden = false;
            }

            mapBtn?.classList.add("active");
            listBtn?.classList.remove("active");

            renderMap();

            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 150);

        } else {
            grid.hidden = false;

            if (mapWrap) {
                mapWrap.hidden = true;
            }

            listBtn?.classList.add("active");
            mapBtn?.classList.remove("active");
        }
    }

    // --------------------------------------------------
    // 9. SEARCH MODE
    // --------------------------------------------------

    function setSearchMode(mode) {
        searchMode = mode;

        const business = mode === "business";

        if (nearbyFields) {
            nearbyFields.hidden = business;
        }

        if (businessFields) {
            businessFields.hidden = !business;
        }

        nearbyModeBtn?.classList.toggle(
            "active",
            !business
        );

        businessModeBtn?.classList.toggle(
            "active",
            business
        );

        const categoryControls =
            document.getElementById("quickCategories");

        const filterControls =
            document.querySelector(".filter-controls");

        const gpsButton =
            document.getElementById("useCurrentLocation");

        if (categoryControls) {
            categoryControls.hidden = business;
        }

        if (filterControls) {
            filterControls.hidden = business;
        }

        if (gpsButton) {
            gpsButton.hidden = business;
        }

        if (subtitle) {
            subtitle.textContent = business
                ? "Search for a specific business in your selected city."
                : "Search a city or locality to discover nearby places.";
        }

        setView("list");
    }

    // --------------------------------------------------
    // 10. NEARBY VENUE SEARCH
    // --------------------------------------------------

    async function searchNearby() {
        if (!locationInput) return;

        const params = new URLSearchParams();

        const typed = locationInput.value.trim();
        const currentLocation = window.PARTYPILOT_LOCATION;

        if (
            currentLocation &&
            Number.isFinite(Number(currentLocation.lat)) &&
            Number.isFinite(Number(currentLocation.lon)) &&
            (typed === "" || typed === "Current location")
        ) {
            params.set("lat", currentLocation.lat);
            params.set("lon", currentLocation.lon);

            coordinates = {
                lat: Number(currentLocation.lat),
                lon: Number(currentLocation.lon)
            };

        } else if (typed && typed !== "Current location") {
            params.set("location", typed);
            coordinates = null;

        } else {
            if (subtitle) {
                subtitle.textContent =
                    "Enter a location or use your current location.";
            }

            return;
        }

        if (guestsInput?.value) {
            params.set("guests", guestsInput.value);
        }

        params.set("category", category);

        params.set(
            "radius",
            document.getElementById("distanceFilter")?.value || "5000"
        );

        const budget =
            document.getElementById("budgetRange")?.value;

        if (budget) {
            params.set("budget", budget);
        }

        if (subtitle) {
            subtitle.textContent = "Finding nearby places...";
        }

        setLoading("Finding nearby places...");

        venues = [];
        updateCount();

        if (activeRequest) {
            activeRequest.abort();
        }

        activeRequest = new AbortController();

        try {
            const response = await fetch(
                `/api/venues?${params.toString()}`,
                {
                    signal: activeRequest.signal
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || "Nearby search failed."
                );
            }

            venues = (data.venues || []).filter(
                venue => venue && venue.id
            );

            venues = venues.map(venue => ({
                ...venue,
                source: venue.source || "google_places"
            }));

            coordinates = data.search?.latitude != null
                ? {
                    lat: Number(data.search.latitude),
                    lon: Number(data.search.longitude)
                }
                : coordinates;

            venues.forEach(saveVenue);

            const label =
                data.search?.location || typed || "your location";

            if (subtitle) {
                subtitle.textContent =
                    `Showing nearby listings for ${label}.`;
            }

            if (locationLabel) {
                locationLabel.textContent = label;
            }

            sortAndRender();

        } catch (error) {
            if (error.name === "AbortError") return;

            console.error("Nearby search error:", error);

            venues = [];
            render();

            if (subtitle) {
                subtitle.textContent =
                    `${error.message} Please try again.`;
            }

            if (empty) empty.hidden = false;

        } finally {
            activeRequest = null;
        }
    }

    // --------------------------------------------------
    // 11. GOOGLE PLACES BUSINESS NAME SEARCH
    // --------------------------------------------------

    async function searchBusiness() {
        const query = businessInput?.value.trim() || "";
        const city = businessCity?.value.trim() || "";

        if (query.length < 2) {
            if (subtitle) {
                subtitle.textContent =
                    "Enter at least two characters for the business name.";
            }

            businessInput?.focus();
            return;
        }

        if (!city) {
            if (subtitle) {
                subtitle.textContent =
                    "Please enter the city where you want to search.";
            }

            businessCity?.focus();
            return;
        }

        const params = new URLSearchParams({
            q: query,
            city: city,
            limit: "20"
        });

        if (subtitle) {
            subtitle.textContent =
                `Searching for ${query} in ${city}...`;
        }

        setLoading("Searching businesses...");

        venues = [];
        coordinates = null;
        updateCount();

        if (activeRequest) {
            activeRequest.abort();
        }

        activeRequest = new AbortController();

        try {
            const response = await fetch(
                `/api/venues/search?${params.toString()}`,
                {
                    signal: activeRequest.signal
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || "Business search failed."
                );
            }

            // Preserve the Google Place ID for the Google Place Details API.
            venues = (data.venues || [])
                .filter(venue => venue && venue.id)
                .map(venue => ({
                    ...venue,
                    source: venue.source || data.search?.provider || "google_places"
                }));

            venues.forEach(saveVenue);

            if (locationLabel) {
                locationLabel.textContent = city;
            }

            if (subtitle) {
                subtitle.textContent = venues.length
                    ? `${venues.length} matching listings for "${query}" in ${city}.`
                    : `No matching listings found for "${query}" in ${city}. Try another spelling or city.`;
            }

            sortAndRender();

        } catch (error) {
            if (error.name === "AbortError") return;

            console.error("Business search error:", error);

            venues = [];
            render();

            if (subtitle) {
                subtitle.textContent =
                    `${error.message} Please try again.`;
            }

            if (empty) empty.hidden = false;

        } finally {
            activeRequest = null;
        }
    }

    // --------------------------------------------------
    // 12. SEARCH DISPATCHER
    // --------------------------------------------------

    async function search() {
        if (searchMode === "business") {
            await searchBusiness();
        } else {
            await searchNearby();
        }
    }

    // --------------------------------------------------
    // 13. SORTING
    // --------------------------------------------------

    function sortAndRender() {
        const sort =
            document.getElementById("sortSelect")?.value;

        if (sort === "rating") {
            venues.sort(
                (a, b) =>
                    (Number(b.rating) || 0) -
                    (Number(a.rating) || 0)
            );

        } else if (sort === "distance" && coordinates) {
            venues.sort(
                (a, b) => distance(a) - distance(b)
            );

        } else {
            venues.sort(
                (a, b) =>
                    (Number(b.recommendation_score) || 0) -
                    (Number(a.recommendation_score) || 0)
            );
        }

        render();
    }

    // --------------------------------------------------
    // 14. DISTANCE CALCULATION
    // --------------------------------------------------

    function distance(venue) {
        if (
            !coordinates ||
            venue.latitude == null ||
            venue.longitude == null
        ) {
            return Infinity;
        }

        const r = Math.PI / 180;

        const dLat =
            (Number(venue.latitude) - coordinates.lat) * r;

        const dLon =
            (Number(venue.longitude) - coordinates.lon) * r;

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(coordinates.lat * r) *
            Math.cos(Number(venue.latitude) * r) *
            Math.sin(dLon / 2) ** 2;

        return 6371 * 2 *
            Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // --------------------------------------------------
    // 15. SEARCH FORM EVENTS
    // --------------------------------------------------

    form?.addEventListener("submit", event => {
        event.preventDefault();
        search();
    });

    nearbyModeBtn?.addEventListener("click", () => {
        setSearchMode("nearby");
    });

    businessModeBtn?.addEventListener("click", () => {
        setSearchMode("business");
    });

    businessInput?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();

            setSearchMode("business");
            searchBusiness();
        }
    });

    businessCity?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();

            setSearchMode("business");
            searchBusiness();
        }
    });

    // --------------------------------------------------
    // 16. CATEGORY FILTERS
    // --------------------------------------------------

    document.getElementById("quickCategories")
        ?.addEventListener("click", event => {
            const button = event.target.closest("[data-category]");

            if (!button) return;

            category = button.dataset.category;

            document.querySelectorAll("[data-category]")
                .forEach(item => {
                    item.classList.toggle(
                        "active",
                        item === button
                    );
                });

            if (
                searchMode === "nearby" &&
                locationInput?.value.trim()
            ) {
                searchNearby();
            }
        });

    // --------------------------------------------------
    // 17. OTHER FILTERS
    // --------------------------------------------------

    document.getElementById("distanceFilter")
        ?.addEventListener("change", () => {
            if (
                searchMode === "nearby" &&
                locationInput?.value.trim()
            ) {
                searchNearby();
            }
        });

    document.getElementById("budgetRange")
        ?.addEventListener("change", () => {
            if (
                searchMode === "nearby" &&
                locationInput?.value.trim()
            ) {
                searchNearby();
            }
        });

    document.getElementById("sortSelect")
        ?.addEventListener("change", sortAndRender);

    // --------------------------------------------------
    // 18. SAVE AND COMPARE
    // --------------------------------------------------

    grid.addEventListener("click", event => {
        const saveButton = event.target.closest("[data-save]");
        const compareButton = event.target.closest("[data-compare]");

        // SAVE VENUE
        if (saveButton) {
            const venue = venues.find(
                item =>
                    String(item.id) === saveButton.dataset.save &&
                    (item.source || "google_places") ===
                    (saveButton.dataset.source || "google_places")
            );

            if (!venue) return;

            const items = getItems("partyPilotShortlist");

            const exists = items.some(
                item => isSameVenue(item, venue)
            );

            const updatedItems = exists
                ? items.filter(
                    item => !isSameVenue(item, venue)
                )
                : [...items, venue];

            setItems("partyPilotShortlist", updatedItems);

            render();
            return;
        }

        // COMPARE VENUE
        if (compareButton) {
            const venue = venues.find(
                item =>
                    String(item.id) === compareButton.dataset.compare &&
                    (item.source || "google_places") ===
                    (compareButton.dataset.source || "google_places")
            );

            if (!venue) return;

            const items = getItems("partyPilotCompare");

            const exists = items.some(
                item => isSameVenue(item, venue)
            );

            if (exists) {
                setItems(
                    "partyPilotCompare",
                    items.filter(
                        item => !isSameVenue(item, venue)
                    )
                );

                render();
                return;
            }

            if (items.length >= 3) {
                alert("You can compare up to 3 venues.");
                return;
            }

            setItems("partyPilotCompare", [...items, venue]);

            render();
        }
    });

    // --------------------------------------------------
    // 19. LIST / MAP BUTTONS
    // --------------------------------------------------

    listBtn?.addEventListener("click", () => {
        setView("list");
    });

    mapBtn?.addEventListener("click", () => {
        setView("map");
    });

    // --------------------------------------------------
    // 20. URL PARAMETERS
    // --------------------------------------------------

    const urlParams = new URLSearchParams(
        window.location.search
    );

    if (urlParams.get("location") && locationInput) {
        locationInput.value = urlParams.get("location");
    }

    if (urlParams.get("guests") && guestsInput) {
        guestsInput.value = urlParams.get("guests");
    }

    if (urlParams.get("lat") && urlParams.get("lon")) {
        window.PARTYPILOT_LOCATION = {
            lat: Number(urlParams.get("lat")),
            lon: Number(urlParams.get("lon")),
            description: "Selected location"
        };

        if (locationInput) {
            locationInput.value =
                urlParams.get("location") || "Selected location";
        }
    }

    // Open Explore directly in business-search mode.
    if (urlParams.get("q")) {
        if (businessInput) {
            businessInput.value = urlParams.get("q");
        }

        if (businessCity) {
            businessCity.value = urlParams.get("city") || "Pune";
        }

        setSearchMode("business");
        searchBusiness();

    } else {
        setSearchMode("nearby");

        if (locationInput?.value.trim()) {
            searchNearby();
        }
    }

    // --------------------------------------------------
    // 21. INITIAL VIEW
    // --------------------------------------------------

    setView("list");
});
