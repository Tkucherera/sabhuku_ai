from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Model, Dataset, UserProfile

class ModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Model
        fields = "__all__"

class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = "__all__"

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    date_joined = serializers.DateTimeField(source="user.date_joined", read_only=True)
 
    class Meta:
        model = UserProfile
        fields = ["username", "email", "date_joined", "bio", "location", "title", "twitter", "linkedin", "github"]
 