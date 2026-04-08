from django.shortcuts import render
from rest_framework import viewsets
from .models import Model, Dataset
from .serializers import ModelSerializer, DatasetSerializer

class ModelViewSet(viewsets.ModelViewSet):
    queryset = Model.objects.all()
    serializer_class = ModelSerializer

class DatasetViewSet(viewsets.ModelViewSet):
    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer