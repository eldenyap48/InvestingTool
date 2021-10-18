from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *

admin.site.register(User)
admin.site.register(Stock)
admin.site.register(Holding)
admin.site.register(Label)
admin.site.register(Category)
