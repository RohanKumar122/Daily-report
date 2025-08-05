from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv
from bson import ObjectId
import csv
from io import StringIO
from flask import Response
from flask import send_file
from openpyxl import Workbook
from io import BytesIO
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
# CORS(app, resources={r"/*": {"origins": ["http://localhost:5000", "https://daily-report-ypil-b35k6ry9z-rohan-kumars-projects-3b796da9.vercel.app/","https://daily-report-ypil.vercel.app/"]}})



client = MongoClient(os.getenv("MONGO_URI"))
db = client["daily_reports"]
collection = db["reports"]

def clean_excel_value(value):
    if isinstance(value, str):
        # keep normal chars + tab/newline/carriage return
        return ''.join(ch for ch in value if ord(ch) >= 32 or ch in '\t\n\r')
    return value

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
    reports = list(collection.find({}).sort("date", -1))
    for report in reports:
        report["_id"] = str(report["_id"]) 
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
    data = request.get_json()
    report_id = data.get("id")

    if not report_id:
        return jsonify({"error": "Report ID is required"}), 400

    try:
        result = collection.delete_one({"_id": ObjectId(report_id)})
    except Exception as e:
        return jsonify({"error": "Invalid ID format", "details": str(e)}), 400

    if result.deleted_count == 0:
        return jsonify({"message": "No report found to delete"}), 404

    return jsonify({"message": "Report deleted successfully"}), 200


@app.route("/download", methods=["GET"])
def download_excel():
    reports = list(collection.find({}))

    def parse_date(report):
        try:
            return datetime.strptime(report.get("date", ""), "%Y-%m-%d")
        except:
            return datetime.min

    reports.sort(key=parse_date)

    wb = Workbook()
    ws = wb.active
    ws.title = "Reports"

    headers = ["Date", "Report", "Notes", "Created At"]
    ws.append(headers)

    for r in reports:
        ws.append([
            clean_excel_value(r.get("date", "")),
            clean_excel_value(r.get("report", "")),
            clean_excel_value(r.get("notes", "")),  # 🔥 fixed typo: "notes" not "note"
            clean_excel_value(r.get("dateCreated", ""))
        ])

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        download_name="reports.xlsx",
        as_attachment=True
    )

# Vercel expects a variable namyyyyed `handler` as the app entry point
# handler = app
# Uncomment below for local development
# if __name__ == "__main__":
#     app.run(debug=True, port=int(os.getenv("PORT", 5000)))
