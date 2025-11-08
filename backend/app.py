from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/find_diff', methods=['POST'])
def find_differences():
    # call function to find differences in file and send back JSON
    pass

if __name__ == "__main__":
    app.run(debug=True)