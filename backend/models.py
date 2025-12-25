# models.py
import uuid
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, ENUM as PgEnum
import enum
import datetime

# Initialize SQLAlchemy instance
db = SQLAlchemy()

# Define ENUM for Transaction Type if not using native PG ENUM directly via SQLAlchemy
# This is Python's enum, mapping can be done if needed, or use native PgEnum
class TransactionTypeEnum(enum.Enum):
    DEPOSIT = 'DEPOSIT'
    WITHDRAWAL = 'WITHDRAWAL'

# Define the User Profile model
class UserProfile(db.Model):
    __tablename__ = 'user_profile'

    customer_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    email_address = db.Column(db.String(255), unique=True, nullable=False)
    full_name = db.Column(db.String(255), nullable=True)
    address = db.Column(db.Text, nullable=True)
    phone_number = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationship: One User can have multiple Accounts
    accounts = db.relationship('AccountDetails', back_populates='user_profile', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<UserProfile {self.email_address}>'

# Define the Account Details model
class AccountDetails(db.Model):
    __tablename__ = 'account_details'

    # Using String for account_number as per SQL schema
    account_number = db.Column(db.String(50), primary_key=True)
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('user_profile.customer_id'), nullable=False)
    account_balance = db.Column(db.Numeric(19, 4), nullable=False, default=0.00)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationship: Many Accounts belong to one User
    user_profile = db.relationship('UserProfile', back_populates='accounts')
    # Relationship: One Account can have multiple Transactions
    transactions = db.relationship('Transaction', back_populates='account_details', lazy='dynamic', cascade="all, delete-orphan") # Use lazy='dynamic' for querying

    def __repr__(self):
        return f'<AccountDetails {self.account_number}>'

# Define the Transaction model
class Transaction(db.Model):
    __tablename__ = 'transactions'

    transaction_number = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_number = db.Column(db.String(50), db.ForeignKey('account_details.account_number'), nullable=False)
    # Using native PostgreSQL ENUM
    type = db.Column(PgEnum('DEPOSIT', 'WITHDRAWAL', name='transaction_type', create_type=False), nullable=False)
    amount_before = db.Column(db.Numeric(19, 4), nullable=False)
    amount_after = db.Column(db.Numeric(19, 4), nullable=False)
    timestamp = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.datetime.utcnow)
    description = db.Column(db.String(255), nullable=True)

    # Relationship: Many Transactions belong to one Account
    account_details = db.relationship('AccountDetails', back_populates='transactions')

    def __repr__(self):
        return f'<Transaction {self.transaction_number} for {self.account_number}>'
