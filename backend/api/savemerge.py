import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from .models import User, Record, db

# bp = Blueprint('savemerge', __name__)
def savemerge():
    """
    Save merged code content to disk and record metadata in the database.
    Expects JSON with:
      - user_id
      - filename
      - merged_content
      - notes (optional)
    """
    # return jsonify({
    #     "message": "exited early to test",
    # }), 200
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    filename = data.get("filename")
    merged_content = data.get("merged_content")
    notes = data.get("notes", "")

    

    if not all([user_id, filename, merged_content]):
        return jsonify({"error": "Missing required fields"}), 400

    # Verify user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Invalid user ID"}), 404

    # Generate unique filename
    name, ext = os.path.splitext(secure_filename(filename))
    unique_id = str(uuid.uuid4())
    final_name = f"{unique_id}_{name}{ext}"

    # Save path (ensure folder exists)
    save_dir = os.path.join(current_app.root_path, "uploads", "merges")
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, final_name)

    # Write merged file to disk
    with open(save_path, "w", encoding="utf-8") as f:
        f.write(merged_content)

    # Record entry in DB
    record = Record(
        user_id=user_id,
        filename=final_name,
        saved_path=save_path,
        original_filename=filename,
        notes=notes
    )
    db.session.add(record)
    db.session.commit()

    return jsonify({
        "message": "Merge saved successfully",
        "record": record.to_dict()
    }), 201
