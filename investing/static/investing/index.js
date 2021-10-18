document.addEventListener('DOMContentLoaded', () => {

    // Template for displaying the stocks on users' watchlist
    const template = Handlebars.compile(document.querySelector("#template").innerHTML);
    document.querySelector("#login").style.display = "none";
    document.querySelector("#message").style.display = "none";

    if (stocks.length === 0){
        if (authenticated){
            document.querySelector("#message").style.display = "block";
        }
        else {
            document.querySelector("#login").style.display = "block";
        }
    }

    for (var i = 0; i < stocks.length; i++){
        let ticker = stocks[i];

        // Obtain data from database
        let csrftoken = Cookies.get('csrftoken');
        fetch('/get_data', {
            method:'POST',
            body: JSON.stringify({
                "ticker":ticker,
            }),
            headers: {"X-CSRFToken": csrftoken}
        })
        .then(response => response.json())
        .then(message => {
            var data = message.data;
            const content = template({
                'market':data.market,
                'stock':ticker,
                'price': data.currentPrice,
                'valueChange': data.valueChange,
                'percentageChange': data.percentageChange,
                'volume': data.volume,
                "total_value": data.total_value.toFixed(2),
                "pl": data.pl.toFixed(2),
                "change": data.change
            });
            document.querySelector("#wrapper").innerHTML += content;

            updateColors();
        });
    }

});

function updateColors() {
    document.querySelectorAll(".content").forEach(target => {
        let change = target.querySelector(".price").dataset.change;
        if (change === "negative") {
            target.querySelector(".price").style.color = 'red';
            target.querySelector(".change_value").style.backgroundColor = 'red';
        }
        else {
            target.querySelector(".price").style.color = 'green';
            target.querySelector(".change_value").style.backgroundColor = 'green';
        }

        let pl_value = parseFloat(target.querySelector(".PL_value").innerHTML);
        if (pl_value > 0){
            target.querySelector(".PL_value").style.color = 'green';
        }
        else{
            target.querySelector(".PL_value").style.color = 'red';
        }
    });
}
