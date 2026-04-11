from urllib.parse import unquote, urlparse

from django.db import migrations, models


def backfill_profile_image_paths(apps, schema_editor):
    UserProfile = apps.get_model("api", "UserProfile")

    for profile in UserProfile.objects.all():
        changed_fields = []

        if profile.avatar_url and not profile.avatar_path:
            parsed_avatar = urlparse(profile.avatar_url)
            if parsed_avatar.netloc == "storage.googleapis.com":
                avatar_path = unquote(parsed_avatar.path.lstrip("/").split("/", 1)[1]) if "/" in parsed_avatar.path.lstrip("/") else ""
                if avatar_path:
                    profile.avatar_path = avatar_path
                    changed_fields.append("avatar_path")

        if profile.cover_image_url and not profile.cover_image_path:
            parsed_cover = urlparse(profile.cover_image_url)
            if parsed_cover.netloc == "storage.googleapis.com":
                cover_path = unquote(parsed_cover.path.lstrip("/").split("/", 1)[1]) if "/" in parsed_cover.path.lstrip("/") else ""
                if cover_path:
                    profile.cover_image_path = cover_path
                    changed_fields.append("cover_image_path")

        if changed_fields:
            profile.save(update_fields=changed_fields)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0005_public_usernames_and_dataset_slugs"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="avatar_path",
            field=models.CharField(blank=True, default="", max_length=1024),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="cover_image_path",
            field=models.CharField(blank=True, default="", max_length=1024),
        ),
        migrations.RunPython(backfill_profile_image_paths, migrations.RunPython.noop),
    ]
