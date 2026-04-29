import os 
import tempfile
from celery import shared_task
from google.cloud import storage
from django.conf import settings

from .views import _build_blob_path


def generate_audio_bytes(text: str) -> bytes:
    """
    Will use qwen tts
    """
    return 


def upload_to_gcs(audio_bytes: bytes, destination_blob_name: str) -> str:
    """
    Uploads the audio bytes to Google Cloud Storage and returns the public URL.
    """
    client = storage.Client()
    bucket = client.bucket(settings.GS_MEDIA_BUCKET_NAME)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_string(audio_bytes, content_type="audio/mpeg")
    blob.make_public() 

    return blob.public_url


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_tutorial_audio(self, tutorial_id: int):
    from tutorials.models import Tutorial

    try:
        tutorial = Tutorial.objects.get(id=tutorial_id)

        # update status to processing
        Tutorial.objects.filter(id=tutorial_id).update(audio_status=Tutorial.AudioStatus.PROCESSING)

        # generate audio bytes
        audio_bytes = generate_audio_bytes(tutorial.body_markdown)

        # build blob path
        blob_path = _build_blob_path("tutorials/audio", tutorial.slug, "mp3")
        public_url = upload_to_gcs(audio_bytes, blob_path)

        # update tutorial with audio URL and status
        Tutorial.objects.filter(id=tutorial_id).update(audio_url=public_url, audio_status=Tutorial.AudioStatus.READY)

    except Tutorial.DoesNotExist:
        pass

    except Exception as exc:
        Tutorial.objects.filter(id=tutorial_id).update(audio_status=Tutorial.AudioStatus.FAILED)
        raise self.retry(exc=exc)
