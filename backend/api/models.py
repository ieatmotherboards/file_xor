from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    records = db.relationship('Record', backref='user', lazy=True)

class Record(db.Model):
    __tablename__ = 'records'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    saved_path = db.Column(db.String(512), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "saved_path": self.saved_path,
            "original_filename": self.original_filename,
            "created_at": self.created_at.isoformat(),
            "notes": self.notes
        }


# class Record(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     file_a = db.Column(db.String(255), nullable=False)
#     file_b = db.Column(db.String(255), nullable=False)
#     merge = db.Column(db.String(255), nullable=True)
#     author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)