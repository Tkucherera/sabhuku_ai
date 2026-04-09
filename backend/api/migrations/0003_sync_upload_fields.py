from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_userprofile"),
    ]

    operations = [
        migrations.AddField(
            model_name="model",
            name="file_path",
            field=models.CharField(default="", max_length=1024),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="model",
            name="license",
            field=models.CharField(blank=True, default="Custom", max_length=255),
        ),
        migrations.AddField(
            model_name="dataset",
            name="file_path",
            field=models.CharField(default="", max_length=1024),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="dataset",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="model",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.RemoveField(
            model_name="dataset",
            name="download_link",
        ),
    ]
