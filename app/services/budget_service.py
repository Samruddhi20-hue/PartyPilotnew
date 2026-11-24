
def calculate_event_budget(
    guests,
    food_cost_per_person,
    decoration_cost=0,
    venue_cost=0,
    other_costs=0
):
    guests = int(guests)
    food_cost_per_person = float(food_cost_per_person)

    if guests <= 0:
        raise ValueError("Guest count must be greater than zero.")

    if min(
        food_cost_per_person,
        float(decoration_cost),
        float(venue_cost),
        float(other_costs)
    ) < 0:
        raise ValueError("Costs cannot be negative.")

    food_total = guests * food_cost_per_person

    subtotal = (
        food_total
        + float(decoration_cost)
        + float(venue_cost)
        + float(other_costs)
    )

    contingency = subtotal * 0.10
    grand_total = subtotal + contingency

    return {
        "guest_count": guests,
        "food_cost": round(food_total, 2),
        "decoration_cost": round(float(decoration_cost), 2),
        "venue_cost": round(float(venue_cost), 2),
        "other_costs": round(float(other_costs), 2),
        "subtotal": round(subtotal, 2),
        "contingency": round(contingency, 2),
        "grand_total": round(grand_total, 2),
        "cost_per_guest": round(grand_total / guests, 2)
    }
