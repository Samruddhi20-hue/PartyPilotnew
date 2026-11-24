
import pytest

from app.services.budget_service import calculate_event_budget


def test_budget_calculation():
    result = calculate_event_budget(
        guests=100,
        food_cost_per_person=500,
        decoration_cost=5000,
        venue_cost=10000,
        other_costs=2000
    )

    assert result["food_cost"] == 50000
    assert result["subtotal"] == 67000
    assert result["contingency"] == 6700
    assert result["grand_total"] == 73700
    assert result["cost_per_guest"] == 737


def test_budget_rejects_zero_guests():
    with pytest.raises(ValueError):
        calculate_event_budget(
            guests=0,
            food_cost_per_person=500
        )


def test_budget_rejects_negative_cost():
    with pytest.raises(ValueError):
        calculate_event_budget(
            guests=50,
            food_cost_per_person=-100
        )
