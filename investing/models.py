from django.db import models
from django.contrib.auth.models import AbstractUser

class Stock(models.Model):
    symbol = models.CharField(max_length=8)

    def __str__(self):
        return self.symbol

class User(AbstractUser):
    following = models.ManyToManyField('self', related_name="followers", symmetrical=False, blank=True)
    watchlist = models.ManyToManyField(Stock, blank=True, related_name="users_watching")
    assets = models.ManyToManyField(Stock, blank=True, related_name="assets", through="Holding")

    def total_closed_pl(self):
        pl = 0
        for holding in self.holdings.all():
            if holding.close:
                pl += holding.closing_pl()
        return pl

class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name="categories")
    category = models.CharField(max_length=64)

    def __str__(self):
        return self.user.username + ": " + self.category

    class Meta:
        verbose_name_plural = "Categories"

class Holding(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name="holdings")
    quantity = models.IntegerField()
    ave_price = models.FloatField()
    close = models.BooleanField(default=False)
    closing_price = models.FloatField(null=True)
    category = models.ManyToManyField(Category, blank=True, related_name="holdings", through="Label")

    class Meta:
        verbose_name_plural = 'Positions'

    def closing_pl(self):
        if self.closing_price:
            return round((self.closing_price - self.ave_price) * self.quantity, 2)
        else:
            return None

    def __str__(self):
        return self.user.username + " " + str(self.quantity) + " " + self.stock.symbol

class Label(models.Model):
    holding = models.ForeignKey(Holding, on_delete=models.CASCADE, null=True, related_name="labels")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True)
    label = models.CharField(max_length=64)

    def __str__(self):
        return self.label
