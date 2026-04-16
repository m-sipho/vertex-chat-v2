from dotenv import load_dotenv
import boto3
import logging
from PIL import Image
import io
import os
from app.api.rooms.dependencies import global_manager
from fastapi import UploadFile
import uuid

load_dotenv()

# Configure logging
logger = logging.getLogger("images")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)

logger.addHandler(handler)

class AssetsService:
    def __init__(self):
        self.bucket_name = os.getenv("S3_BUCKET_NAME")
        self.region_name = os.getenv("AWS_REGION_NAME")
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name= self.region_name
        )
    
    async def upload_to_s3(self, file: UploadFile, room_code: str):
        """Upload file to an S3 bucket"""
        # Check if the room exists
        room_state = await global_manager.get_room_state(room_code)

        if room_state:
            # Get the dimensions of the image
            content = await file.read()
            img = Image.open(io.BytesIO(content))
            width, height = img.size

            # Generate a unique filename
            filename = f"{uuid.uuid4()}-{file.filename}"
            s3_key = f"rooms/{room_code}/{filename}"

            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=content,
                ContentType=file.content_type,
                Metadata={
                    "width": str(width),
                    "height": str(height)
                }
            )

        return {
            "filename": filename,
            "width": width,
            "height": height
        }
    
    def generate_presigned_url(self, room_code: str, filename: str, expiry: int = 3600) -> str:
        """Generate a presigned URL for viewing an S3 object"""
        s3_key = f"rooms/{room_code}/{filename}"
        url = self.s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": s3_key},
            ExpiresIn=expiry
        )

        return url