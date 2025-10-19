from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

# Enums matching database enums
class UserRole(str, Enum):
    STUDENT = "student"
    LAWYER = "lawyer"
    ADVOCATE = "advocate"
    INTERN = "intern"
    ORGANISATION = "organisation"

class IndianState(str, Enum):
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
    ANDAMAN_NICOBAR = "Andaman and Nicobar Islands"
    CHANDIGARH = "Chandigarh"
    DADRA_NAGAR_HAVELI_DAMAN_DIU = "Dadra and Nagar Haveli and Daman and Diu"
    DELHI = "Delhi"
    JAMMU_KASHMIR = "Jammu and Kashmir"
    LADAKH = "Ladakh"
    LAKSHADWEEP = "Lakshadweep"
    PUDUCHERRY = "Puducherry"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class User(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    verified_email: bool = False
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    verified_email: bool = False

class UserInDB(User):
    hashed_password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

class GoogleUserInfo(BaseModel):
    id: str
    email: str
    verified_email: bool
    name: str
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    picture: Optional[str] = None
    locale: Optional[str] = None

class UserInfo(BaseModel):
    id: Optional[int] = None
    user_id: str
    full_name: Optional[str] = None
    profile_pic: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    phone_verified: bool = False
    state: Optional[IndianState] = None
    iam_a: Optional[UserRole] = None
    user_status: UserStatus = UserStatus.PENDING
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            # Remove any spaces or special characters
            phone = ''.join(filter(str.isdigit, v))
            if len(phone) != 10:
                raise ValueError('Phone number must be exactly 10 digits')
            if not phone.startswith(('6', '7', '8', '9')):
                raise ValueError('Indian phone number must start with 6, 7, 8, or 9')
        return v

class UserInfoCreate(BaseModel):
    # user_id is NOT required - it will be taken from the authenticated user
    full_name: Optional[str] = None
    profile_pic: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    phone_verified: bool = False
    state: Optional[IndianState] = None
    iam_a: Optional[UserRole] = None
    user_status: UserStatus = UserStatus.PENDING
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            phone = ''.join(filter(str.isdigit, v))
            if len(phone) != 10:
                raise ValueError('Phone number must be exactly 10 digits')
            if not phone.startswith(('6', '7', '8', '9')):
                raise ValueError('Indian phone number must start with 6, 7, 8, or 9')
        return v

class UserInfoUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_pic: Optional[str] = None
    phone: Optional[str] = None
    phone_verified: Optional[bool] = None
    state: Optional[IndianState] = None
    iam_a: Optional[UserRole] = None
    user_status: Optional[UserStatus] = None
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            phone = ''.join(filter(str.isdigit, v))
            if len(phone) != 10:
                raise ValueError('Phone number must be exactly 10 digits')
            if not phone.startswith(('6', '7', '8', '9')):
                raise ValueError('Indian phone number must start with 6, 7, 8, or 9')
        return v

class AuthLog(BaseModel):
    id: int
    user_id: str
    email: str
    action: str
    status: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    error_message: Optional[str] = None
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DocumentAnalysisResponse(BaseModel):
    token: str
    task: str
    result: str
    prompt: Optional[str] = None
    source_excerpt: Optional[str] = None
    model: Optional[str] = None
    user_email: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AssistantHistory(BaseModel):
    id: int
    user_id: str
    task_name: str
    question: str
    answer: str
    created_at: datetime
    response_time_ms: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class GeneralSource(BaseModel):
    score: float
    layer: str
    collection: Optional[str] = None
    doc_title: Optional[str] = None
    section_number: Optional[str] = None
    section_heading: Optional[str] = None
    breadcrumbs: Optional[str] = None
    snippet: Optional[str] = None
    act_title: Optional[str] = None
    context_path: Optional[str] = None
    heading: Optional[str] = None
    unit_id: Optional[str] = None


class GeneralResponsePayload(BaseModel):
    query: str
    answer: str
    expanded_queries: List[str]
    sources: List[GeneralSource]
    validation: Optional[str] = None


class GeneralTaskRecord(BaseModel):
    id: int
    user_id: str
    token: str
    task_name: str
    query: str
    answer: str
    created_at: datetime
    response: GeneralResponsePayload


class HistoryEntry(BaseModel):
    id: int
    entry_type: Literal["analysis", "general"]
    user_id: str
    task_name: str
    question: str
    answer: str
    created_at: datetime
    response_time_ms: Optional[int] = None
    token: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
