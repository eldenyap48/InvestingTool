from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("get_data", views.get_data, name="get_data"),
    path("stock/<str:stock>", views.stock, name="stock"),
    path("get_info", views.get_info, name="get_info"),
    path("get_history", views.get_history, name="get_history"),
    path("change_watchlist", views.change_watchlist, name="change_watchlist"),
    path("search", views.search, name="search"),
    path("change_holdings", views.change_holdings, name="change_holdings"),
    path("users/<str:username>", views.view_user, name="view_user"),
    path("change_following", views.change_following, name="change_following"),
    path("myPortfolio", views.portfolio, name="portfolio"),
    path("fetch_labels", views.fetch_labels, name="fetch_labels"),
    path("create_category", views.create_category, name="create_category"),
    path("delete_category", views.delete_category, name="delete_category"),
    path("change_labels", views.change_labels, name="change_labels"),
    path("label_analysis", views.label_analysis, name="label_analysis"),
    path("following", views.following, name="following")
]
