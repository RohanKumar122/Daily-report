from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["daily_reports"]
collection = db["reports"]

@app.route("/")
def index():
    return "Server is running on Vercel!"

@app.route("/add", methods=["POST"])
def add_report():
    data = request.json
    report = {
        "date": data.get("date"),
        "report": data.get("report"),
        "notes": data.get("notes", ""),
        "dateCreated": datetime.now().isoformat()
    }
    collection.insert_one(report)
    return jsonify({"message": "Report added"}), 201

@app.route("/reports", methods=["GET"])
def get_reports():
    reports = list(collection.find({}, {"_id": 0}))
    return jsonify(reports)
