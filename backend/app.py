import os
import uuid
from decimal import Decimal
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# --- Load env ---
load_dotenv()

# --- DB & Models ---
from models import (
    db,
    UserProfile,
    AccountDetails,
    Transaction,
    TransactionTypeEnum
)

# --- App ---
app = Flask(__name__)

# --- Config ---
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "sqlite:///banking.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# --- Init ---
db.init_app(app)
CORS(app)


# ---------- Utils ----------
def generate_account_number():
    return "ACC" + str(uuid.uuid4()).replace("-", "")[:12].upper()


def get_default_user():
    """
    Dev mode: single fixed user
    """
    user = UserProfile.query.first()

    if not user:
        user = UserProfile(
            email_address="dev@test.com",
            full_name="Dev User",
            is_active=True
        )
        db.session.add(user)
        db.session.commit()

        account = AccountDetails(
            account_number=generate_account_number(),
            customer_id=user.customer_id,
            account_balance=Decimal("0.00")
        )
        db.session.add(account)
        db.session.commit()

    return user


# ---------- Routes ----------

@app.route("/")
def index():
    return jsonify({
        "message": "Backend running (NO AUTH MODE)",
        "status": "OK"
    })


# ---------- PROFILE ----------
@app.route("/api/profile", methods=["GET"])
def get_profile():
    user = get_default_user()

    return jsonify({
        "customer_id": str(user.customer_id),
        "full_name": user.full_name,
        "email_address": user.email_address,
        "address": user.address,
        "phone_number": user.phone_number,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None
    })


# ---------- ACCOUNT ----------
@app.route("/api/account", methods=["GET"])
def get_account():
    user = get_default_user()

    account = AccountDetails.query.filter_by(
        customer_id=user.customer_id
    ).first()

    txns = Transaction.query.filter_by(
        account_number=account.account_number
    ).order_by(Transaction.timestamp.desc()).limit(10).all()

    return jsonify({
        "account_number": account.account_number,
        "account_balance": str(account.account_balance),
        "created_at": account.created_at.isoformat() if account.created_at else None,
        "transactions": [
            {
                "transaction_number": str(t.transaction_number),
                "type": t.type,  # already string
                "amount_before": str(t.amount_before),
                "amount_after": str(t.amount_after),
                "timestamp": t.timestamp.isoformat(),
                "description": t.description
            } for t in txns
        ]
    })


# ---------- DEPOSIT ----------
@app.route("/api/deposit", methods=["POST"])
def deposit():
    user = get_default_user()
    data = request.get_json() or {}

    amount = Decimal(str(data.get("amount", 0)))
    if amount <= 0:
        return jsonify({"message": "Invalid deposit amount"}), 400

    account = AccountDetails.query.filter_by(
        customer_id=user.customer_id
    ).first()

    before = account.account_balance
    after = before + amount
    account.account_balance = after

    txn = Transaction(
        account_number=account.account_number,
        type=TransactionTypeEnum.DEPOSIT.value,  # ✅ FIX
        amount_before=before,
        amount_after=after,
        description="Deposit",
        timestamp=datetime.utcnow()
    )

    db.session.add(txn)
    db.session.commit()

    return jsonify({
        "message": "Deposit successful",
        "balance": str(after)
    }), 200


# ---------- WITHDRAW ----------
@app.route("/api/withdraw", methods=["POST"])
def withdraw():
    user = get_default_user()
    data = request.get_json() or {}

    amount = Decimal(str(data.get("amount", 0)))
    if amount <= 0:
        return jsonify({"message": "Invalid withdrawal amount"}), 400

    account = AccountDetails.query.filter_by(
        customer_id=user.customer_id
    ).first()

    if account.account_balance < amount:
        return jsonify({"message": "Insufficient balance"}), 400

    before = account.account_balance
    after = before - amount
    account.account_balance = after

    txn = Transaction(
        account_number=account.account_number,
        type=TransactionTypeEnum.WITHDRAWAL.value,  # ✅ FIX
        amount_before=before,
        amount_after=after,
        description="Withdrawal",
        timestamp=datetime.utcnow()
    )

    db.session.add(txn)
    db.session.commit()

    return jsonify({
        "message": "Withdrawal successful",
        "balance": str(after)
    }), 200


# ---------- DB INIT ----------
with app.app_context():
    db.create_all()


# ---------- RUN ----------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
