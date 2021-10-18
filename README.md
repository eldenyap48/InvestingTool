# CS50W Final Project (InvestingTool)

## Introduction
The InvestingTool is a versatile application used to track stock data, analyse portfolios and connect with other people.

## Requirements
- `yfinance` must be installed to obtain stock data

- A default file, `chartjs-chart-financial.js`, from `chartjs` is included in the static folder. It is essential for generating the candlestick chart.

## Why did I make this app?
As an amateur investor, I often find many of the online investing analysis platforms complicated, inflexible and convoluted. In light of this, InvestingTool serves as a user-friendly alternative for anybody to freely analyse their stocks, while also allowing investors to connect and share with one another. It has a huge potential for expansion too; with further enhancements, I'm sure it can help many new investors.

---

## How to Run the Program (for new users)
Run the program through the terminal via `python manage.py runserver IP_ADDRESS:PORT`, where IP_ADDRESS is the address assigned to you in your local network.

### Index Page [Not Logged In]
As you have yet to log into an account, select `Register` at the navigation bar to create your new account.

### Index Page [Logged In]
Once logged in, your stock watchlist will be empty as you have yet to add any stocks to it. To search for a stock, type the stock symbol into the **Search Bar**. _(Due to limitations in the yfinance API, stock names do not work, and the search must match the stock symbol exactly)._

### Search Results Page
If the search input matches a stock symbol online _exactly (case insensitive)_, it will appear in the search results. It'll be indicated as a stock ticker. If a username on the system contains the search input, it'll also appear in the results. To view the stock, select it.

### Stock Page
Detailed information about the stock is presented here, including:
1. Stock's last closing price
2. Change in the price
3. Candlestick Chart for the past 14 days
4. Analysis of your stock positions
5. Other relevant stock information for analysis

By default, the **Candlestick Chart** is set to show stock prices for the past 14 days with an interval of 1 day. You may change the parameters in the Settings box and hit `Submit` for further analysis.

As you do not currently own this stock, you do not have any positions. To **add an open position**, select `Add Position` and key in the details (leave the Closing Price field empty). Upon submission, you'll see the current value of your position and it's current Profit & Loss (P/L).

To **close your position**, simply click `Edit` and type in your closing price. To **delete your position**, select `Edit` and hit `Delete`.

**Additional information** about the stock for analysis can be found at the very bottom of the page.

To **add this stock to your watchlist**, simply click on the star beside the stock's name. A permanent yellow star indicates that it has been added. A stock is automatically added to your watchlist when a position is added. Watchlist stocks can be easily accessed on the index page.

### Profile Page
Select your username on the navbar - you'll be taken to your profile page. All your positions from various stocks are shown here. You can see the number of followers and following your account has too.

To view another user's profile, simply search for his/her username in the search bar and enter it (use John for example). You'll be able to see his/her positions; select `follow` to follow him/her.

### Portfolio Page
Select `My Portfolio` on the navbar. The portfolio page allows you to add labels to all your various positions and analyse them with charts.

To **add a category**, select edit, type in a category and click the green plus sign (E.g. type investment term). To **label the position under that category**, type in the label and click save (E.g. Short Term or Long Term). To **delete a category**, simply click on the red button beside the category.

As before, you may freely **add, edit or delete your positions.**

You may choose to **only show open positions.**

To **analyse your stocks**, click the `Analyse Positions` button. A pop-up will appear, with details including:

1. P/L of all closed and open positions
2. Overall P/L
3. Pie charts that show the distribution of stocks within each category. ___Note:___ Stocks not labelled under a category will be classified as 'other'.

Hovering over each portion of the pie chart will show the **distribution of each category**. To **remove a label**, click the label above the pie chart and it'll be automatically excluded from that category.

___Disclaimer:___
- _categories_ refer to general classifications such as: stock sector, investment term,  investment risk, etc.

- There are multiple _labels_ for each category. (E.g. under the sector category, a stock can be labelled as Technology, Healthcare or Financial)

### Following Page
To see all the people you are following, click on the `Following` tab on the navbar. This allows you to keep tabs on people you are following.

### Mobile Responsiveness
This page is mobile-responsive; it has a friendly and easy-to-use UI regardless of the screen size.

---

## Distinctiveness and Complexity
The **distinctiveness** of this application arises from its main focus on **analysis**, by allowing users to freely build various charts, something not attempted before in previous projects.

1. Through the use of the `yfinance` API, I am able to obtain real time data about any stock in the market and even convert it into a candlestick chart. Users can freely modify the candlestick chart using the various parameters to analyse the stock.

2. Those who wish to further analyse their portfolio may even freely label their positions. There is no limit to this - the program will generate pie charts for all categories created, allowing users to see their portfolio distribution.

The application is **complex** because of its heavy reliance on charting throughout. The free creation of positions, categories and labels also proved complicated.  
1. For the Stock Page, data gathered from `yfinance` had to be properly parsed, formatted and trimmed so that it could passed into `chartjs` to generate the candlestick charts.

2. Additionally, whenever users want to create a new candlestick chart, the date parameters must be properly formatted before passing to `yfinance`. The old chart needs to be completely stripped in order for the new chart to be built in its place.

3. Whenever a new position is created, a tedious process of calculation is involved (especially for open positions) just to derive the current price and the P/L.

4. Differentiating between closed and open positions proved tedious too.

5. Most challenging of all was allowing users to freely create any category with its labels - the UI had to be versatile while still being user-friendly at the same time (took quite a while debugging). To generate the pie charts for analysis, a huge amount of data needs to be properly formatted and passed from the server to the client.

6. Lastly, due to the program's heavy usage of tables, charts, buttons and numbers, creating a mobile-responsive application required integrating many responsive elements from Bootstrap. Continuous testing had to be done with various screen sizes too.
