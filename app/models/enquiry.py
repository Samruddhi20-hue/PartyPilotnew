
from datetime import datetime
from app.extensions import db


class Enquiry(db.Model):
    __tablename__ = "enquiries"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=True
    )

    customer_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(30), nullable=False)

    venue_id = db.Column(db.String(150), nullable=True)
    venue_name = db.Column(db.String(200), nullable=True)

    event_type = db.Column(db.String(100), nullable=True)
    event_date = db.Column(db.Date, nullable=True)
    guest_count = db.Column(db.Integer, nullable=False)
    budget = db.Column(db.Float, nullable=True)
    message = db.Column(db.Text, nullable=True)

    status = db.Column(db.String(30), default="new", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    customer = db.relationship("Customer", back_populates="enquiries")

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "customer_name": self.customer_name,
            "email": self.email,
            "phone": self.phone,
            "venue_id": self.venue_id,
            "venue_name": self.venue_name,
            "event_type": self.event_type,
            "event_date": self.event_date.isoformat() if self.event_date else None,
            "guest_count": self.guest_count,
            "budget": self.budget,
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at.isoformat()
        }
