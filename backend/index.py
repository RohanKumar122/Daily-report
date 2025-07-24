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
    if not data.get("date") or not data.get("report"):
        return jsonify({"error": "Date and report are required"}), 400

    report = {
        "date": data["date"],
        "report": data["report"],
        "notes": data.get("notes", ""),
        "dateCreated": datetime.now().isoformat()
    }
    collection.insert_one(report)
    return jsonify({"message": "Report added successfully"}), 201

@app.route("/reports", methods=["GET"])
def get_reports():
    # Sort by most recent dateCreated
    reports = list(collection.find({}, {"_id": 0}).sort("dateCreated", -1))
    return jsonify(reports), 200

@app.route("/update", methods=["PUT"])
def update_report():
    data = request.json
    if not data.get("date") or not data.get("report"):
        return jsonify({"error": "Date and report are required for update"}), 400

    filter_criteria = {"date": data["date"]}  # assuming date is unique
    new_values = {
        "$set": {
            "report": data["report"],
            "notes": data.get("notes", "")
        }
    }
    result = collection.update_one(filter_criteria, new_values)
    if result.matched_count == 0:
        return jsonify({"message": "No report found to update"}), 404
    return jsonify({"message": "Report updated successfully"}), 200

@app.route("/delete", methods=["DELETE"])
def delete_report():
    data = request.json
    if not data.get("date"):
        return jsonify({"error": "Date is required for deletion"}), 400

    result = collection.delete_one({"date": data["date"]})
    if result.deleted_count == 0:
        return jsonify({"message": "No report found to delete"}), 404
    return jsonify({"message": "Report deleted successfully"}), 200

# Uncomment below for local development
# if __name__ == "__main__":
#     app.run(debug=True, port=int(os.getenv("PORT", 5000)))
