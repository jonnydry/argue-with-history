from slowapi import Limiter
from slowapi.util import get_remote_address


def get_rate_limit_key(request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return first_ip
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return get_remote_address(request) or "unknown"


limiter = Limiter(key_func=get_rate_limit_key)
