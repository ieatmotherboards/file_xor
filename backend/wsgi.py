import sys
import os

# Set production environment
os.environ['FLASK_ENV'] = 'production'

# Add your flask app directory to the path
sys.path.insert(0, '/home/holdenen/flask_app')

# Activate virtual environment
activate_this = '/home/holdenen/flask_app/venv/bin/activate_this.py'
if os.path.exists(activate_this):
    with open(activate_this) as f:
        exec(f.read(), {'__file__': activate_this})

# Import the Flask app
from app import app as application