document.addEventListener('DOMContentLoaded', () => {

    // Updating total closed P/L
    var total_closed_pl = 0.00;
    document.querySelectorAll(".closed_not_empty").forEach(holding => {
        total_closed_pl += parseFloat(holding.querySelector(".pl").innerHTML);
    });
    document.querySelector("#close_pl").innerHTML = "$" + total_closed_pl.toFixed(2);
    if (total_closed_pl >= 0){
        document.querySelector("#close_pl").style.color = "green";
    }
    else{
        document.querySelector("#close_pl").style.color = "red";
    }

    // When user wants to hide the closed positions in portfolio container
    document.querySelector("#check").onclick = () => {
        let value = document.querySelector("#check").checked;
        if (value === true){
            document.querySelectorAll(".closed_holding").forEach(tr => {
                tr.style.display = "none";
            });
        }
        else {
            document.querySelectorAll(".closed_holding").forEach(tr => {
                location.reload();
            });
        }
    }

    // When user wants to hide the closed positions in analysis container
    document.querySelector("#check_analysis").onclick = () => {
        let value = document.querySelector("#check_analysis").checked;
        if (value === true){
            showAnalysis("open");
        }
        else {
            showAnalysis("all");
        }
    }

    // Get the current price of stocks in open positions
    var total_open_pl = parseFloat(0.00);
    document.querySelectorAll(".open_holding").forEach(tr => {

        let csrftoken = Cookies.get('csrftoken');
        fetch('/get_info', {
            method:'POST',
            body: JSON.stringify({
                "ticker": tr.querySelector(".stock").innerHTML,
            }),
            headers: {"X-CSRFToken": csrftoken}
        })
        .then(response => response.json())
        .then(message => {
            let currentPrice = message.data.currentPrice;
            tr.querySelector(".currentPrice").innerHTML = currentPrice.toFixed(2);
            let purchasePrice = parseFloat(tr.querySelector(".ave_price").innerHTML);
            let quantity = parseFloat(tr.querySelector(".quantity").innerHTML);
            let pl = quantity * (currentPrice - purchasePrice);
            total_open_pl = total_open_pl + parseFloat(pl.toFixed(2));

            tr.querySelector(".pl").innerHTML = pl.toFixed(2);
            if (pl >= 0){
                tr.querySelector(".pl").style.color = "green";
            }
            else{
                tr.querySelector(".pl").style.color = "red";
            }

            document.querySelector("#open_pl").innerHTML = "$" + total_open_pl.toFixed(2);
            var overall_pl = total_open_pl + total_closed_pl;
            document.querySelector("#overall_pl").innerHTML = "$" + overall_pl.toFixed(2);

            if (total_open_pl >= 0){
                document.querySelector("#open_pl").style.color = "green";
            }
            else{
                document.querySelector("#open_pl").style.color = "red";
            }
            if (overall_pl >= 0){
                document.querySelector("#overall_pl").style.color = "green";
            }
            else{
                document.querySelector("#overall_pl").style.color = "red";
            }
        });

    })

    // When user wants to hide the form
    document.querySelector(".close").onclick = () => {
        document.querySelector("#form").style.display="none";
        document.querySelector("#form").classList.remove("d-flex");
    };

    // When users want to add a new position
    document.querySelector("#add").onclick = () => {

        document.querySelector("#form").style.display="block";
        document.querySelector("#form").classList.add("d-flex");
        window.scrollTo(0,document.body.scrollHeight);

        // Set the variables
        document.querySelector("#header").innerHTML="Add Position";
        document.querySelector("#ticker").value="";
        document.querySelector("#quantity").value="";
        document.querySelector("#purchasePrice").value="";
        document.querySelector("#closingPrice").value="";
        document.querySelector("#delete_entry").style.display="none";
        document.querySelector("#action").value="add";
        document.querySelector("#overall_label_container").style.display="none";

        fetchLabels("");

    }

    // When users want to edit a current position
    document.querySelectorAll(".edit").forEach(button => {

        button.onclick = () => {
            document.querySelector("#form").style.display="block";
            document.querySelector("#form").classList.add("d-flex");
            window.scrollTo(0,document.body.scrollHeight);

            //Set the variables
            document.querySelector("#header").innerHTML="Edit Position";
            document.querySelector("#ticker").value=button.dataset.stock;
            document.querySelector("#quantity").value=button.dataset.quantity;
            document.querySelector("#purchasePrice").value=button.dataset.price;
            document.querySelector("#delete_entry").style.display="block";
            document.querySelector("#holding_id").value=button.dataset.id;
            document.querySelector("#overall_label_container").style.display="block";
            document.querySelector("#action").value="edit";

            if (button.dataset.close === "True"){
                document.querySelector("#closingPrice").value=button.dataset.closingprice;
            }
            else{
                document.querySelector("#closingPrice").value="";
            }

            // Show the current labels for the position
            fetchLabels(parseInt(button.dataset.id));

            // When users want to create a new category
            document.querySelector("#addCategory").onclick = () => {

                if (document.querySelector("#newCategory").value !== ""){

                    let csrftoken = Cookies.get('csrftoken');
                    fetch('/create_category', {
                        method:'POST',
                        body: JSON.stringify({
                            "category": document.querySelector("#newCategory").value,
                        }),
                        headers: {"X-CSRFToken": csrftoken}
                    })
                    .then(response => response.json())
                    .then(data => {
                        let template2 = Handlebars.compile(document.querySelector("#template").innerHTML);
                        let content2 = template2({
                            'category': document.querySelector("#newCategory").value,
                            'data': "",
                            'category_id': data.id
                        });
                        let temp = [];
                        document.querySelectorAll(".label").forEach(input => {
                            temp.push(input.value);
                        })
                        document.querySelector("#label_form").innerHTML += content2;
                        let i = 0;
                        document.querySelectorAll(".label").forEach(input => {
                            if (temp[i]){
                                input.value = temp[i];
                            }
                            i++;
                        })
                        document.querySelector("#newCategory").value = "";

                        // When users want to delete a label
                        document.querySelectorAll(".delete_label").forEach(btn => {

                            btn.onclick = () => {

                                btn.parentNode.parentNode.remove();
                                fetch('/delete_category', {
                                    method:'POST',
                                    body: JSON.stringify({
                                        "id": parseInt(btn.dataset.id),
                                    }),
                                    headers: {"X-CSRFToken": csrftoken}
                                });

                            };

                        });
                    });

                }

            }

            // Updating labels
            document.querySelector("#submit_edit").onclick = () => {
                if (document.querySelector("#action").value === "edit"){
                    changeLabels(parseInt(button.dataset.id))
                }
            }

            document.querySelector("#delete_entry").onclick = () => {
                document.querySelector("#action").value="delete";
            }
        }

    });

    // When users want to analyse positions
    document.querySelector("#analyse").onclick = () => {showAnalysis("all")};
});


