from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, unset_jwt_cookies, jwt_required, get_jwt_identity
from api.models import db, User, Record
from api.auth import create_new_account, login_user
from api.compute_diff import compute_diff
from api.getmerges import get_merges

app = Flask(__name__)

CORS(app, 
     resources={r"/*": {"origins": "http://localhost:3000"}},  # Your React dev server
     supports_credentials=True,
     allow_headers=["Content-Type"],
     methods=["GET", "POST", "OPTIONS"])
# --- CONFIG ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///myapp.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = "super-secret-key"  # change in production
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = False  # False for development (HTTP), True for production (HTTPS)
app.config["JWT_COOKIE_SAMESITE"] = "Lax" 
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

# --- INIT ---
db.init_app(app)
jwt = JWTManager(app)

# --- INITIALIZE DB ---
with app.app_context():
    db.create_all()


# --- ROUTES ---
@app.route("/create_account", methods=["POST"])
def create_account():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    return create_new_account(username, password)


@app.route("/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    return login_user(username, password)


@app.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"success": "logged out"})
    unset_jwt_cookies(response)
    return response, 200

@app.route("/verify_token", methods=["GET"])
@jwt_required()
def verify_token():
    current_user = get_jwt_identity()
    return jsonify({"authenticated": True, "username": current_user}), 200

@app.route("/get_merges", methods=["GET"])
@jwt_required()
def return_merges():
    return get_merges()

    

@app.route("/compute_diff", methods=["POST"])
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