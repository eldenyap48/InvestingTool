from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse
from django.db import IntegrityError
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, JsonResponse
import json, requests
import yfinance as yf
import re

from .models import *

def index(request):

    stocks = []
    try:
        for item in request.user.watchlist.all():
            stocks.append(item.symbol)
    except AttributeError:
        pass

    if request.user.is_authenticated:
        return render(request, "investing/index.html", {
            "title": "Investing",
            "stocks": stocks
        })

    else:
        return render(request, "investing/index.html", {
            "title": "Investing",
            "stocks": []
        })

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "investing/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "investing/login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "investing/register.html", {
                "message": "Passwords must match."
            })

        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "investing/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "investing/register.html")

# AJAX: Retrieves data about a particular stock for the index page
def get_data(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    ticker = json.loads(request.body).get("ticker")

    # Create the yahoo finance object
    info = yf.Ticker(ticker).info

    # Obtaining the various data required
    data = {}
    data["currentPrice"] = info["currentPrice"]
    data["previousClose"] = info["previousClose"]
    valueChange = info["currentPrice"] - info["previousClose"]
    percentageChange = valueChange / data["previousClose"] * 100
    if valueChange >= 0:
        data["valueChange"] = '+' + '{:.3f}'.format(valueChange)
        data["percentageChange"] = '(+' + '{:.2f}'.format(percentageChange) + '%)'
        data["change"] = "positive"
    else:
        data["valueChange"] = '{:.3f}'.format(valueChange)
        data["percentageChange"] = '(' + '{:.2f}'.format(percentageChange) + '%)'
        data["change"] = "negative"
    data["volume"] = info["volume"]
    data["market"] = info["exchange"]

    # Obtaining data about the shares the user bought
    stock = Stock.objects.filter(symbol=ticker).first()
    holdings = Holding.objects.filter(user=request.user, stock=stock).all()

    if holdings:
        total_value = 0
        pl = 0
        for holding in holdings:
            total_value += data["currentPrice"] *  float(holding.quantity)
            pl += data["currentPrice"] *  float(holding.quantity) - holding.ave_price * float(holding.quantity)
        data["pl"] = pl
        data["total_value"] = total_value
    else:
        data["total_value"] = 0
        data["pl"] = 0

    return JsonResponse({"data":data}, status=201)

# When user wants to view the page for a stock
def stock(request, stock):

    stockobj = Stock.objects.filter(symbol=stock).first()

    open_positions = []
    closed_positions = []

    if not request.user.is_anonymous:
        holdings = Holding.objects.filter(stock=stockobj, user=request.user).all()
        for holding in holdings:
            if holding.close:
                closed_positions.append(holding)
            else:
                open_positions.append(holding)

    return render(request, "investing/stock.html", {
        'stock': stockobj,
        'closed_positions':closed_positions,
        'open_positions': open_positions
    })

# AJAX: Returns the complete set of data for a stock
def get_info(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    ticker = json.loads(request.body).get("ticker")
    info = yf.Ticker(ticker).info
    return JsonResponse({"data":info}, status=201)

# AJAX: Gets price history of the stock
def get_history(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    ticker = json.loads(request.body).get("ticker")
    interval = json.loads(request.body).get("interval")
    start = json.loads(request.body).get("start")
    end = json.loads(request.body).get("end")

    # Create the yahoo finance object
    stock = yf.Ticker(ticker)

    historical_data = stock.history(start=start, end=end, interval=interval)

    # Formatting the historical data to be used for chartjs
    historical_list = historical_data.reset_index().values.tolist()
    for datapoint in historical_list:
        datapoint[0] = datapoint[0].strftime("%d %b %Y %H:%M GMT")

    return JsonResponse({"data":historical_list}, status=201)

# AJAX: Change watchlist
def change_watchlist(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    ticker = json.loads(request.body).get("ticker")
    action = json.loads(request.body).get("action")
    stockobj = Stock.objects.filter(symbol=ticker).first()

    if action == "Add":
        request.user.watchlist.add(stockobj)
    else:
        request.user.watchlist.remove(stockobj)

    return JsonResponse({"message": "Success!"}, status=201)

# When user searches for a stock or a user through the search bar
def search(request):
    query = request.GET.get('q')

    # Checking if the query is a ticker that exists on the stock market
    stockobj = Stock.objects.filter(symbol=query.upper()).first()

    users = []
    for user in User.objects.all():
        regex = "^" + query + "\w*"
        x = re.findall(regex.lower(), user.username.lower())
        if x:
            users.append(user.username)

    symbol = None

    if stockobj:
        symbol = stockobj.symbol
    else:
        ticker = yf.Ticker(query.upper())

        if ticker.info.get("regularMarketPrice") != None:
            newstockobj = Stock(symbol=query.upper())
            newstockobj.save()
            symbol = newstockobj.symbol

    return render(request, "investing/search.html", {
        'users': users,
        'symbol': symbol,
        "search_query": query
    })

# When user makes a new stock purchase/ changes a stock purchase/ deletes a stock purchase
def change_holdings(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    ticker = request.POST.get("ticker").upper()
    action = request.POST.get("action")
    quantity = request.POST.get("quantity")
    purchasePrice = request.POST.get("purchasePrice")
    id = request.POST.get("holding_id")
    closingPrice = request.POST.get("closingPrice")
    stockobj = Stock.objects.filter(symbol=ticker.upper()).first()

    if not stockobj:
        stockobj = Stock(symbol=ticker.upper())
        stockobj.save()

    if action == "add":
        if closingPrice:
            holding = Holding(stock=stockobj, user=request.user, quantity=quantity, ave_price=purchasePrice, closing_price=closingPrice, close=True)
            holding.save()
        else:
            holding = Holding(stock=stockobj, user=request.user, quantity=quantity, ave_price=purchasePrice)
            holding.save()
        # Automatically add this stock to the user's watchlist
        if stockobj not in request.user.watchlist.all():
            request.user.watchlist.add(stockobj)

    elif action == "edit":
        if closingPrice:
            holding = Holding.objects.filter(pk=id).first()
            holding.quantity = quantity
            holding.ave_price = purchasePrice
            holding.closing_price = closingPrice
            holding.close = True
        else:
            holding = Holding.objects.filter(pk=id).first()
            holding.quantity = quantity
            holding.ave_price = purchasePrice
            holding.closing_price = None
            holding.close = False
        holding.save()

    else:
        holding = Holding.objects.filter(pk=id).first()
        holding.delete()

    status = request.POST.get("status")
    if status == "portfolio":
        return HttpResponseRedirect(reverse("portfolio"))
    else:
        return HttpResponseRedirect(reverse("stock", args=[ticker]))

# When viewing a user's profile
def view_user(request, username):
    target_user = User.objects.filter(username=username).first()
    open_positions = []
    closed_positions = []

    for holding in Holding.objects.filter(user=target_user):
        if holding.close:
            closed_positions.append(holding)
        else:
            open_positions.append(holding)

    return render(request, "investing/profile.html", {
        'view_user': target_user,
        "open_positions": open_positions,
        "closed_positions": closed_positions
    })

# AJAX: When user wants to follow or unfollow another user
def change_following(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    view_user = json.loads(request.body).get("view_user")
    status = json.loads(request.body).get("status")
    view_user_obj = User.objects.filter(username=view_user).first()

    if status == "True":
        request.user.following.add(view_user_obj)
        return JsonResponse({"message": "Success!", "status":"followed"}, status=201)
    else:
        request.user.following.remove(view_user_obj)
        return JsonResponse({"message": "Success!", "status":"unfollowed"}, status=201)

# When user accesses one's own portfolio page
@login_required
def portfolio(request):

    open_positions = []
    closed_positions = []

    for holding in request.user.holdings.all():
        if holding.close:
            closed_positions.append(holding)
        else:
            open_positions.append(holding)

    return render(request, "investing/portfolio.html", {
        "open_positions": open_positions,
        "closed_positions": closed_positions,
    })

# AJAX: Returns the labels for a holding
def fetch_labels(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    id = json.loads(request.body).get("id")

    if id:
        holding = Holding.objects.filter(pk=id).first()
        labels = holding.labels.all()

    all_categories = request.user.categories.all()

    data = []
    for category in all_categories:
        datapoint = [category.category]
        try:
            datapoint.append(labels.filter(category=category).first().label)
        except:
            datapoint.append("")
        datapoint.append(category.id)
        data.append(datapoint)

    return JsonResponse({"data":data}, status=201)

# AJAX: Creates a new category
def create_category(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    category = json.loads(request.body).get("category")

    category_obj = Category(user=request.user, category=category)
    category_obj.save()

    return JsonResponse({"id": category_obj.id}, status=201)

# AJAX: Deletes a category
def delete_category(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    id = json.loads(request.body).get("id")

    category_obj = Category.objects.filter(pk=id).first()
    category_obj.delete()

    return JsonResponse({"id": "Success!"}, status=201)


# AJAX: Creates or edits a new label
def change_labels(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    dataset = json.loads(request.body).get("dataset")
    holding_id = json.loads(request.body).get("holding_id")
    holding_obj = Holding.objects.filter(pk=holding_id).first()

    for data in dataset:
        category_obj = Category.objects.filter(user=request.user, category=data[0].strip()).first()
        try:
            label_obj = Label.objects.filter(holding=holding_obj, category=category_obj).first()
            if data[1].strip() == "":
                label_obj.delete()
            else:
                label_obj.label = data[1].strip()
                label_obj.save()
        except:
            if data[1].strip() != "":
                new_label_obj = Label(holding=holding_obj, category=category_obj, label=data[1].strip())
                new_label_obj.save()

    return JsonResponse({"id": "Success!"}, status=201)

# AJAX: Returns the labels data for plotting of pie charts
def label_analysis(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=404)

    status = json.loads(request.body).get("status")

    proportion_dataset = []
    label_dataset = []
    category_list = []

    # Get all the positions owned by the user
    positions = Holding.objects.filter(user=request.user).all()
    if status == "open":
        open_positions = []
        for holding in positions:
            if not holding.close:
                open_positions.append(holding)
        positions = open_positions

    # Get all the categories created by the user
    categories = Category.objects.filter(user=request.user).all()

    # For each one of the categories
    for category in categories:
        category_list.append(category.category)

        # A list to store the different types of labels in that category
        labels = []

        # A list to store the proportion of each label in that category
        proportion = []

        # Add the 'other' label
        labels.append("Other")
        proportion.append(0)

        # For each position owned
        for position in positions:
            label = position.labels.filter(category=category).first()

            # If the label is used with the position
            if label:

                if label.label not in labels:
                    labels.append(label.label)
                    proportion.append(float(position.quantity) * position.ave_price)

                else:
                    # Index of that label in label list
                    index = labels.index(label.label)
                    proportion[index] += float(position.quantity) * position.ave_price

            # If there is no such label used for the position, then add it to the 'other' label
            else:
                proportion[0] += float(position.quantity) * position.ave_price

        label_dataset.append(labels)
        proportion_dataset.append(proportion)

    return JsonResponse({"categories":category_list, "label_dataset":label_dataset, "proportion_dataset":proportion_dataset}, status=201)

@login_required
def following(request):

    return render(request, "investing/following.html", {
        "following": request.user.following.all()
    })