function fetchLabels(id){

    let csrftoken = Cookies.get('csrftoken');
    fetch('/fetch_labels', {
        method:'POST',
        body: JSON.stringify({
            "id": id,
        }),
        headers: {"X-CSRFToken": csrftoken}
    })
    .then(response => response.json())
    .then(data => {

        document.querySelector("#newCategory").value = "";

        // Remove all the current labels
        document.querySelector("#label_form").querySelectorAll('.single_label').forEach(label => {
            label.remove();
        })

        // Add new labels
        const template = Handlebars.compile(document.querySelector("#template").innerHTML);

        data.data.forEach(dp => {
            const content = template({
                'category': dp[0],
                'data': dp[1],
                'category_id': dp[2]
            });
            document.querySelector("#label_form").innerHTML += content;
        })

        // When users want to delete a label
        document.querySelectorAll(".delete_label").forEach(btn => {

            btn.onclick = () => {

                btn.parentNode.parentNode.remove();
                fetch('/delete_category', {
                    method:'POST',
                    body: JSON.stringify({
                        "id": parseInt(btn.dataset.id),
                    }),
                    headers: {"X-CSRFToken": csrftoken}
                });

            };

        });

    });
}

function changeLabels(holding_id){

    var dataset = [];
    document.querySelectorAll(".single_label").forEach(label => {
        let data = [];
        let category = label.querySelector(".category").innerHTML;
        let text = label.querySelector(".label").value;
        data.push(category);
        data.push(text);
        dataset.push(data)
    });

    let csrftoken = Cookies.get('csrftoken');
    fetch('/change_labels', {
        method:'POST',
        body: JSON.stringify({
            "dataset": dataset,
            "holding_id": holding_id
        }),
        headers: {"X-CSRFToken": csrftoken}
    });
}

function showAnalysis(status){

    var analysis_container = document.querySelector("#analysis_container");
    analysis_container.querySelectorAll(".category").forEach(canvas => {
        canvas.remove()
    });
    analysis_container.querySelectorAll(".title").forEach(title => {
        title.remove()
    });

    document.querySelector("#portfolio_container").style.display="none";
    document.querySelector("#analysis_container").style.display="block";

    document.querySelector("#close_analysis").onclick = () => {
        document.querySelector("#portfolio_container").style.display="block";
        document.querySelector("#analysis_container").style.display="none";
    };

    if (status == "open"){
        document.querySelector("#close_pl").parentNode.style.display = "none";
        document.querySelector("#overall_pl").parentNode.style.display = "none";
    }
    else {
        document.querySelector("#close_pl").parentNode.style.display = "block";
        document.querySelector("#overall_pl").parentNode.style.display = "block";
    }

    let csrftoken = Cookies.get('csrftoken');
    fetch('/label_analysis', {
        method:'POST',
        body: JSON.stringify({
            "status": status,
        }),
        headers: {"X-CSRFToken": csrftoken}
    })
    .then(response => response.json())
    .then(data => {

        var container = document.querySelector("#analysis_container");

        for (var i=0; i<data.categories.length;i++){

            var category = data.categories[i];
            var labels = data.label_dataset[i];
            var proportion = data.proportion_dataset[i];
            let title = document.createElement("h3");
            title.innerHTML = "By " + category.toString();
            title.classList.add("mt-5")
            title.classList.add("title")
            container.appendChild(title);

            var canvas = document.createElement("canvas");
            canvas.width = "200";
            canvas.height = "200";
            canvas.id = category;
            canvas.classList.add("category");
            container.appendChild(canvas);

            var ctx = document.getElementById(category).getContext('2d');
            var myChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: proportion,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    radius:"50%",
                    animateRotate: true,
                    animateScale: true,
                    responsive: true,
                    aspectRatio: 2.2
                }
            })
        }

    });

}
