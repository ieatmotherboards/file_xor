from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, User, Record

@jwt_required()
def get_merges():
    try:
        # Get the current user's username from JWT
        current_username = get_jwt_identity()
        
        # Find the user in the database
        user = User.query.filter_by(username=current_username).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get all records for this user
        records = Record.query.filter_by(author_id=user.id).all()
        
        # Build the merge list
        merges = []
        for record in records:
            # Read file_a content
            try:
                with open(record.file_a, 'r') as f:
                    file_a_lines = f.read().splitlines()[:3]  # First 3 lines
            except Exception:
                file_a_lines = []
            
            # Read file_b content
            try:
                with open(record.file_b, 'r') as f:
                    file_b_lines = f.read().splitlines()[:3]  # First 3 lines
            except Exception:
                file_b_lines = []
            
            # Extract file names and extensions
            import os
            file_a_name = os.path.basename(record.file_a)
            file_b_name = os.path.basename(record.file_b)
            
            file_a_ext = os.path.splitext(file_a_name)[1][1:] or "txt"  # Remove the dot
            file_b_ext = os.path.splitext(file_b_name)[1][1:] or "txt"
            
            merge_obj = {
                "id": record.id,
                "left_name": os.path.splitext(file_a_name)[0],  # Name without extension
                "left_extension": file_a_ext,
                "left_first_lines": file_a_lines,
                "right_name": os.path.splitext(file_b_name)[0],
                "right_extension": file_b_ext,
                "right_first_lines": file_b_lines
            }
            
            merges.append(merge_obj)
        
        return jsonify({"merges": merges}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500