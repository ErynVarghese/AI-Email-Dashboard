from django.urls import path
from . import views

urlpatterns = [
    path('auth/login', views.login),
    path('auth/callback', views.callback),
]
