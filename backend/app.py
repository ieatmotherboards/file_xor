from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from api.compute_diff import compute_diff

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///myapp.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), unique=False, nullable=False)
    records = db.relationship('Record', backref='user', lazy=True)

class Record(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # author = db.Column(db.String(255), unique=False, nullable=False)
    file_a = db.Column(db.String(255), unique=False, nullable=False)
    file_b = db.Column(db.String(255), unique=False, nullable=False)
    merge = db.Column(db.String(255), unique=False, nullable=True)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# --- INITIALIZE DB ---
with app.app_context():
    db.create_all()

@app.route("/diff", methods=["POST"])
def diff_files():
    file1 = request.files.get("file1")
    file2 = request.files.get("file2")

    if not file1 or not file2:
        return jsonify({"error": "file1 and file2 are required"}), 400

    text1 = file1.read().decode("utf-8", errors="ignore")
    text2 = file2.read().decode("utf-8", errors="ignore")

    diff_result = compute_diff(text1, text2)
    return jsonify(diff_result)

if __name__ == "__main__":
    app.run(debug=True, port=5000)