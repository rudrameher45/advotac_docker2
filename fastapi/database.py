from sqlalchemy import create_engine, Column, String, Boolean, DateTime, Text, Integer, ForeignKey, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import logging
import enum
from typing import Optional, List

from config import settings
import os

# Configure logging for serverless environment (Vercel)
# Only log to stdout/stderr since filesystem is read-only except /tmp
handlers = [logging.StreamHandler()]

# Only add file handler if not in serverless environment
if os.environ.get('VERCEL') != '1':
    try:
        handlers.append(logging.FileHandler('database.log', encoding='utf-8'))
    except (OSError, IOError):
        pass  # Skip file logging if filesystem is read-only

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=handlers
)
logger = logging.getLogger(__name__)

# Create database engine with optimized settings for serverless
logger.info(f"Connecting to database: {settings.PGDATABASE} at {settings.PGHOST}")

# Serverless-optimized connection pool settings
is_serverless = os.environ.get('VERCEL') == '1'

if is_serverless:
    # For serverless (Vercel), use minimal pooling with aggressive timeouts
    engine = create_engine(
        settings.DATABASE_URL,
        echo=False,  # Disable SQL echo in production
        pool_pre_ping=True,  # Check connection health before using
        pool_size=1,  # Minimal pool for serverless
        max_overflow=0,  # No overflow connections
        pool_recycle=300,  # Recycle connections after 5 minutes
        connect_args={
            "connect_timeout": 5,  # 5 second connection timeout (faster fail)
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
            "options": "-c statement_timeout=20000"  # 20 second query timeout
        },
        pool_timeout=5  # Wait max 5 seconds for a connection from pool
    )
