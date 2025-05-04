from flask import Flask, render_template, request
import base64

app = Flask(__name__)
qr_data = ""  # Menyimpan QR code base64 sementara
status = "Not connected"  # Status koneksi WhatsApp

@app.route("/wa")
def show_qr():
    return render_template("wa.html", qr_data=qr_data, status=status)

@app.route("/qr", methods=["POST"])
def receive_qr():
    global qr_data
    qr_data = request.json["qr"]
    return {"status": "QR received"}

@app.route("/status", methods=["POST"])
def receive_status():
    global status
    status = request.json["status"]
    return {"status": "Status updated"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
