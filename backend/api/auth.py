from flask import jsonify
from flask_jwt_extended import create_access_token, set_access_cookies
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
from api.models import db, User


def create_new_account(username: str, password: str):
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    existing = User.query.filter_by(username=username).first()
    if existing:
        return jsonify({"error": "Username already in use"}), 403

    hashed_pw = generate_password_hash(password)
    new_user = User(username=username, password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"success": "Account created"}), 201


def login_user(username, password):
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity=user.username, expires_delta=timedelta(hours=1))

    response = jsonify({"success": True, "username": user.username})
    set_access_cookies(response, access_token)
    return response, 200