# Poker Log Analysis Backend

This Flask application analyzes PokerNow log files and provides insights on player performance.

## PythonAnywhere Deployment Instructions

### 1. Create a PythonAnywhere Account

If you don't already have one, create a free account at [PythonAnywhere](https://www.pythonanywhere.com/).

### 2. Upload the Files

From the PythonAnywhere dashboard:

1. Go to the "Files" tab
2. Create a new directory for your application (e.g., `pokerlog_api`)
3. Upload all the files from this `python_backend` directory to that folder

Alternatively, you can use a Git repository:

```bash
# In the PythonAnywhere bash console
git clone <your-repository-url>
cd <your-repository-directory>/python_backend
```

### 3. Set Up a Virtual Environment

In the PythonAnywhere bash console:

```bash
cd ~/pokerlog_api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Configure the Web App

1. Go to the "Web" tab in the PythonAnywhere dashboard
2. Click "Add a new web app"
3. Choose "Manual configuration" and select Python version (Python 3.8 or higher recommended)
4. Set the path to your Flask app:
   - Source code: `/home/yourusername/pokerlog_api`
   - Working directory: `/home/yourusername/pokerlog_api`

5. Modify the WSGI configuration file by clicking on the link in the web tab:

```python
import sys
import os

# Add your project directory to the sys.path
project_home = '/home/yourusername/pokerlog_api'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variables
os.environ['FLASK_ENV'] = 'production'

# Import your app
from app import app as application  # noqa
```

6. Create necessary directories:
```bash
mkdir -p ~/pokerlog_api/uploads
mkdir -p ~/pokerlog_api/results
chmod 755 ~/pokerlog_api/uploads
chmod 755 ~/pokerlog_api/results
```

### 5. Configure CORS and Security

Ensure your Flask app CORS settings allow connections from your frontend domain:

```python
# In app.py
from flask_cors import CORS
CORS(app, resources={r"/*": {"origins": "https://yourdomain.com"}})
```

### 6. Reload the Web App

Go back to the "Web" tab and click the "Reload" button for your web app.

### 7. Test the Deployment

Your API should now be available at:
```
https://yourusername.pythonanywhere.com/
```

You can test it with:
```
https://yourusername.pythonanywhere.com/job-status/test
```

## Local Development

To run the application locally:

```bash
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:5000/`. 