else:
    # For local development, use standard pooling
    engine = create_engine(
        settings.DATABASE_URL,
        echo=True,  # Keep SQL echo for debugging
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,
        connect_args={
            "connect_timeout": 10,
            "options": "-c statement_timeout=60000"  # 60 second query timeout for local
        }
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Enums for user_info table
class UserRoleEnum(str, enum.Enum):
    STUDENT = "student"
    LAWYER = "lawyer"
    ADVOCATE = "advocate"
    INTERN = "intern"
    ORGANISATION = "organisation"

class IndianStateEnum(str, enum.Enum):
    # States
    ANDHRA_PRADESH = "Andhra Pradesh"
    ARUNACHAL_PRADESH = "Arunachal Pradesh"
    ASSAM = "Assam"
    BIHAR = "Bihar"
    CHHATTISGARH = "Chhattisgarh"
    GOA = "Goa"
    GUJARAT = "Gujarat"
    HARYANA = "Haryana"
    HIMACHAL_PRADESH = "Himachal Pradesh"
    JHARKHAND = "Jharkhand"
    KARNATAKA = "Karnataka"
    KERALA = "Kerala"
    MADHYA_PRADESH = "Madhya Pradesh"
    MAHARASHTRA = "Maharashtra"
    MANIPUR = "Manipur"
    MEGHALAYA = "Meghalaya"
    MIZORAM = "Mizoram"
    NAGALAND = "Nagaland"
    ODISHA = "Odisha"
    PUNJAB = "Punjab"
    RAJASTHAN = "Rajasthan"
    SIKKIM = "Sikkim"
    TAMIL_NADU = "Tamil Nadu"
    TELANGANA = "Telangana"
    TRIPURA = "Tripura"
    UTTAR_PRADESH = "Uttar Pradesh"
    UTTARAKHAND = "Uttarakhand"
    WEST_BENGAL = "West Bengal"
    # Union Territories
    ANDAMAN_NICOBAR = "Andaman and Nicobar Islands"
    CHANDIGARH = "Chandigarh"
    DADRA_NAGAR_HAVELI_DAMAN_DIU = "Dadra and Nagar Haveli and Daman and Diu"
    DELHI = "Delhi"
    JAMMU_KASHMIR = "Jammu and Kashmir"
    LADAKH = "Ladakh"
    LAKSHADWEEP = "Lakshadweep"
    PUDUCHERRY = "Puducherry"

class UserStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

# Database models
class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    picture = Column(String, nullable=True)
    verified_email = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to user_info
    user_info = relationship("UserInfoDB", back_populates="user", uselist=False, cascade="all, delete-orphan")
    assistant_history = relationship("AssistantHistoryDB", back_populates="user", cascade="all, delete-orphan")
    general_task_history = relationship(
        "GeneralTaskHistoryDB",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    credit_balances = relationship(
        "CreditBalanceDB",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    credit_usage = relationship(
        "CreditUsageDB",
        back_populates="user",
        cascade="all, delete-orphan",
    )

class UserInfoDB(Base):
    __tablename__ = "user_info"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)  # Can be different from Google name
    profile_pic = Column(String, nullable=True)  # Can override Google picture
    email = Column(String, nullable=True)  # Reference email
    phone = Column(String(10), nullable=True)  # Indian 10-digit phone number
    phone_verified = Column(Boolean, default=False)
    state = Column(Enum(IndianStateEnum), nullable=True)
    iam_a = Column(Enum(UserRoleEnum), nullable=True)  # User role/type
    user_status = Column(Enum(UserStatusEnum), default=UserStatusEnum.ACTIVE)  # Default status is 'active'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship back to user
    user = relationship("UserDB", back_populates="user_info")

class AuthLogDB(Base):
    __tablename__ = "auth_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, index=True)
    email = Column(String, index=True)
    action = Column(String)  # 'login', 'logout', 'token_refresh'
    status = Column(String)  # 'success', 'failed'
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class DocumentAnalysisDB(Base):
    __tablename__ = "document_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(32), unique=True, index=True, nullable=False)
    user_email = Column(String, index=True, nullable=True)
    task = Column(String, nullable=False, default="Analysis Docs")
    prompt = Column(Text, nullable=True)
    source_excerpt = Column(Text, nullable=True)
    result = Column(Text, nullable=False)
    model = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AssistantHistoryDB(Base):
    __tablename__ = "assistant_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    task_name = Column(String(100), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    response_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("UserDB", back_populates="assistant_history")


class GeneralTaskHistoryDB(Base):
    __tablename__ = "general_task_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    task_name = Column(String(100), nullable=False, default="General")
    query = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    response_payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("UserDB", back_populates="general_task_history")


class CreditPlanDB(Base):
    __tablename__ = "credit_plan"

    credit_id = Column(Integer, primary_key=True, autoincrement=True)
    assistant_general = Column(Integer, nullable=False, default=4)
    assistant_summary = Column(Integer, nullable=False, default=2)
    assistant_translate = Column(Integer, nullable=False, default=2)
    assistant_citation_check = Column(Integer, nullable=False, default=3)

    credit_balances = relationship(
        "CreditBalanceDB",
        back_populates="plan",
        cascade="all, delete-orphan",
    )
    credit_usage = relationship(
        "CreditUsageDB",
        back_populates="plan",
        cascade="all, delete-orphan",
    )


class CreditBalanceDB(Base):
    __tablename__ = "credit_balance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    credit_id = Column(Integer, ForeignKey('credit_plan.credit_id', ondelete='RESTRICT'), nullable=False, index=True)
    credit = Column(Integer, nullable=False, default=0)
    last_update_time = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("UserDB", back_populates="credit_balances")
    plan = relationship("CreditPlanDB", back_populates="credit_balances")


class CreditUsageDB(Base):
    __tablename__ = "credit_useed"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    credit_id = Column(Integer, ForeignKey('credit_plan.credit_id', ondelete='RESTRICT'), nullable=False, index=True)
    task = Column(String(100), nullable=False)
    credit_add = Column(Integer, nullable=False, default=0)
    credit_reduct = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("UserDB", back_populates="credit_usage")
    plan = relationship("CreditPlanDB", back_populates="credit_usage")


class InsufficientCreditsError(Exception):
    """Raised when a user attempts to use more credits than available."""


DEFAULT_INITIAL_CREDITS = 80


def _get_or_create_default_plan(db) -> CreditPlanDB:
    """Fetch the default credit plan, creating it if necessary."""
    plan = db.query(CreditPlanDB).order_by(CreditPlanDB.credit_id.asc()).first()
    if plan:
        return plan

    plan = CreditPlanDB()
    db.add(plan)
    db.commit()
    db.refresh(plan)
    logger.info("Created default credit plan with id=%s", plan.credit_id)
    return plan


def _get_task_credit_cost(plan: CreditPlanDB, task_name: str) -> int:
    """Resolve the credit cost for a task based on the plan settings."""
    task_key = (task_name or "").strip().lower()
    if task_key in {"general", "default"}:
        return plan.assistant_general
    if task_key in {"summary", "assistant_summary"}:
        return plan.assistant_summary
    if task_key in {"translate", "translation", "assistant_translate"}:
        return plan.assistant_translate
    if task_key in {"citation check", "citation", "assistant_citation_check"}:
        return plan.assistant_citation_check
    return plan.assistant_general


def ensure_credit_balance(db, user_id: str, initial_credits: int = DEFAULT_INITIAL_CREDITS) -> CreditBalanceDB:
    """Ensure the user has a credit balance row, seeding with defaults when missing."""
    plan = _get_or_create_default_plan(db)
    balance = (
        db.query(CreditBalanceDB)
        .filter(
            CreditBalanceDB.user_id == user_id,
            CreditBalanceDB.credit_id == plan.credit_id,
        )
        .first()
    )

    if balance:
        return balance

    balance = CreditBalanceDB(
        user_id=user_id,
        credit_id=plan.credit_id,
        credit=initial_credits,
        last_update_time=datetime.utcnow(),
    )
    db.add(balance)
    db.commit()
    db.refresh(balance)
    logger.info("Initialized credit balance for user_id=%s with %s credits", user_id, initial_credits)
    return balance


def get_credit_balance(db, user_id: str) -> CreditBalanceDB:
    """Return the current credit balance for a user, creating one if absent."""
    return ensure_credit_balance(db, user_id)


def ensure_credit_available(db, user_id: str, task_name: str) -> int:
    """
    Confirm the user has enough credits for the task.
    Returns the cost that will be deducted if the action proceeds.
    """
    plan = _get_or_create_default_plan(db)
    balance = ensure_credit_balance(db, user_id)
    cost = _get_task_credit_cost(plan, task_name)

    if cost <= 0:
        return 0

    if balance.credit < cost:
        logger.warning(
            "Insufficient credits for user_id=%s: balance=%s cost=%s task=%s",
            user_id,
            balance.credit,
            cost,
            task_name,
        )
        raise InsufficientCreditsError(f"Not enough credits for task '{task_name}'.")

    return cost


def spend_credits_for_task(db, user_id: str, task_name: str, *, cost: Optional[int] = None) -> CreditBalanceDB:
    """
    Deduct credits for a task based on the default plan rules and log the usage.
    Raises InsufficientCreditsError when the balance is too low.
    """
    plan = _get_or_create_default_plan(db)
    balance = ensure_credit_balance(db, user_id)
    resolved_cost = cost if cost is not None else _get_task_credit_cost(plan, task_name)

    if resolved_cost <= 0:
        return balance

    if balance.credit < resolved_cost:
        logger.warning(
            "Insufficient credits for user_id=%s: balance=%s cost=%s task=%s",
            user_id,
            balance.credit,
            resolved_cost,
            task_name,
        )
        raise InsufficientCreditsError(f"Not enough credits for task '{task_name}'.")

    balance.credit -= resolved_cost
    balance.last_update_time = datetime.utcnow()

    usage = CreditUsageDB(
        user_id=user_id,
        credit_id=plan.credit_id,
        task=task_name,
        credit_add=0,
        credit_reduct=resolved_cost,
    )

    db.add(usage)
    db.add(balance)
    db.commit()
    db.refresh(balance)
    logger.info(
        "Deducted %s credits for task '%s' (user_id=%s). Remaining=%s",
        resolved_cost,
        task_name,
        user_id,
        balance.credit,
    )
    return balance


# Database functions
def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database - create all tables"""
    try:
        logger.info("Initializing database...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
        
        # Log table info
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"Available tables: {tables}")
        
        for table in tables:
            columns = inspector.get_columns(table)
            logger.info(f"Table '{table}' columns: {[col['name'] for col in columns]}")
        
        return True
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

def test_connection():
    """Test database connection"""
    try:
        logger.info("Testing database connection...")
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection successful!")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise

def log_auth_event(db, user_id: str, email: str, action: str, status: str, 
                   ip_address: str = None, user_agent: str = None, error_message: str = None):
    """Log authentication events to database"""
    try:
        auth_log = AuthLogDB(
            user_id=user_id,
            email=email,
            action=action,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
            error_message=error_message
        )
        db.add(auth_log)
        db.commit()
        logger.info(f"Auth event logged: {action} - {status} for {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to log auth event: {str(e)}")
        db.rollback()
        return False

def log_assistant_history(
    db,
    *,
    user_id: str,
    task_name: str,
    question: str,
    answer: str,
    response_time_ms: Optional[int] = None,
):
    """Persist assistant responses for history tracking."""
    try:
        record = AssistantHistoryDB(
            user_id=user_id,
            task_name=task_name,
            question=question,
            answer=answer,
            response_time_ms=response_time_ms,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info(f"Assistant history logged for user_id={user_id} task={task_name}")
        return record
    except Exception as e:
        logger.error(f"Failed to log assistant history: {str(e)}")
        db.rollback()
        raise


def log_general_task_history(
    db,
    *,
    user_id: str,
    token: str,
    task_name: str,
    query: str,
    answer: str,
    response_payload: dict,
    created_at: Optional[datetime] = None,
):
    """Persist general task responses for history tracking."""
    try:
        record = GeneralTaskHistoryDB(
            user_id=user_id,
            token=token,
            task_name=task_name,
            query=query,
            answer=answer,
            response_payload=response_payload,
            created_at=created_at or datetime.utcnow(),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info("General task history logged for user_id=%s token=%s", user_id, token)
        return record
    except Exception as e:
        logger.error("Failed to log general task history: %s", str(e))
        db.rollback()
        raise


def get_general_task_by_token(db, token: str) -> Optional[GeneralTaskHistoryDB]:
    """Fetch a stored general task record via token."""
    return db.query(GeneralTaskHistoryDB).filter(GeneralTaskHistoryDB.token == token).first()


def get_general_history_for_user(db, user_id: str, limit: int) -> List[GeneralTaskHistoryDB]:
    """Fetch general task history entries for a user ordered by recency."""
    return (
        db.query(GeneralTaskHistoryDB)
        .filter(GeneralTaskHistoryDB.user_id == user_id)
        .order_by(GeneralTaskHistoryDB.created_at.desc())
        .limit(limit)
        .all()
    )
