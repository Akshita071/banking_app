# app.py
import os
import uuid
import datetime
from functools import wraps
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy import text # For potentially creating ENUM type

# --- Load Environment Variables ---
# Make sure this runs before using os.environ.get() for config
load_dotenv()

# --- Import Database and Models ---
# Ensure models.py is correct (UserProfile has is_active, AccountDetails does NOT have currency)
from models import db, UserProfile, AccountDetails, Transaction, TransactionTypeEnum

# --- Application Setup ---
app = Flask(__name__)

# --- Configuration ---
# Reads from .env file or system environment variables
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-fallback-secret-key-change-me') # Added fallback for safety
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')

app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'a-very-strong-default-secret-key-for-dev-only')

#    Configure Session Cookie Attributes for SameSite=None
app.config.update(
    SESSION_COOKIE_SECURE=True,    # **MUST** be True for SameSite=None. Requires HTTPS.
    SESSION_COOKIE_HTTPONLY=True,  # Recommended. Prevents client-side JS access.
    SESSION_COOKIE_SAMESITE='None' # Set SameSite attribute to 'None'.
)

# Check if essential config is missing
if not app.config['SQLALCHEMY_DATABASE_URI']:
    print("FATAL ERROR: DATABASE_URL environment variable not set.")
    exit() # Exit if DB URL is missing
if not GOOGLE_CLIENT_ID:
    print("FATAL ERROR: GOOGLE_CLIENT_ID environment variable not set.")
    exit() # Exit if Client ID is missing
if app.config['SECRET_KEY'] == 'default-fallback-secret-key-change-me':
    print("WARNING: Using default SECRET_KEY. Please set a strong secret key in your environment.")


# --- Initialize Extensions ---
db.init_app(app) # Initialize SQLAlchemy with the app
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
])

# --- Authentication Decorator ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"Session content before check: {session}")
        if 'user_id' not in session:
            return jsonify({"message": "Authentication required"}), 401
        user = UserProfile.query.get(session['user_id'])
        if user is None or not user.is_active:
            session.pop('user_id', None)
            return jsonify({"message": "Authentication failed or user inactive"}), 401
        # Optionally pass the user object if needed by the route
        # kwargs['current_user'] = user
        return f(*args, **kwargs)
    return decorated_function

# --- Utility Functions ---
def generate_account_number():
    # Replace with a robust unique generation strategy for production
    return 'ACC' + str(uuid.uuid4()).replace('-', '')[:12].upper()

# --- Routes ---

@app.route('/')
def index():
    if 'user_id' in session:
        user = UserProfile.query.get(session['user_id'])
        return jsonify({"message": f"Welcome {user.full_name if user else 'User'}!", "logged_in": True})
    return jsonify({"message": "Welcome! Please log in.", "logged_in": False})


@app.route('/auth/google_signin', methods=['POST'])
def google_signin():
    try:
        data = request.get_json()
        token = data.get('token')

        if not token:
            return jsonify({"message": "Missing ID token"}), 400

        print("Received token, attempting verification...") # Log
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        print(f"Token verified successfully for email: {idinfo.get('email')}") # Log

        google_id = idinfo['sub']
        email = idinfo['email']
        full_name = idinfo.get('name')

        user = UserProfile.query.filter_by(google_id=google_id).first()

        new_user_created = False
        if user:
            if not user.is_active:
                print(f"Login attempt failed: User inactive - {email}") # Log
                return jsonify({"message": "User account is inactive"}), 403
            print(f"User found: {user.email_address}") # Log
        else:
            print(f"Creating new user for: {email}") # Log
            user = UserProfile(
                google_id=google_id,
                email_address=email,
                full_name=full_name,
                is_active=True # Include is_active based on previous fix
            )
            db.session.add(user)
            # Commit here to ensure user exists before account creation
            db.session.commit()
            new_user_created = True
            print(f"New user created with customer_id: {user.customer_id}") # Log


            # --- Create a default account for the new user ---
            print(f"Creating default account for user {user.email_address}") # Log
            new_account_number = generate_account_number()
            while AccountDetails.query.get(new_account_number):
                new_account_number = generate_account_number()

            account = AccountDetails(
                account_number=new_account_number,
                customer_id=user.customer_id,
                account_balance=0.00
                # No currency here - removed based on user request
            )
            db.session.add(account)
            print(f"Added default account {new_account_number} to session") # Log

        # Commit any changes (like new account if user was just created)
        db.session.commit()
        print("Database changes committed.") # Log

        session['user_id'] = str(user.customer_id) # Store UUID as string
        print(f"Session set for user_id: {session['user_id']}") # Log

        return jsonify({
            "message": "Login successful",
            "user": {
                "customer_id": str(user.customer_id),
                "email": user.email_address,
                "full_name": user.full_name
            }
        }), 200

    except ValueError as e:
        # Handle invalid token specifically
        print(f"Token verification failed: {e}") # Log detailed error
        return jsonify({"message": f"Invalid Google ID token: {e}"}), 401
    except Exception as e:
        db.session.rollback()
        print(f"ERROR in google_signin: {e}") # Log general errors
        # Consider more specific error handling/logging
        return jsonify({"message": "An error occurred during sign-in."}), 500


