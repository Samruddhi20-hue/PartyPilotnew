
document.addEventListener("DOMContentLoaded", async () => {
    const root = document.getElementById("venueDetailContent");

    if (!root) return;

    const id = root.dataset.venueId;
    const source = (root.dataset.source || "google_places").toLowerCase();

    const esc = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    function getCache() {
        try {
            const items = JSON.parse(
                localStorage.getItem("partyPilotVenues") || "[]"
            );

            return Array.isArray(items) ? items : [];
        } catch {
            return [];
        }
    }

    function getShortlist() {
        try {
            const items = JSON.parse(
                localStorage.getItem("partyPilotShortlist") || "[]"
            );

            return Array.isArray(items) ? items : [];
        } catch {
            return [];
        }
    }

    function saveToCache(venue) {
        const items = getCache();

        const index = items.findIndex(
            item =>
                String(item.id) === String(venue.id) &&
                (item.source || "google_places") === source
        );

        if (index >= 0) {
            items[index] = venue;
        } else {
            items.push(venue);
        }

        localStorage.setItem(
            "partyPilotVenues",
            JSON.stringify(items)
        );
    }

    const cachedVenue = getCache().find(
        venue =>
            String(venue.id) === String(id) &&
            (venue.source || "google_places") === source
    );

    function safeWebsite(value) {
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
            // Invalid URL.
        }

        return null;
    }

    function getCategory(venue) {
        if (venue.category) return venue.category;

        if (
            Array.isArray(venue.categories) &&
            venue.categories.length
        ) {
            return venue.categories.join(", ");
        }

        return "Venue";
    }

    function formatOpeningHours(hours) {
        if (!hours) {
            return `
                <p class="detail-muted">
                    Opening hours are not provided by the listing source.
                </p>
            `;
        }

        // Some providers return a text value instead of a schedule.
        if (typeof hours === "string") {
            return `
                <p>${esc(hours)}</p>
            `;
        }

        // Support an array of day/time-range objects.
        if (Array.isArray(hours)) {
            if (!hours.length) {
                return `
                    <p class="detail-muted">
                        Opening hours are not provided by the listing source.
                    </p>
                `;
            }

            return `
                <div class="detail-hours-list">
                    ${hours.map(day => {
                        if (typeof day === "string") {
                            return `
                                <div class="detail-hour-row">
                                    <span>${esc(day)}</span>
                                </div>
                            `;
                        }

                        const ranges = day.timeRanges || [];

                        const times = ranges.length
                            ? ranges.map(range => {
                                const start = range.start || "";
                                const end = range.end || "";

                                return `${esc(start)} – ${esc(end)}`;
                            }).join(", ")
                            : (
                                day.text ||
                                day.value ||
                                "Hours unavailable"
                            );

                        return `
                            <div class="detail-hour-row">
                                <span>
                                    ${esc(day.date || day.day || "Hours")}
                                </span>
                                <strong>${times}</strong>
                            </div>
                        `;
                    }).join("")}
                </div>
            `;
        }

        // Support an object containing a timeRanges array.
        if (typeof hours === "object") {
            const ranges = hours.timeRanges || [];

            if (ranges.length) {
                return `
                    <div class="detail-hours-list">
                        ${ranges.map(range => `
                            <div class="detail-hour-row">
                                <span>${esc(range.date || "Hours")}</span>
                                <strong>
                                    ${esc(range.start || "")}
                                    –
                                    ${esc(range.end || "")}
                                </strong>
                            </div>
                        `).join("")}
                    </div>
                `;
            }

            if (hours.text || hours.value) {
                return `<p>${esc(hours.text || hours.value)}</p>`;
            }
        }

        return `
            <p class="detail-muted">
                Opening hours are not available in a readable format.
            </p>
        `;
    }

    function render(venue, warning = "") {
        const name = venue.name || "Venue details";
        const address = venue.address || venue.location;
        const phone = venue.phone;
        const website = safeWebsite(venue.website);
        const category = getCategory(venue);

        const latitude = venue.latitude;
        const longitude = venue.longitude;

        const hasCoordinates =
            latitude !== null &&
            latitude !== undefined &&
            longitude !== null &&
            longitude !== undefined;

        const directionsUrl = hasCoordinates
            ? `https://www.google.com/maps/dir/?api=1&destination=${
                encodeURIComponent(`${latitude},${longitude}`)
            }`
            : address
                ? `https://www.google.com/maps/search/?api=1&query=${
                    encodeURIComponent(address)
                }`
                : null;

        const savedItems = getShortlist();

        const alreadySaved = savedItems.some(item =>
            String(typeof item === "string" ? item : item.id) === String(id) &&
            (typeof item === "string" || (item.source || "google_places") === source)
        );

        const ratingSummary = venue.rating != null
            ? `<div class="detail-rating"><strong>${esc(venue.rating)} ★</strong><span>${venue.user_ratings_total != null ? `${Number(venue.user_ratings_total).toLocaleString("en-IN")} reviews` : "Google rating"}</span></div>`
            : "";

        const photoCards = Array.isArray(venue.photos) ? venue.photos : [];
        const photoGallery = photoCards.length
            ? `<section class="detail-section"><h2>Venue photos</h2><div class="detail-photo-grid">${photoCards.slice(0, 8).map(photo => {
                const photoPath = String(photo.name || "").split("/").map(encodeURIComponent).join("/");
                const attribution = (photo.attributions || []).map(item => item.displayName).filter(Boolean).join(", ");
                return `<figure><img loading="lazy" src="/api/google-places/photo/${photoPath}?maxWidthPx=1000" alt="${esc(name)} venue photo"><figcaption>${attribution ? `Photo: ${esc(attribution)}` : ""}</figcaption></figure>`;
            }).join("")}</div></section>`
            : "";

        const coordinateText = hasCoordinates
            ? `${latitude}, ${longitude}`
            : "Not provided";

        root.innerHTML = `
            <article class="detail-profile">

                <div class="detail-heading">
                    <span class="detail-category">
                        ${esc(category)}
                    </span>

                    <h1 class="detail-title">
                        ${esc(name)}
                    </h1>

                    <p class="detail-subtitle">
                        ${
                            address
                                ? esc(address)
                                : "Address information is not available."
                        }
                    </p>
                    ${ratingSummary}
                    ${venue.google_maps_url ? `<p><a href="${esc(venue.google_maps_url)}" target="_blank" rel="noopener noreferrer">Open on Google Maps ↗</a></p>` : ""}
                </div>

                ${
                    warning
                        ? `<div class="detail-warning">${esc(warning)}</div>`
                        : ""
                }

                <div class="detail-layout">

                    <div class="detail-main">

                        <section class="detail-section">
                            <h2>About this venue</h2>

                            <p>
                                Venue information retrieved from
                                Google Places.
                            </p>
                        </section>

                        <section class="detail-section">
                            <h2>Contact information</h2>

                            <div class="detail-info-grid">

                                <div class="detail-info-card">
                                    <span class="detail-info-icon">☎</span>

                                    <div>
                                        <span class="detail-info-label">
                                            Phone number
                                        </span>

                                        ${
                                            phone
                                                ? `<a href="tel:${esc(phone)}">${esc(phone)}</a>`
                                                : `<span class="detail-muted">Not provided</span>`
                                        }
                                    </div>
                                </div>

                                <div class="detail-info-card">
                                    <span class="detail-info-icon">↗</span>

                                    <div>
                                        <span class="detail-info-label">
                                            Official website
                                        </span>

                                        ${
                                            website
                                                ? `
                                                    <a
                                                        href="${esc(website)}"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Visit website
                                                    </a>
                                                `
                                                : `<span class="detail-muted">Not provided</span>`
                                        }
                                    </div>
                                </div>

                                <div class="detail-info-card">
                                    <span class="detail-info-icon">⌖</span>

                                    <div>
                                        <span class="detail-info-label">
                                            Full address
                                        </span>

                                        <span>
                                            ${
                                                address
                                                    ? esc(address)
                                                    : "Not provided"
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div class="detail-info-card">
                                    <span class="detail-info-icon">✦</span>

                                    <div>
                                        <span class="detail-info-label">
                                            Business category
                                        </span>

                                        <span>${esc(category)}</span>
                                    </div>
                                </div>

                            </div>
                        </section>

                        ${photoGallery}

                        <section class="detail-section">
                            <h2>Opening hours</h2>

                            ${formatOpeningHours(venue.opening_hours)}

                            <p class="detail-hours-note">
                                Hours are shown only when supplied by the
                                listing provider. Confirm directly with
                                the venue before visiting.
                            </p>
                        </section>

                        <section class="detail-section">
                            <h2>Location coordinates</h2>

                            <div class="detail-info-grid">

                                <div class="detail-info-card">
                                    <span class="detail-info-icon">◎</span>

                                    <div>
                                        <span class="detail-info-label">
                                            Latitude
                                        </span>

                                        <span>
                                            ${
                                                hasCoordinates
                                                    ? esc(latitude)
                                                    : "Not provided"
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div class="detail-info-card">
                                    <span class="detail-info-icon">◎</span>

                                    <div>
                                        <span class="detail-info-label">
                                            Longitude
                                        </span>

                                        <span>
                                            ${
                                                hasCoordinates
                                                    ? esc(longitude)
                                                    : "Not provided"
                                            }
                                        </span>
                                    </div>
                                </div>

                            </div>
                        </section>

                        <section class="detail-section">
                            <h2>Event planning information</h2>

                            <div class="detail-info-grid">

                                <div class="detail-info-card">
                                    <span class="detail-info-icon">₹</span>

                                    <div>
                                        <span class="detail-info-label">
                                            Price per person
                                        </span>

                                        <span>
                                            ${
                                                venue.price_per_person != null
                                                    ? `₹${esc(venue.price_per_person)}`
                                                    : "Contact venue for pricing"
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div class="detail-info-card">
                                    <span class="detail-info-icon">♧</span>

                                    <div>
                                        <span class="detail-info-label">
                                            Guest capacity
                                        </span>

                                        <span>
                                            ${
                                                venue.capacity != null
                                                    ? esc(venue.capacity)
                                                    : "Confirm with venue"
                                            }
                                        </span>
                                    </div>
                                </div>

                            </div>
                        </section>

                    </div>

                    <aside class="detail-sidebar">
                        <h3>Interested in this venue?</h3>

                        <p class="detail-price">
                            ${
                                venue.price_per_person != null
                                    ? `₹${esc(venue.price_per_person)}`
                                    : "Ask for pricing"
                            }
                        </p>

                        <p class="detail-muted">
                            ${
                                venue.price_per_person != null
                                    ? "Estimated price per person"
                                    : "Pricing is not available in the listing"
                            }
                        </p>

                        <button
                            type="button"
                            class="detail-primary-btn"
                            id="detailSaveBtn"
                        >
                            ${
                                alreadySaved
                                    ? "♥ Saved to shortlist"
                                    : "♡ Save venue"
                            }
                        </button>

                        <a
                            class="detail-secondary-btn"
                            href="/contact?venue_id=${encodeURIComponent(id)}&venue_name=${encodeURIComponent(name)}"
                        >
                            Enquire about this venue
                        </a>

                        ${
                            directionsUrl
                                ? `
                                    <a
                                        class="detail-map-link"
                                        href="${esc(directionsUrl)}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Get directions ↗
                                    </a>
                                `
                                : ""
                        }

                        <p class="detail-disclaimer">
                            Information depends on the availability and
                            accuracy of the listing provider. Please confirm
                            pricing, capacity and event arrangements directly
                            with the venue.
                        </p>
                    </aside>

                </div>
            </article>
        `;

        document.getElementById("detailSaveBtn")
            ?.addEventListener("click", () => {
                const items = getShortlist();

                const exists = items.some(item =>
                    String(typeof item === "string" ? item : item.id) === String(id) &&
                    (typeof item === "string" || (item.source || "google_places") === source)
                );

                if (!exists) {
                    items.push(venue);

                    localStorage.setItem(
                        "partyPilotShortlist",
                        JSON.stringify(items)
                    );
                }

                const button = document.getElementById("detailSaveBtn");

                if (button) {
                    button.textContent = "♥ Saved to shortlist";
                }
            });
    }

    if (!cachedVenue) {
        root.innerHTML = `
            <div class="detail-error">
                <h2>Venue listing not found</h2>

                <p>
                    Please return to Explore and search for
                    the venue again.
                </p>

                <a href="/explore">Back to explore</a>
            </div>
        `;

        return;
    }

    // Show the available search listing immediately.
    render(cachedVenue);

    const params = new URLSearchParams();
    params.set("source", source);



    try {
        const response = await fetch(
            `/api/venues/${encodeURIComponent(id)}?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.venue) {
            throw new Error(
                data.error || "Could not load venue details."
            );
        }

        const updatedVenue = {
            ...cachedVenue,
            ...data.venue,
            id: cachedVenue.id,
            source: source,
        };

        saveToCache(updatedVenue);
        render(updatedVenue);

    } catch (error) {
        console.error("Venue details error:", error);

        render(
            cachedVenue,
            "Additional details could not be loaded. Showing the information available in the search listing."
        );
    }
});
