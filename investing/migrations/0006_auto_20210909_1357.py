# Generated by Django 3.0.6 on 2021-09-09 13:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('investing', '0005_remove_stock_market'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='holding',
            options={'verbose_name_plural': 'Shares Bought'},
        ),
        migrations.AddField(
            model_name='holding',
            name='close',
            field=models.BooleanField(default=False),
        ),
    ]
