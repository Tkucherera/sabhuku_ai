from django.db import migrations, models
from django.utils.text import slugify


def _unique_value(model, field_name, raw_value, fallback, exclude_pk=None, max_length=255):
    base_value = slugify(raw_value or "")[:max_length].strip("-") or fallback
    candidate = base_value
    suffix = 1

    while model.objects.exclude(pk=exclude_pk).filter(**{field_name: candidate}).exists():
        suffix_value = f"-{suffix}"
        candidate = f"{base_value[: max_length - len(suffix_value)]}{suffix_value}"
        suffix += 1

    return candidate


def backfill_public_usernames_and_dataset_slugs(apps, schema_editor):
    UserProfile = apps.get_model("api", "UserProfile")
    Dataset = apps.get_model("api", "Dataset")

    for profile in UserProfile.objects.select_related("user").all():
        profile.public_username = _unique_value(
            UserProfile,
            "public_username",
            profile.user.first_name or profile.user.username or profile.user.email,
            "user",
            exclude_pk=profile.pk,
            max_length=50,
        )
        profile.save(update_fields=["public_username"])

    for dataset in Dataset.objects.all():
        dataset.slug = _unique_value(
            Dataset,
            "slug",
            dataset.name,
            "dataset",
            exclude_pk=dataset.pk,
            max_length=255,
        )
        dataset.save(update_fields=["slug"])


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_profile_images"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            DROP INDEX IF EXISTS api_dataset_slug_0d076f07_like;
            DROP INDEX IF EXISTS api_dataset_slug_0d076f07;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AddField(
            model_name="dataset",
            name="slug",
            field=models.SlugField(blank=True, db_index=False, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="dataset",
            name="subtitle",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="dataset",
            name="dataset_thumbnail",
            field=models.CharField(blank=True, default="", max_length=1024),
        ),
        migrations.AddField(
            model_name="dataset",
            name="is_public",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="dataset",
            name="coverage_start_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dataset",
            name="coverage_end_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dataset",
            name="authors",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="dataset",
            name="source",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="dataset",
            name="usability_score",
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name="dataset",
            name="tags",
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="public_username",
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
        migrations.RunPython(backfill_public_usernames_and_dataset_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="dataset",
            name="slug",
            field=models.SlugField(blank=True, max_length=255, unique=True),
        ),
    ]
