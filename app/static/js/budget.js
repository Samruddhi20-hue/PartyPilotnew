
document.addEventListener("DOMContentLoaded", () => {

    const fields = {
        guests: document.getElementById("budgetGuests"),
        person: document.getElementById("budgetPerPerson"),
        decoration: document.getElementById("decorationCost"),
        music: document.getElementById("musicCost"),
        other: document.getElementById("otherCost")
    };

    const currency = value => "₹" + Math.round(value).toLocaleString("en-IN");

    function calculate() {

        const values = {};

        for (const [key, field] of Object.entries(fields)) {
            values[key] = Number(field.value);

            if (!Number.isFinite(values[key]) || values[key] < 0) {
                window.showToast?.("Please enter valid non-negative numbers.", "error");
                field.focus();
                return;
            }
        }

        if (!Number.isInteger(values.guests) || values.guests < 1 || values.guests > 10000) {
            window.showToast?.("Enter a guest count between 1 and 10,000.", "error");
            fields.guests.focus();
            return;
        }

        const food = values.guests * values.person;
        const total = food + values.decoration + values.music + values.other;
        const perGuest = total / values.guests;

        document.getElementById("totalBudget").textContent = currency(total);
        document.getElementById("foodTotal").textContent = currency(food);
        document.getElementById("decorationTotal").textContent = currency(values.decoration);
        document.getElementById("musicTotal").textContent = currency(values.music);
        document.getElementById("otherTotal").textContent = currency(values.other);
        document.getElementById("perGuestTotal").textContent = currency(perGuest);

        window.currentBudget = {
            guests: values.guests,
            food,
            decoration: values.decoration,
            music: values.music,
            other: values.other,
            total,
            perGuest
        };

    }

    document.getElementById("calculateBudgetBtn")
        ?.addEventListener("click", calculate);

    Object.values(fields).forEach(field => {
        field.addEventListener("input", calculate);
    });

    document.getElementById("downloadBudgetBtn")
        ?.addEventListener("click", () => {

            if (!window.currentBudget) calculate();

            const data = window.currentBudget;
            if (!data) return;

            const content = [
                "PARTYPILOT - EVENT BUDGET ESTIMATE",
                "===================================",
                `Guests: ${data.guests}`,
                `Food and venue: ${currency(data.food)}`,
                `Decoration: ${currency(data.decoration)}`,
                `Music / DJ: ${currency(data.music)}`,
                `Other expenses: ${currency(data.other)}`,
                "-----------------------------------",
                `Total estimated budget: ${currency(data.total)}`,
                `Estimated per guest: ${currency(data.perGuest)}`,
                "",
                "Note: This is an estimate, not a venue quotation."
            ].join("\n");

            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "PartyPilot_Budget_Estimate.txt";
            link.click();

            URL.revokeObjectURL(url);

        });

    calculate();

});
