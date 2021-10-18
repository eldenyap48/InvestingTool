document.addEventListener('DOMContentLoaded', () => {

    // Obtain information about the stock
    let csrftoken = Cookies.get('csrftoken');
    fetch('/get_info', {
        method:'POST',
        body: JSON.stringify({
            "ticker":ticker,
        }),
        headers: {"X-CSRFToken": csrftoken}
    })
    .then(response => response.json())
    .then(message => {
        var info = message.data;
        document.querySelector("#stock_name").innerHTML = info.longName;

        // Adding the current price and price change of the stock
        document.querySelector('#currentPrice').innerHTML = "$" + info.currentPrice.toFixed(2).toString();
        var change = info.currentPrice - info.previousClose;
        var percentageChange = (change / info.previousClose) * 100;
        document.querySelector('#change').innerHTML = change.toFixed(2).toString() + " (" + percentageChange.toFixed(2).toString() +"%)"

        if (change >= 0){
            document.querySelector('#currentPrice').style.color = "green";
            document.querySelector('#change').style.backgroundColor = 'green';
        }
        else {
            document.querySelector('#currentPrice').style.color = "red";
            document.querySelector('#change').style.backgroundColor = 'red';
        }

        // Calculating the P/L value for open positions
        document.querySelectorAll('.open_holding').forEach(row => {
            var quantity = parseFloat(row.querySelector(".quantity").innerHTML);
            var ave_price = parseFloat(row.querySelector(".ave_price").innerHTML);
            var totalValue = quantity * info.currentPrice;
            var pl = totalValue - quantity * ave_price;
            row.querySelector(".currentValue").innerHTML = totalValue.toFixed(2);
            row.querySelector(".pl").innerHTML = pl.toFixed(2);
            if (pl < 0){
                row.querySelector(".pl").style.color = "red";
            }
            else {
                row.querySelector(".pl").style.color = "green";
            }
        });

        // Updating the various information about the stock
        var information_list = {
            "Prev. Close": "previousClose",
            "Revenue": "totalRevenue",
            "Open": "open",
            "EPS": "trailingEps",
            "Volume": "volume",
            "Market Cap.": "marketCap",
            "Dividend Yield": "dividendYield",
            "PE Ratio": "forwardPE",
            "PEG Ratio": "pegRatio",
            "52 Week Change": "52WeekChange",
            "Target Mean Price": "targetMeanPrice",
            "Debt to Equity": "debtToEquity",
            "Beta": "beta",
            "Last Dividend Date": "lastDividendDate",
            "EX Dividend Date": "exDividendDate"
        }

        const template = Handlebars.compile(document.querySelector("#template").innerHTML);
        for (let key in information_list){
            let keyword = information_list[key]
            let data = info[keyword]
            if (keyword === "exDividendDate" || keyword === "lastDividendDate"){
                if (data){
                    date = new Date(data * 1000);
                    data = date.toLocaleString('en-US', {
                        day: 'numeric',
                        year: 'numeric',
                        month: 'short'
                    });
                }
            }
            const content = template({
                'information': key + ": ",
                'data': data
            });
            document.querySelector(".flex-wrap").innerHTML += content;
        }
    });

    // When user hovers over the watchlist button
    var watchlist = document.querySelector('#watchlist');
    watchlist.onmouseover = () => {
        if (watchlist.dataset.state === "activated"){
            watchlist.innerHTML = "&star;";
        }
        else {
            watchlist.innerHTML = "&starf;";
        }
    };
    watchlist.onmouseout = () => {
        if (watchlist.dataset.state === "activated"){
            watchlist.innerHTML = "&starf;";
        }
        else {
            watchlist.innerHTML = "&star;";
        }
    };

    // When user clicks on the watchlist button
    watchlist.onclick = () => {
        if (watchlist.dataset.state === "activated"){
            watchlist.dataset.state = "unactivated";
            watchlist.innerHTML = "&star;";
            var action = "Remove";
            var message = document.querySelector('#message');
            message.innerHTML = "Removed from Watchlist";
        }
        else{
            watchlist.dataset.state = "activated";
            watchlist.innerHTML = "&starf;";
            var action = "Add";
            var message = document.querySelector('#message');
            message.innerHTML = "Added to Watchlist";
        }

        // Reset the animation and play it again
        message.classList.remove("animation");
        void message.offsetWidth;
        message.classList.add("animation");
        message.style.display = "block"
        message.style.animationPlayState = 'running';
        message.onanimationend = () => {message.style.display = "none"};

        // To add or remove from the watchlist
        fetch('/change_watchlist', {
            method:'POST',
            body: JSON.stringify({
                "ticker":ticker,
                "action": action
            }),
            headers: {"X-CSRFToken": csrftoken}
        });
    };


    // Changing candlestick graph
    document.querySelector('#view_history').onclick = () => {

        var start = document.querySelector('#start').value;
        var end = document.querySelector('#end').value;
        var interval = document.querySelector('#interval').value;
        var data_points = [];

        // Obtain historical data of the stock
        fetch('/get_history', {
            method:'POST',
            body: JSON.stringify({
                "ticker": ticker,
                "start": start,
                "end": end,
                "interval": interval,
            }),
            headers: {"X-CSRFToken": csrftoken}
        })
        .then(response => response.json())
        .then(message => {
            data = message.data;
            for (var i=0; i<data.length; i++){
                let date = luxon.DateTime.fromRFC2822(data[i][0]);
                if (data[i][1] === null){
                    continue;
                }
                var data_point = {
                    x: date.valueOf(),
                    o: Math.round(data[i][1] * 100)/100,
                    h: Math.round(data[i][2] * 100)/100,
                    l: Math.round(data[i][3] * 100)/100,
                    c: Math.round(data[i][4] * 100)/100,
                };
                data_points.push(data_point);
            }

            var oldCanvas = document.querySelector('#history');
            oldCanvas.remove();
            var container = document.querySelector('.col-md-8');
            var newCanvas = document.createElement('canvas');
            newCanvas.id = 'history';
            newCanvas.height = "250";
            newCanvas.width = "400";
            container.append(newCanvas);

            var ctx = document.getElementById('history').getContext('2d');
            var history = new Chart(ctx, {
                type: 'candlestick',
                data: {
                    datasets: [{
                        label: 'Candlestick Chart',
                        data: data_points,
                    }]
                },
                options: {
                }
            });
        })
    };

    // When user wants to add a new stock purchase
    document.querySelector("#add").onclick = () => {
        document.querySelector("#edit_form").style.visibility="visible";

        // Create a new form
        document.querySelector("#ticker").value = ticker;
        document.querySelector("#quantity").value = "";
        document.querySelector("#purchasePrice").value = "";
        document.querySelector("#submit_edit").innerHTML = "Add";
        document.querySelector("#delete_entry").style.visibility = "hidden";
        document.querySelector("#header").innerHTML = "Add to Portfolio";
        document.querySelector("#action").value = "add";

        document.querySelector(".close").onclick = () => {
            document.querySelector("#edit_form").style.visibility="hidden";
            document.querySelector("#delete_entry").style.visibility = "hidden";
        };
    };

    // When user wants to edit or delete a previous stock purchase
    document.querySelectorAll(".edit").forEach(button => {
        button.onclick = () => {
            document.querySelector("#edit_form").style.visibility="visible";

            // Populate the values in the form
            document.querySelector("#ticker").value = ticker;
            document.querySelector("#quantity").value = button.dataset.quantity;
            document.querySelector("#purchasePrice").value = button.dataset.price;
            document.querySelector("#submit_edit").innerHTML = "Edit";
            document.querySelector("#delete_entry").style.visibility = "visible";
            document.querySelector("#header").innerHTML = "Edit Details";
            document.querySelector("#holding_id").value = button.dataset.id;
            document.querySelector("#action").value = "edit";
            if (button.dataset.close === "True"){
                document.querySelector("#closingPrice").value = button.dataset.closingprice;
            }

            document.querySelector("#delete_entry").onclick = () => {
                document.querySelector("#action").value = "delete";
            };

            document.querySelector(".close").onclick = () => {
                document.querySelector("#edit_form").style.visibility="hidden";
                document.querySelector("#delete_entry").style.visibility = "hidden";
            };

            return false;
        };
    });
})
