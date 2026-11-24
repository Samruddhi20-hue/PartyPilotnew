
from datetime import datetime
from app.extensions import db


class Favourite(db.Model):
    __tablename__ = "favourites"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=True
    )

    venue_id = db.Column(db.String(150), nullable=False)
    venue_name = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    customer = db.relationship("Customer", back_populates="favourites")

    __table_args__ = (
        db.UniqueConstraint(
            "customer_id",
            "venue_id",
            name="unique_customer_venue_favourite"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "venue_id": self.venue_id,
            "venue_name": self.venue_name,
            "created_at": self.created_at.isoformat()
        }
