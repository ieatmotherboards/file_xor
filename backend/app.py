from flask import Flask, request, jsonify
from flask_cors import CORS
from diff_engine import compute_diff

app = Flask(__name__)
CORS(app)

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
