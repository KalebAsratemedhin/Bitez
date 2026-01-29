from pydantic import BaseModel, Field, HttpUrl


class StripeConnectLinkRequest(BaseModel):
    return_url: str = Field(..., description="URL to redirect after onboarding (e.g. https://yourapp.com/restaurant/stripe-return)")
    refresh_url: str = Field(..., description="URL to redirect if link expires (e.g. https://yourapp.com/restaurant/stripe-refresh)")


class StripeConnectLinkResponse(BaseModel):
    url: str
