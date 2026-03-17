from flask import Flask
from threading import Thread

app = Flask(__name__)

@app.route('/')
def home():
    return "ANIVOID BOT IS ONLINE"

@app.route('/health')
def health():
    return {"status": "online", "bot": "running", "scheduler": "active"}

def run():
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)

def keep_alive():
    t = Thread(target=run, daemon=True)
    t.start()
    print("[WEB] Keep-alive server started on port 5000")
