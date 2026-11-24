
document.addEventListener("DOMContentLoaded", () => {

    const state = {
        category: "all",
        budget: 3000,
        capacity: null,
        rating: 0,
        distance: 100,
        sort: "recommended"
    };

    const budgetRange = document.getElementById("budgetRange");
    const budgetValue = document.getElementById("budgetValue");
    const ratingFilter = document.getElementById("ratingFilter");
    const distanceFilter = document.getElementById("distanceFilter");
    const sortSelect = document.getElementById("sortSelect");

    const filterSidebar = document.getElementById("filterSidebar");
    const mobileFilterBtn = document.getElementById("mobileFilterBtn");

    function refresh() {
        window.applyVenueFilters?.(state);
    }

    // CATEGORY CHIPS
    document.querySelectorAll(".category-chip").forEach(button => {

        button.addEventListener("click", () => {

            document.querySelectorAll(".category-chip").forEach(chip =>
                chip.classList.remove("active")
            );

            button.classList.add("active");

            state.category = button.dataset.category;

            document.querySelectorAll('input[name="category"]').forEach(input => {
                input.checked =
                    state.category !== "all" &&
                    input.value === state.category;
            });

            refresh();

        });

    });


    // SIDEBAR CATEGORY CHECKBOXES
    document.querySelectorAll('input[name="category"]').forEach(input => {

        input.addEventListener("change", () => {

            const selected = [...document.querySelectorAll(
                'input[name="category"]:checked'
            )].map(item => item.value);

            state.category = selected.length ? selected : "all";

            document.querySelectorAll(".category-chip").forEach(chip => {
                chip.classList.toggle(
                    "active",
                    chip.dataset.category === state.category
                );
            });

            refresh();

        });

    });


    // BUDGET RANGE
    if (budgetRange) {

        budgetRange.addEventListener("input", () => {

            state.budget = Number(budgetRange.value);

            budgetValue.textContent =
                state.budget >= 3000
                    ? "₹3,000+"
                    : `₹${state.budget.toLocaleString("en-IN")}`;

            refresh();

        });

    }


    // CAPACITY
    document.querySelectorAll('input[name="capacity"]').forEach(input => {

        input.addEventListener("change", () => {

            state.capacity = Number(input.value);
            refresh();

        });

    });


    // RATING
    ratingFilter?.addEventListener("change", () => {

        state.rating = Number(ratingFilter.value);
        refresh();

    });


    // DISTANCE
    distanceFilter?.addEventListener("change", () => {

        state.distance = Number(distanceFilter.value);
        refresh();

    });


    // SORT
    sortSelect?.addEventListener("change", () => {

        state.sort = sortSelect.value;
        refresh();

    });


    // APPLY BUTTON
    document.getElementById("applyFiltersBtn")?.addEventListener("click", () => {

        refresh();

        filterSidebar?.classList.remove("mobile-open");

        window.showToast?.("Filters applied successfully ✳");

    });


    // MOBILE FILTER PANEL
    mobileFilterBtn?.addEventListener("click", () => {

        filterSidebar?.classList.toggle("mobile-open");

    });


    // RESET FILTERS
    function resetFilters() {

        state.category = "all";
        state.budget = 3000;
        state.capacity = null;
        state.rating = 0;
        state.distance = 100;
        state.sort = "recommended";

        if (budgetRange) budgetRange.value = 3000;
        if (budgetValue) budgetValue.textContent = "₹3,000+";
        if (ratingFilter) ratingFilter.value = "0";
        if (distanceFilter) distanceFilter.value = "100";
        if (sortSelect) sortSelect.value = "recommended";

        document.querySelectorAll('input[name="category"]').forEach(input => {
            input.checked = false;
        });

        document.querySelectorAll('input[name="capacity"]').forEach(input => {
            input.checked = false;
        });

        document.querySelectorAll(".category-chip").forEach(chip => {
            chip.classList.toggle(
                "active",
                chip.dataset.category === "all"
            );
        });

        refresh();

    }

    document.getElementById("clearFiltersBtn")
        ?.addEventListener("click", resetFilters);

    document.getElementById("resetSearchBtn")
        ?.addEventListener("click", resetFilters);

    window.resetVenueFilters = resetFilters;

});
