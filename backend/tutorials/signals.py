from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Tutorial
from .tasks import generate_tutorial_audio

@receiver(pre_save, sender=Tutorial)
def trigger_audio_on_publish(sender, instance, **kwargs):
    if not instance.pk:
        return
    
    try:
        previous = Tutorial.objects.get(pk=instance.pk)
    except Tutorial.DoesNotExist:
        return
    
    # Olny trigger when status changes to published and make_audio is True
    if previous.status != Tutorial.STATUS_PUBLISHED and instance.status == Tutorial.STATUS_PUBLISHED and instance.make_audio:
        from django.db import transaction
        transaction.on_commit(lambda: generate_tutorial_audio.delay(instance.pk))