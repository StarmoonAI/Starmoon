import hashlib
import petname
import random
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()


# Function to generate a friendly slug from a MAC address
def generate_friendly_slug(mac_address):
    # Remove colons from the MAC address
    clean_mac = mac_address.replace(":", "")

    # Hash the cleaned MAC address (SHA256)
    hash_object = hashlib.sha256(clean_mac.encode())
    hash_hex = hash_object.hexdigest()

    # Convert the hash into an integer
    random.seed(int(hash_hex, 16))

    # Generate a friendly slug using petname (3 words)
    # petname does not support a seed, so we use random.seed to ensure consistency
    words = [petname.Generate() for _ in range(3)]

    # Join words with hyphens for a slug-like output
    slug = "-".join(words)

    return slug


# API endpoint to generate a client token
@router.get("/create_friendly_slug")
async def generate_client_token(address: str):
    try:
        print("address", address)
        # Generate JWT token
        return JSONResponse(content={"friendly_slug": generate_friendly_slug(address)})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
