from django.shortcuts import render
from rest_framework import viewsets, generics, permissions
from rest_framework.response import Response
from .models import Model, Dataset, UserProfile
from .serializers import ModelSerializer, DatasetSerializer, UserProfileSerializer

class ModelViewSet(viewsets.ModelViewSet):
    queryset = Model.objects.all()
    serializer_class = ModelSerializer

class DatasetViewSet(viewsets.ModelViewSet):
    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer

 
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
 
    def get_object(self):
        # auto-create profile if somehow missing
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile
 