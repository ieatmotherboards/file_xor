from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    records = db.relationship('Record', backref='user', lazy=True)


class Record(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    file_a = db.Column(db.String(255), nullable=False)
    # file_a_path = db.Column(db.String(255), nullable=False) # 
    file_b = db.Column(db.String(255), nullable=False)
    # file_b_path = db.Column(db.String(255), nullable=False)
    merge = db.Column(db.String(255), nullable=True) # not gonna use this
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)