@app.route('/auth/logout', methods=['POST'])
@login_required
def logout():
    user_id_logged_out = session.pop('user_id', None)
    if user_id_logged_out:
        print(f"User logged out: {user_id_logged_out}") # Log
    else:
        print("Logout attempt for user not in session.") # Log
    return jsonify({"message": "Logout successful"}), 200


@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile_api():
    try:
        user_id = session['user_id']
        print(f"Fetching profile for user_id: {user_id}") # Log
        user = UserProfile.query.get(user_id)

        if not user:
            print(f"Profile fetch failed: User not found for id {user_id}") # Log
            return jsonify({"message": "User not found"}), 404

        profile_data = {
            "customer_id": str(user.customer_id),
            "full_name": user.full_name,
            "address": user.address,
            "phone_number": user.phone_number,
            "email_address": user.email_address,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }
        print("Profile data fetched successfully.") # Log
        return jsonify(profile_data), 200
    except Exception as e:
        print(f"ERROR in get_profile_api: {e}") # Log errors
        return jsonify({"message": "An error occurred fetching profile."}), 500


@app.route('/api/account', methods=['GET'])
@login_required
def get_account_api():
    print("--- Entered get_profile_api function ---")
    try:
        user_id = session['user_id']
        print(f"Fetching accounts for user_id: {user_id}") # Log
        accounts = AccountDetails.query.filter_by(customer_id=user_id).all()

        if not accounts:
            print("No accounts found for user.") # Log
            return jsonify([]), 200 # Return empty list if no accounts

        accounts_data = []
        for account in accounts:
            print(f"Processing account: {account.account_number}") # Log
            recent_transactions = Transaction.query.filter_by(account_number=account.account_number)\
                                                .order_by(Transaction.timestamp.desc())\
                                                .limit(10).all()
            transactions_data = [{
                "transaction_number": str(t.transaction_number),
                "type": t.type.name if hasattr(t.type, 'name') else str(t.type),
                "amount_before": float(t.amount_before),
                "amount_after": float(t.amount_after),
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
                "description": t.description
            } for t in recent_transactions]

            accounts_data.append({
                "account_number": account.account_number,
                "customer_id": str(account.customer_id),
                "account_balance": float(account.account_balance),
                "created_at": account.created_at.isoformat() if account.created_at else None,
                "updated_at": account.updated_at.isoformat() if account.updated_at else None,
                "transactions": transactions_data
            })
        print("Account data fetched successfully.") # Log
        return jsonify(accounts_data), 200
    except Exception as e:
        print(f"ERROR in get_account_api: {e}") # Log errors
        # Consider more specific error handling
        return jsonify({"message": "An error occurred fetching account data."}), 500

# --- Database Initialization (Run once or use Migrations) ---
# Be cautious using create_all in production - use Flask-Migrate
with app.app_context():
    print("Checking database tables...")
    try:
        # Attempt to create ENUM type if it doesn't exist (PostgreSQL specific)
        try:
            result = db.session.execute(text("SELECT 1 FROM pg_type WHERE typname = 'transaction_type'"))
            if result.scalar() is None:
                enum_sql = "CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'FEE');"
                db.session.execute(text(enum_sql))
                db.session.commit()
                print("ENUM 'transaction_type' created.")
            else:
                print("ENUM 'transaction_type' already exists.")
        except Exception as enum_e:
            db.session.rollback()
            # If it fails because it exists, that's okay. If other error, print it.
            if 'already exists' not in str(enum_e).lower():
                print(f"NOTICE: Could not create/check ENUM: {enum_e}")
            else:
                print("ENUM 'transaction_type' already exists.")

        db.create_all() # Create tables based on models if they don't exist
        print("Database tables checked/created (if necessary).")
    except Exception as e:
        print(f"ERROR during database initialization: {e}")
        print("Please ensure database connection is valid and user has permissions.")

# --- Main Execution ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    print(f"Starting Flask server on port {port} with debug mode: {debug_mode}")
    # Use host='0.0.0.0' to be accessible externally (like in Cloud Run/Docker)
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
